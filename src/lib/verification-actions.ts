// lib/verification-actions.ts
'use server';
import { auth } from '@clerk/nextjs/server';
import { db } from './db';
import { z } from 'zod';

const requestSchema = z.object({
    realName: z.string().min(1, '真实姓名不能为空'),
    classNumber: z.string().regex(/^\d{4}$/, '班级必须是4位数字'),
    email: z.string().email('邮箱格式不正确').endsWith('@hsefz.cn', '必须是 hsefz.cn 邮箱'),
    imageUrl: z.string().url('图片 URL 无效'),
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

    // 2. 直接使用传入的 data 对象进行校验
    const validation = requestSchema.safeParse(data);

    if (!validation.success) {
        throw new Error(validation.error.issues[0].message);
    }

    const { realName, classNumber, email, imageUrl } = validation.data;
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