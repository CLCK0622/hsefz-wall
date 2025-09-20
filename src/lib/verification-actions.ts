// lib/verification-actions.ts
'use server';
import {auth, clerkClient} from '@clerk/nextjs/server';
import { db } from './db';
import {z, ZodError} from 'zod';
import { verificationRequestSchema } from '@/lib/verification_schema';
import {revalidatePath} from "next/cache";

// --- 这是一个不导出的辅助函数，用于封装批准用户的核心逻辑 ---
async function approveUser(clerkId: string, name: string, email?: string) {
    const user = await (await clerkClient()).users.getUser(clerkId);

    if (email && email.endsWith('@hsefz.cn')) {
        const existingEmail = user.emailAddresses.find(e => e.emailAddress === email);

        if (existingEmail) {
            await (await clerkClient()).users.updateUser(clerkId, { primaryEmailAddressID: existingEmail.id });
        } else {
            // --- 核心修改在这里 ---
            // 使用正确的 clerkClient().emailAddresses.createEmailAddress() 方法
            const newEmail = await (await clerkClient()).emailAddresses.createEmailAddress({
                userId: clerkId,
                emailAddress: email,
            });
            // --------------------

            await (await clerkClient()).users.updateUser(clerkId, { primaryEmailAddressID: newEmail.id });
        }
    }

    // 更新用户姓名和认证状态
    await (await clerkClient()).users.updateUser(clerkId, {
        firstName: name,
        lastName: '', // 将姓氏清空，以符合“姓+名”都在 firstName 的格式
    });

    await (await clerkClient()).users.updateUserMetadata(clerkId, {
        publicMetadata: {
            ...user.publicMetadata,
            verified: true
        }
    });
}

// --- 新增: 自动验证 Action ---
export async function autoVerifyAction(formData: FormData) {
    const { userId: clerkId } = await auth();
    const clerkUser = await (await clerkClient()).users.getUser(clerkId || '');
    if (!clerkId || !clerkUser) throw new Error('用户未登录');

    const realName = formData.get('realName') as string;
    if (!realName) throw new Error('真实姓名不能为空');

    const email = clerkUser.primaryEmailAddress?.emailAddress;
    if (!email || !email.endsWith('@hsefz.cn')) {
        throw new Error('当前主邮箱不是 hsefz.cn 邮箱，无法自动验证');
    }
    const emailPrefix = email.split('@')[0];

    // 调用外部 API
    // !! 警告：在生产环境中，这应该是一个 https 地址 !!
    const response = await fetch(`http://43.143.57.12/verify/?mail=${emailPrefix}`);
    if (!response.ok) {
        // API 返回错误，可能意味着该邮箱不在可验证的数据库中
        throw new Error('验证失败：此邮箱未在认证数据库中找到。请尝试手动申请。');
    }

    const data = await response.json();
    const apiName = data.name;

    // 对比姓名
    if (apiName === realName) {
        // 姓名匹配，执行批准逻辑
        await approveUser(clerkId, apiName, email);
        revalidatePath('/'); // 刷新路径让用户可以继续访问
        return { success: true, message: '验证成功！' };
    } else {
        throw new Error('验证失败：真实姓名与邮箱不匹配。');
    }
}

const serverRequestSchema = verificationRequestSchema.extend({
    imageUrl: z.string().url({ message: '图片 URL 无效' }),
});

// 1. 修改函数签名，接收一个普通对象
export async function submitVerificationRequestAction(data: {
    realName: string;
    classNumber: string;
    email: string;
    imageUrl: string;
}) {
    const { userId: clerkId } = await auth();
    if (!clerkId) throw new Error('用户未登录');

    const user = await db.selectFrom('users').select('id').where('clerk_id', '=', clerkId).executeTakeFirst();
    if (!user) throw new Error('用户不存在');

    try {
        // 2. 将 Zod 校验放在 try 块中
        const validatedData = serverRequestSchema.parse(data);

        const { realName, classNumber, email, imageUrl } = validatedData;

        const existingUserWithEmail = await db.selectFrom('users')
            .select('id')
            .where('email', '=', email)
            .executeTakeFirst();

        if (existingUserWithEmail) {
            throw new Error('此 hsefz.cn 邮箱已被平台上的其他账户使用。');
        }

        if (email.endsWith('@hsefz.cn')) {
            const emailPrefix = email.split('@')[0];
            const response = await fetch(`http://43.143.57.12/verify/?mail=${emailPrefix}`);
            if (response.ok) {
                const apiData = await response.json();
                // 如果 API 数据库中存在此人，但提交的姓名不匹配，则拒绝提交，防止冒名
                if (apiData.name !== realName) {
                    throw new Error('提交失败：您提供的姓名与该邮箱在认证数据库中的记录不符。');
                }
            }
            // 如果 API 中不存在此人，则允许提交，等待管理员审核
        }
        // ------------------------------------------------------

        const details = `姓名: ${realName}, 班级: ${classNumber}`;

        await db.insertInto('manual_verifications')
            .values({
                user_id: user.id,
                clerk_user_id: clerkId,
                details_text: details,
                image_url: imageUrl,
                requested_email: email,
                status: 'pending',
            })
            .execute();


        await db.insertInto('manual_verifications')
            .values({
                user_id: user.id,
                clerk_user_id: clerkId,
                details_text: details,
                image_url: imageUrl,
                requested_email: email,
                status: 'pending',
            })
            .execute();

        return { success: true, message: '您的申请已提交，请等待管理员审核。' };
    } catch (error) {
        // 3. 捕获错误，并判断它是否是 ZodError
        if (error instanceof ZodError) {
            throw new Error(error.issues[0].message);
        }
        // 如果是其他类型的错误，则抛出一个通用的、安全的信息
        throw new Error('提交失败，请稍后重试。');
    }

    return { success: true, message: '您的申请已提交，请等待管理员审核。' };
}

export async function getUserVerificationStatusAction() {
    const { userId: clerkId } = await auth();
    if (!clerkId) return null;

    const latestRequest = await db.selectFrom('manual_verifications')
        .select('status')
        .where('clerk_user_id', '=', clerkId)
        .orderBy('created_at', 'desc')
        .executeTakeFirst();

    return latestRequest?.status || null; // 返回 'pending', 'rejected' 或 null
}