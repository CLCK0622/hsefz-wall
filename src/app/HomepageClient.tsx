// app/HomePageClient.tsx
'use client'; // 因为 PostFeed 是客户端组件，整个文件都标记为 client

import { useState, useEffect } from 'react';
import Header from "@/components/Header/Header";
import { CreatePostForm } from "@/components/CreatePostForm/CreatePostForm";
import { PostFeed } from "@/components/PostFeed/PostFeed";
import { Container, Loader, Group, Text } from '@mantine/core';
import { ClerkLoaded, ClerkLoading, useUser } from "@clerk/nextjs";
import { PostWithDetails } from "@/components/PostCard/PostCard";

// 1. 将 props 类型定义移到这里
interface HomePageProps {
    initialPosts: PostWithDetails[];
    currentUserId?: number;
    currentUserRole?: string;
}

// 2. 组件接收 props
export default function HomePageClient({ initialPosts, currentUserId, currentUserRole }: HomePageProps) {
    // 3. 这里不再需要数据获取逻辑，因为数据将由服务器组件传入

    return (
            <Container my="md">
                <ClerkLoaded>
                    <CreatePostForm userRole={currentUserRole} />
                    {initialPosts.length > 0 ? (
                        <PostFeed posts={initialPosts} />
                    ) : (
                        <Text c="dimmed" ta="center" mt="xl">还没有人发布内容，快来抢占第一个吧！</Text>
                    )}
                </ClerkLoaded>
                <ClerkLoading>
                    <Group justify="center" mt="xl"><Loader /></Group>
                </ClerkLoading>
            </Container>
    );
}