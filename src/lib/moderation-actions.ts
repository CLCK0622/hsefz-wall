// lib/moderation-actions.ts
'use server';
import { auth } from '@clerk/nextjs/server';
import { db } from './db';
import { revalidatePath } from 'next/cache';
import {z} from "zod";

async function getCurrentUser() {
    const { userId: clerkId, sessionClaims } = await auth();
    if (!clerkId) throw new Error('用户未登录');

    const user = await db.selectFrom('users')
        .select(['id', 'role'])
        .where('clerk_id', '=', clerkId)
        .executeTakeFirst();

    if (!user) throw new Error('用户不存在');

    // 修正：使用类型断言
    const isAdmin = (sessionClaims?.metadata as { role?: string })?.role === 'Admin' || (sessionClaims?.metadata as { role?: string })?.role === 'SuperAdmin';

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

const updatePostSchema = z.object({
    postId: z.number(),
    content: z.string().min(1, '内容不能为空').max(1000, '内容不能超过1000字'),
    is_anonymous: z.boolean(),
    is_announcement: z.boolean(), // <-- 新增字段
});

export async function updatePostAction(formData: FormData) {
    const currentUser = await getCurrentUser();

    // --- 权限校验 ---
    if (formData.get('is_announcement') === 'true' && !currentUser.isAdmin) {
        throw new Error('无权设置公告');
    }
    // ----------------

    const validation = updatePostSchema.safeParse({
        postId: Number(formData.get('postId')),
        content: formData.get('content'),
        is_anonymous: formData.get('is_anonymous') === 'true',
        is_announcement: formData.get('is_announcement') === 'true', // <-- 新增字段
    });

    if (!validation.success) {
        throw new Error(validation.error.issues[0].message);
    }

    const { postId, content, is_anonymous, is_announcement } = validation.data;

    // 2. 验证帖子是否存在且属于当前用户
    const post = await db.selectFrom('posts')
        .select('user_id')
        .where('id', '=', postId)
        .executeTakeFirst();

    if (!post) throw new Error('帖子不存在');
    if (post.user_id !== currentUser.id) throw new Error('无权编辑');

    // 3. 更新数据库
    await db.updateTable('posts')
        .set({
            content,
            is_anonymous,
            is_announcement, // <-- 更新字段
            updated_at: new Date(),
        })
        .where('id', '=', postId)
        .execute();

    revalidatePath('/');
}