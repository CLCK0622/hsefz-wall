
'use server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';

export async function updateUserRoleAction(formData: FormData) {
    const { sessionClaims } = await auth();

    const userRole = (sessionClaims?.metadata as { role?: string })?.role;

    if (userRole !== 'SuperAdmin') {
        throw new Error('无权操作');
    }

    const targetUserId = formData.get('userId') as string;
    const newRole = formData.get('role') as 'Admin' | 'User';

    if (!targetUserId || !newRole) {
        throw new Error('缺少参数');
    }

    await (await clerkClient()).users.updateUserMetadata(targetUserId, {
        publicMetadata: {
            role: newRole
        }
    });

    revalidatePath('/admin/users');
}


export async function approveVerificationAction(formData: FormData) {
    const { sessionClaims } = await auth();
    const userRole = (sessionClaims?.metadata as { role?: string })?.role;

    if (userRole !== 'Admin' && userRole !== 'SuperAdmin') {
        throw new Error('无权操作');
    }

    const verificationId = Number(formData.get('verificationId'));
    const targetClerkId = formData.get('clerkId') as string;

    if (!verificationId || !targetClerkId) throw new Error('缺少参数');

    // 1. 更新 Clerk Metadata，将用户标记为已认证
    await (await clerkClient()).users.updateUserMetadata(targetClerkId, {
        publicMetadata: {
            // 不能覆盖掉 role，所以要先获取旧的
            ...(await (await clerkClient()).users.getUser(targetClerkId)).publicMetadata,
            verified: true
        }
    });

    // 2. 更新我们自己数据库中的申请状态
    await db.updateTable('manual_verifications')
        .set({ status: 'approved' })
        .where('id', '=', verificationId)
        .execute();

    revalidatePath('/admin/users');
}

export async function rejectVerificationAction(formData: FormData) {
    const { sessionClaims } = await auth();
    const userRole = (sessionClaims?.metadata as { role?: string })?.role;
    if (userRole !== 'Admin' && userRole !== 'SuperAdmin') {
        throw new Error('无权操作');
    }

    const verificationId = Number(formData.get('verificationId'));
    if (!verificationId) throw new Error('缺少参数');

    await db.updateTable('manual_verifications')
        .set({ status: 'rejected' }) // 将状态更新为 'rejected'
        .where('id', '=', verificationId)
        .execute();

    revalidatePath('/admin/verifications');
}

export async function getPendingVerificationCountAction() {
    const { sessionClaims } = await auth();
    const userRole = (sessionClaims?.metadata as { role?: string })?.role;
    if (userRole !== 'Admin' && userRole !== 'SuperAdmin') {
        return 0; // 如果不是管理员，直接返回 0
    }

    const result = await db.selectFrom('manual_verifications')
        .select(eb => eb.fn.count('id').as('count'))
        .where('status', '=', 'pending')
        .executeTakeFirst();

    return Number(result?.count) || 0;
}