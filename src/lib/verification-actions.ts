// lib/verification-actions.ts
'use server';
import {auth, clerkClient} from '@clerk/nextjs/server';
import {db} from './db';
import {z, ZodError} from 'zod';
import {verificationRequestSchema} from '@/lib/verification_schema';
import {revalidatePath} from "next/cache";
import {put} from "@vercel/blob";

type ActionState = {
    success: boolean;
    message: string;
};

// --- 这是一个不导出的辅助函数，用于封装批准用户的核心逻辑 ---
async function approveUser(clerkId: string, name: string, email?: string) {
    const user = await (await clerkClient()).users.getUser(clerkId);

    if (email && email.endsWith('@hsefz.cn')) {
        const existingEmail = user.emailAddresses.find(e => e.emailAddress === email);

        if (existingEmail) {
            await (await clerkClient()).users.updateUser(clerkId, {primaryEmailAddressID: existingEmail.id});
        } else {
            // --- 核心修改在这里 ---
            // 使用正确的 clerkClient().emailAddresses.createEmailAddress() 方法
            const newEmail = await (await clerkClient()).emailAddresses.createEmailAddress({
                userId: clerkId,
                emailAddress: email,
            });
            // --------------------

            await (await clerkClient()).users.updateUser(clerkId, {primaryEmailAddressID: newEmail.id});
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
export async function autoVerifyAction(
    previousState: ActionState,
    formData: FormData
) {
    const {userId: clerkId} = await auth();
    const clerkUser = await (await clerkClient()).users.getUser(clerkId || '');
    if (!clerkId || !clerkUser) {
        return {success: false, message: '用户未登录'};
    }

    const realName = formData.get('realName') as string;
    if (!realName) {
        return {success: false, message: '真实姓名不能为空'};
    }

    const email = clerkUser.primaryEmailAddress?.emailAddress;
    if (!email || !email.endsWith('@hsefz.cn')) {
        return {success: false, message: '当前主邮箱不符合要求'};
    }
    const emailPrefix = email.split('@')[0];

    try {
        const response = await fetch(`http://43.143.57.12/verify/?mail=${emailPrefix}`);
        if (!response.ok) {
            return {success: false, message: '验证失败：此邮箱未在认证数据库中找到。请尝试手动申请。'};
        }

        const data = await response.json();
        const apiName = data.name;

        if (apiName === realName) {
            await approveUser(clerkId, apiName, email);
            revalidatePath('/');
            return {success: true, message: '验证成功！'};
        } else {
            return {success: false, message: '验证失败：真实姓名与邮箱不匹配。'};
        }
    } catch (error) {
        return {success: false, message: '网络错误，请稍后重试。'};
    }
}

const serverRequestSchema = verificationRequestSchema.extend({
    imageUrl: z.string().url({message: '图片 URL 无效'}),
});

// 1. 修改函数签名，接收一个普通对象
export async function submitVerificationRequestAction(
    previousState: ActionState,
    formData: FormData
) {
    const {userId: clerkId} = await auth();
    if (!clerkId) return {success: false, message: '用户未登录'};

    const user = await db.selectFrom('users').select('id').where('clerk_id', '=', clerkId).executeTakeFirst();
    if (!user) return {success: false, message: '用户不存在'};

    const studentCardFile = formData.get('studentCardFile') as File;
    if (!studentCardFile || studentCardFile.size === 0) {
        return {success: false, message: '请上传学生卡照片'};
    }

    const originalFilename = studentCardFile.name;
    const uniqueFilename = `${originalFilename}-${Date.now()}`;

    // 3. 将文件上传逻辑移到 Server Action 内部
    let imageUrl = '';
    try {
        const blob = await put(uniqueFilename, studentCardFile, {access: 'public'});
        imageUrl = blob.url;
    } catch (error) {
        return {success: false, message: '图片上传失败，请重试'};
    }

    const dataToValidate = {
        realName: formData.get('realName') as string,
        classNumber: formData.get('classNumber') as string,
        email: formData.get('email') as string,
    };

    // 4. 使用 Zod 进行校验
    const validation = verificationRequestSchema.safeParse(dataToValidate);
    if (!validation.success) {
        return {success: false, message: validation.error.issues[0].message};
    }

    const {realName, classNumber, email} = validation.data;

    // 5. 检查邮箱是否已被占用 (逻辑不变)
    const existingUserWithEmail = await db.selectFrom('users').select('id').where('email', '=', email).executeTakeFirst();
    if (existingUserWithEmail) {
        return {success: false, message: '此 hsefz.cn 邮箱已被平台上的其他账户使用。'};
    }

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

    return {success: true, message: '您的申请已提交，请等待管理员审核。'};
}

export async function getUserVerificationStatusAction() {
    const {userId: clerkId} = await auth();
    if (!clerkId) return null;

    const latestRequest = await db.selectFrom('manual_verifications')
        .select('status')
        .where('clerk_user_id', '=', clerkId)
        .orderBy('created_at', 'desc')
        .executeTakeFirst();

    return latestRequest?.status || null; // 返回 'pending', 'rejected' 或 null
}