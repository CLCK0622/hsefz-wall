'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from './db';
import { revalidatePath } from 'next/cache';
import {PostWithDetails} from "../components/PostCard/PostCard";
import {sql} from "kysely";

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

    let { content, imageUrls, is_anonymous, is_announcement } = input;

    if (is_announcement) {
        is_anonymous = true;
    }

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

export async function getPostDetails(postId: number): Promise<PostWithDetails | null> {
    const { userId: clerkId } = await auth();
    const currentUser = clerkId ? await db.selectFrom('users').select('id').where('clerk_id', '=', clerkId).executeTakeFirst() : null;
    const currentUserId = currentUser?.id;

    // 使用 sql 辅助函数来构建子查询，避免类型错误
    const post = await db.selectFrom('posts')
        .innerJoin('users', 'users.id', 'posts.user_id')
        .select([
            'posts.id',
            'posts.content',
            'posts.created_at',
            'posts.is_anonymous',
            'posts.is_announcement',
            'posts.user_id',
            'users.username',
            'users.avatar_url',
        ])
        .select([
            sql<string[] | null>`(SELECT array_agg(pi.image_url) FROM post_images pi WHERE pi.post_id = posts.id)`.as('images'),
            sql<number>`(SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id)`.as('like_count'),
            sql<number>`(SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.id)`.as('comment_count'),
            sql<boolean>`(EXISTS (SELECT 1 FROM likes WHERE likes.post_id = posts.id AND likes.user_id = ${currentUserId}))`.as('has_liked')
        ])
        .where('posts.id', '=', postId)
        .executeTakeFirst();

    if (!post) {
        return null;
    }

    // 格式化输出结果
    const formattedPost: PostWithDetails = {
        id: post.id,
        content: post.content,
        created_at: post.created_at,
        is_anonymous: post.is_anonymous,
        is_announcement: post.is_announcement,
        user_id: post.user_id,
        user: {
            username: post.username,
            avatar_url: post.avatar_url
        },
        images: post.images ? post.images.map((url: string) => ({ image_url: url })) : [],
        like_count: Number(post.like_count) || 0,
        comment_count: Number(post.comment_count) || 0,
        has_liked: !!post.has_liked,
    };

    return formattedPost;
}

export async function getCurrentUserDbInfo() {
    const { userId: clerkId, sessionClaims } = await auth();
    if (!clerkId) {
        return null;
    }

    const user = await db.selectFrom('users')
        .select('id')
        .where('clerk_id', '=', clerkId)
        .executeTakeFirst();

    return {
        id: user?.id,
        role: (sessionClaims?.metadata as { role?: string })?.role,
    };
}