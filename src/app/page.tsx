// app/page.tsx
import { auth, clerkClient } from '@clerk/nextjs/server';
import { db } from "@/lib/db";
import { sql } from 'kysely';
import { PostWithDetails } from "@/components/PostCard/PostCard";
import HomePageClient from './HomepageClient'; // 导入我们新创建的客户端组件

// 这个函数负责获取主页所需的所有数据
async function getHomePageData() {
    const { userId: clerkId, sessionClaims } = await auth();
    const currentUserRole = (sessionClaims?.metadata as { role?: string })?.role;

    // --- Just-in-Time User Data Synchronization ---
    if (clerkId) {
        const userFromDb = await db.selectFrom('users')
            .select(['username', 'avatar_url'])
            .where('clerk_id', '=', clerkId)
            .executeTakeFirst();

        if (userFromDb) {
            const userFromClerk = await (await clerkClient()).users.getUser(clerkId);
            const correctUsername = `${userFromClerk.lastName || ''}${userFromClerk.firstName || ''}`.trim();
            const correctAvatar = userFromClerk.imageUrl;

            if (userFromDb.username !== correctUsername || userFromDb.avatar_url !== correctAvatar) {
                await db.updateTable('users')
                    .set({ username: correctUsername, avatar_url: correctAvatar })
                    .where('clerk_id', '=', clerkId)
                    .execute();
            }
        }
    }
    // --- End Sync ---

    const currentUser = clerkId ? await db.selectFrom('users').select('id').where('clerk_id', '=', clerkId).executeTakeFirst() : null;
    const currentUserId = currentUser?.id;

    const posts = await db.selectFrom('posts')
        .innerJoin('users', 'users.id', 'posts.user_id')
        .select([
            'posts.id', 'posts.content', 'posts.created_at', 'posts.is_anonymous',
            'posts.is_announcement', 'posts.user_id', 'users.username', 'users.avatar_url',
        ])
        .select((eb) => [
            sql<string[] | null>`(SELECT array_agg(pi.image_url) FROM post_images pi WHERE pi.post_id = posts.id)`.as('images'),
            sql<number>`(SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id)`.as('like_count'),
            sql<number>`(SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.id)`.as('comment_count'),
            sql<boolean>`(EXISTS (SELECT 1 FROM likes WHERE likes.post_id = posts.id AND likes.user_id = ${currentUserId}))`.as('has_liked')
        ])
        .orderBy('posts.is_announcement', 'desc')
        .orderBy('posts.created_at', 'desc')
        .limit(50)
        .execute();

    const formattedPosts: PostWithDetails[] = posts.map(p => ({
        id: p.id,
        content: p.content,
        created_at: p.created_at,
        is_anonymous: p.is_anonymous,
        is_announcement: p.is_announcement,
        user_id: p.user_id,
        user: { username: p.username, avatar_url: p.avatar_url },
        images: p.images ? p.images.map((url: string) => ({ image_url: url })) : [],
        like_count: Number(p.like_count) || 0,
        comment_count: Number(p.comment_count) || 0,
        has_liked: !!p.has_liked,
    }));

    return { formattedPosts, currentUserId, currentUserRole };
}


export default async function HomePage() {
    const { formattedPosts, currentUserId, currentUserRole } = await getHomePageData();

    return (
        <HomePageClient
            initialPosts={formattedPosts}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
        />
    );
}