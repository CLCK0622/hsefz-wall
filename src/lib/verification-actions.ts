// lib/verification-actions.ts
'use server';
import { auth } from '@clerk/nextjs/server';
import { db } from './db';
import {z, ZodError} from 'zod';
import { verificationRequestSchema } from '@/lib/verification_schema';

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