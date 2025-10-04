// app/@modal/(.)post/[postId]/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { Modal, Loader, Center, Text } from '@mantine/core';
import { useEffect, useState } from 'react';
import { useMediaQuery } from '@mantine/hooks';
import { PostWithDetails } from '@/components/PostCard/PostCard';
import { PostDetailView } from '@/components/PostDetailView/PostDetailView';
import { getPostDetails, getCurrentUserDbInfo } from '@/lib/actions';
import { usePostStore } from '@/lib/store';

export default function PostModal({ params }: { params: { postId: string } }) {
    const router = useRouter();
    const isMobile = useMediaQuery('(max-width: 768px)');

    // 1. 从 store 中获取完整的帖子列表
    const allPosts = usePostStore((state) => state.posts);

    const [post, setPost] = useState<PostWithDetails | null>(null);
    const [currentUser, setCurrentUser] = useState<{ id?: number; role?: string; } | null>(null);
    // 2. 关键改动：isLoading 的初始状态永远是 true
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // 3. 每次组件加载（即每次打开模态框），都重置加载状态
        setIsLoading(true);
        const postId = Number(params.postId);

        // 优先从 store 中查找帖子，实现瞬时加载
        const postFromStore = allPosts.find(p => p.id === postId);

        // 并行获取当前用户信息
        const userPromise = getCurrentUserDbInfo();

        if (postFromStore) {
            // 如果缓存命中，直接使用缓存数据，只需等待用户信息
            userPromise.then(userData => {
                setPost(postFromStore);
                setCurrentUser(userData);
                setIsLoading(false);
            });
        } else {
            // 如果缓存未命中（例如直接刷新页面），则从服务器获取所有数据
            Promise.all([
                getPostDetails(postId),
                userPromise
            ]).then(([postData, userData]) => {
                if (!postData) {
                    router.back();
                } else {
                    setPost(postData);
                    setCurrentUser(userData);
                    setIsLoading(false);
                }
            }).catch(error => {
                console.error("Failed to load post details:", error);
                setIsLoading(false);
                router.back();
            });
        }

    }, [params.postId, router, allPosts]); // allPosts 加入依赖项

    return (
        <Modal
            opened={true}
            onClose={() => router.back()}
            size="85%"
            fullScreen={isMobile}
            padding={0}
            zIndex={2000}
            withCloseButton={false}
            styles={{ body: { height: '80vh' } }}
        >
            {isLoading && <Center h="100%"><Loader /></Center>}
            {!isLoading && post && (
                <PostDetailView
                    post={post}
                    currentUserId={currentUser?.id}
                    currentUserRole={currentUser?.role}
                    onClose={() => router.back()}
                />
            )}
        </Modal>
    );
}