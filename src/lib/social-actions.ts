// lib/social-actions.ts
'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from './db';
import { revalidatePath } from 'next/cache';

// Action to toggle a like on a post
export async function toggleLikeAction(postId: number) {
    const { userId: clerkId } = await auth();
    if (!clerkId) throw new Error('用户未登录');

    const user = await db.selectFrom('users').select('id').where('clerk_id', '=', clerkId).executeTakeFirst();
    if (!user) throw new Error('用户不存在');

    const existingLike = await db.selectFrom('likes')
        .where('user_id', '=', user.id)
        .where('post_id', '=', postId)
        .executeTakeFirst();

    if (existingLike) {
        // User has already liked, so unlike it
        await db.deleteFrom('likes')
            .where('user_id', '=', user.id)
            .where('post_id', '=', postId)
            .execute();
    } else {
        // User has not liked yet, so like it
        await db.insertInto('likes')
            .values({ user_id: user.id, post_id: postId })
            .execute();
    }

    // Revalidate the path to update the UI
    revalidatePath('/');
}

// Action to add a comment
export async function addCommentAction(postId: number, content: string) {
    const { userId: clerkId } = await auth();
    if (!clerkId) throw new Error('用户未登录');

    const user = await db.selectFrom('users').select('id').where('clerk_id', '=', clerkId).executeTakeFirst();
    if (!user) throw new Error('用户不存在');

    if (!content.trim()) throw new Error('评论内容不能为空');

    await db.insertInto('comments')
        .values({ post_id: postId, user_id: user.id, content: content.trim() })
        .execute();

    revalidatePath('/');
}

// Action to fetch comments for a post
export async function getCommentsAction(postId: number) {
    const comments = await db.selectFrom('comments')
        .innerJoin('users', 'users.id', 'comments.user_id')
        .select(['comments.id', 'comments.content', 'comments.user_id', 'comments.created_at', 'users.username', 'users.avatar_url'])
        .where('comments.post_id', '=', postId)
        .orderBy('comments.created_at', 'asc')
        .execute();
    return comments;
}