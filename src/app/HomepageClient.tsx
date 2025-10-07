// app/HomePageClient.tsx
'use client';
import { useEffect } from 'react';
import Header from "@/components/Header/Header";
import { CreatePostForm } from "@/components/CreatePostForm/CreatePostForm";
import { PostFeed } from "@/components/PostFeed/PostFeed";
import { Container, Loader, Group, Text } from '@mantine/core'; // 移除了 Center
import { ClerkLoaded, ClerkLoading } from "@clerk/nextjs";
import { PostWithDetails } from "@/components/PostCard/PostCard";
import { usePostStore } from '@/lib/store';

interface HomePageProps {
    initialPosts: PostWithDetails[];
    currentUserId?: number;
    currentUserRole?: string;
    searchQuery?: string;
}

export default function HomePageClient({ initialPosts, currentUserId, currentUserRole, searchQuery }: HomePageProps) {
    const { isSearching, setIsSearching } = usePostStore();

    useEffect(() => {
        setIsSearching(false);
    }, [initialPosts, setIsSearching]);

    return (
        <>
                <ClerkLoaded>
                    <CreatePostForm userRole={currentUserRole} />

                    {/* 移除了外层的 isSearching 条件判断 */}
                    {searchQuery && !isSearching && (
                        <Text fw={500} mb="md">
                            关于 “{searchQuery}” 的搜索结果 ({initialPosts.length} 条)
                        </Text>
                    )}

                    {/* PostFeed 组件现在始终被渲染，我们只是把加载状态传进去 */}
                    <PostFeed
                        posts={initialPosts}
                        isLoading={isSearching}
                        // currentUserId 和 currentUserRole 只是为了保持 props 签名一致，可以省略
                    />

                    {!isSearching && initialPosts.length === 0 && (
                        <Text c="dimmed" ta="center" mt="xl">
                            {searchQuery ? '没有找到相关的帖子。' : '还没有人发布内容，快来抢占第一个吧！'}
                        </Text>
                    )}

                </ClerkLoaded>
                <ClerkLoading>
                    <Group justify="center" mt="xl"><Loader /></Group>
                </ClerkLoading>
        </>
    );
}