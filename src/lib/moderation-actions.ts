// lib/moderation-actions.ts
'use server';
import { auth } from '@clerk/nextjs/server';
import { db } from './db';
import { revalidatePath } from 'next/cache';

async function getCurrentUser() {
    const { userId: clerkId, sessionClaims } = await auth();
    if (!clerkId) throw new Error('用户未登录');

    const user = await db.selectFrom('users')
        .select(['id', 'role'])
        .where('clerk_id', '=', clerkId)
        .executeTakeFirst();

    if (!user) throw new Error('用户不存在');

    // 修正：使用类型断言
    const isAdmin = (sessionClaims?.metadata as { role?: string })?.role === 'admin';

    return { ...user, isAdmin };
}

// Action to delete a post
export async function deletePostAction(postId: number) {
    const currentUser = await getCurrentUser();

    const post = await db.selectFrom('posts')
        .select('user_id')
        .where('id', '=', postId)
        .executeTakeFirst();

    if (!post) throw new Error('帖子不存在');

    // Allow deletion if user is the owner OR is an admin
    if (post.user_id !== currentUser.id && !currentUser.isAdmin) {
        throw new Error('无权删除');
    }

    await db.deleteFrom('posts').where('id', '=', postId).execute();
    revalidatePath('/');
}

// Action to delete a comment
export async function deleteCommentAction(commentId: number) {
    const currentUser = await getCurrentUser();

    const comment = await db.selectFrom('comments')
        .select('user_id')
        .where('id', '=', commentId)
        .executeTakeFirst();

    if (!comment) throw new Error('评论不存在');

    if (comment.user_id !== currentUser.id && !currentUser.isAdmin) {
        throw new Error('无权删除');
    }

    await db.deleteFrom('comments').where('id', '=', commentId).execute();
    revalidatePath('/');
}

// Action to report content
export async function reportAction(args: { contentId: number; contentType: 'post' | 'comment'; reason: string }) {
    const currentUser = await getCurrentUser();
    const { contentId, contentType, reason } = args;

    if (!reason.trim()) throw new Error('举报原因不能为空');

    await db.insertInto('reports')
        .values({
            reporter_user_id: currentUser.id,
            post_id: contentType === 'post' ? contentId : null,
            comment_id: contentType === 'comment' ? contentId : null,
            reason: reason.trim(),
        })
        .execute();
}