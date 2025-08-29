
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

export async function approveVerificationAction(verificationId: number, targetClerkId: string) {
    const { sessionClaims } = await auth();
    const userRole = (sessionClaims?.metadata as { role?: string })?.role;
    if (userRole !== 'Admin' && userRole !== 'SuperAdmin') {
        throw new Error('无权操作');
    }

    if (!verificationId || !targetClerkId) throw new Error('缺少参数');

    await (await clerkClient()).users.updateUserMetadata(targetClerkId, {
        publicMetadata: {
            ...(await (await clerkClient()).users.getUser(targetClerkId)).publicMetadata,
            verified: true
        }
    });

    await db.updateTable('manual_verifications')
        .set({ status: 'approved' })
        .where('id', '=', verificationId)
        .execute();

    revalidatePath('/admin/verifications');
}

export async function rejectVerificationAction(verificationId: number) {
    const { sessionClaims } = await auth();
    const userRole = (sessionClaims?.metadata as { role?: string })?.role;
    if (userRole !== 'Admin' && userRole !== 'SuperAdmin') {
        throw new Error('无权操作');
    }

    if (!verificationId) throw new Error('缺少参数');

    await db.updateTable('manual_verifications')
        .set({ status: 'rejected' })
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