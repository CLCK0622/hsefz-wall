// lib/actions.ts
'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from './db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// 定义一个类型，让数据传递更清晰
interface CreatePostInput {
    content: string;
    imageUrls: string[];
    is_anonymous: boolean; // 新增字段
}

export async function createPost(input: CreatePostInput) {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
        throw new Error('用户未登录');
    }

    // 1. 从我们自己的数据库中查找用户
    const user = await db.selectFrom('users')
        .select('id')
        .where('clerk_id', '=', clerkId)
        .executeTakeFirst();

    if (!user) {
        throw new Error('用户不存在于数据库中');
    }

    const { content, imageUrls, is_anonymous } = input; // 解构新字段

    const result = await db.transaction().execute(async (trx) => {
        const newPost = await trx.insertInto('posts')
            .values({
                user_id: user.id,
                content: content,
                is_anonymous: is_anonymous, // 存入新字段
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