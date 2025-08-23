// lib/admin-actions.ts
'use server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

export async function updateUserRoleAction(formData: FormData) {
    const { sessionClaims } = await auth();
    // 修正：使用类型断言
    const userRole = (sessionClaims?.metadata as { role?: string })?.role;

    if (userRole !== 'SuperAdmin') {
        throw new Error('无权操作');
    }

    const targetUserId = formData.get('userId') as string;
    const newRole = formData.get('role') as 'Admin' | 'User';

    if (!targetUserId || !newRole) {
        throw new Error('缺少参数');
    }

    // 修正：调用 clerkClient()
    await (await clerkClient()).users.updateUserMetadata(targetUserId, {
        publicMetadata: {
            role: newRole
        }
    });

    revalidatePath('/admin/users');
}