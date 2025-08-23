// app/page.tsx
import { auth } from '@clerk/nextjs/server';
import { db } from "@/lib/db";
import { sql } from 'kysely';
import Header from "@/components/Header/Header";
import { CreatePostForm } from "@/components/CreatePostForm/CreatePostForm";
import { PostFeed } from "@/components/PostFeed/PostFeed";
import { Container, Loader, Group, Text } from '@mantine/core';
import { ClerkLoaded, ClerkLoading } from "@clerk/nextjs";
import { PostWithDetails } from "@/components/PostCard/PostCard";

export default async function HomePage() {
    const { userId: clerkId, sessionClaims } = await auth();

    const currentUser = clerkId ? await db.selectFrom('users').select('id').where('clerk_id', '=', clerkId).executeTakeFirst() : null;
    const currentUserId = currentUser?.id;
    const currentUserRole = (sessionClaims?.metadata as { role?: string })?.role as string | undefined;

    const posts = await db.selectFrom('posts')
        .innerJoin('users', 'users.id', 'posts.user_id')
        .select([
            'posts.id', 'posts.content', 'posts.created_at', 'posts.is_anonymous', 'posts.user_id',
            'posts.is_announcement', 'users.username', 'users.avatar_url',
        ])
        .select((eb) => [
            // Image aggregation remains the same
            sql<string[]>`(SELECT array_agg(pi.image_url) FROM post_images pi WHERE pi.post_id = posts.id)`.as('images'),

            // --- REVISED SUBQUERIES ---
            // Subquery to count likes
            sql<number>`(SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id)`.as('like_count'),

            // Subquery to count comments
            sql<number>`(SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.id)`.as('comment_count'),

            // Subquery to check if the current user has liked the post (using EXISTS is efficient)
            sql<boolean>`(
        EXISTS (
          SELECT 1 FROM likes 
          WHERE likes.post_id = posts.id AND likes.user_id = ${currentUserId}
        )
      )`.as('has_liked')
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
        user: { username: p.username, avatar_url: p.avatar_url },
        images: p.images ? p.images.map((url: string) => ({ image_url: url })) : [],
        // Coerce types, as COUNT(*) can be a string and EXISTS can be null if user not logged in
        like_count: Number(p.like_count) || 0,
        comment_count: Number(p.comment_count) || 0,
        has_liked: !!p.has_liked,
        user_id: p.user_id,
    }));

    return (
        <>
            <Header />
            <Container my="md">
                <ClerkLoaded>
                    <CreatePostForm />
                    {formattedPosts.length > 0 ? (
                        <PostFeed posts={formattedPosts} currentUserId={currentUserId} currentUserRole={currentUserRole} />
                    ) : (
                        <Text c="dimmed" ta="center" mt="xl">还没有人发布内容，快来抢占第一个吧！</Text>
                    )}
                </ClerkLoaded>
                <ClerkLoading>
                    <Group justify="center" mt="xl"><Loader /></Group>
                </ClerkLoading>
            </Container>
        </>
    );
}