'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from './db';
import { revalidatePath } from 'next/cache';

interface CreatePostInput {
    content: string;
    imageUrls: string[];
    is_anonymous: boolean;
    is_announcement: boolean; // <-- 新增字段
}

export async function createPost(input: CreatePostInput) {
    const { userId: clerkId, sessionClaims } = await auth(); // <-- 获取 sessionClaims

    if (!clerkId) {
        throw new Error('用户未登录');
    }

    const user = await db.selectFrom('users')
        .select('id')
        .where('clerk_id', '=', clerkId)
        .executeTakeFirst();

    if (!user) {
        throw new Error('用户不存在于数据库中');
    }

    const { content, imageUrls, is_anonymous, is_announcement } = input;

    // --- 权限校验 ---
    const userRole = (sessionClaims?.metadata as { role?: string })?.role;
    const isAdmin = userRole === 'Admin' || userRole === 'SuperAdmin';
    if (is_announcement && !isAdmin) {
        // 如果尝试发布公告但不是管理员，则抛出错误
        throw new Error('无权发布公告');
    }
    // ----------------

    const result = await db.transaction().execute(async (trx) => {
        const newPost = await trx.insertInto('posts')
            .values({
                user_id: user.id,
                content: content,
                is_anonymous: is_anonymous,
                is_announcement: is_announcement, // <-- 存入新字段
            })
            .returning('id')
            .executeTakeFirstOrThrow();

        // 3. 如果有图片，将图片 URL 插入 `post_images` 表
        if (imageUrls && imageUrls.length > 0) {
            const images = imageUrls.map((url, index) => ({
                post_id: newPost.id,
                image_url: url,
                order: index + 1,
            }));

            await trx.insertInto('post_images')
                .values(images)
                .execute();
        }

        return newPost;
    });

    // 4. 清除主页缓存，让新帖子立刻显示出来
    revalidatePath('/');

    // 5. 可以选择重定向或返回成功信息
    // redirect('/'); // 发布后直接跳转回主页
    return { success: true, postId: result.id };
}