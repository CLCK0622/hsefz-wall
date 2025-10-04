// components/PostModal.tsx
'use client';

import { useRouter } from 'next/navigation';
import { Modal, Loader, Center, Text } from '@mantine/core';
import { useEffect, useState } from 'react';
import { useMediaQuery } from '@mantine/hooks';
import { PostWithDetails } from '@/components/PostCard/PostCard';
import { PostDetailView } from '@/components/PostDetailView/PostDetailView';
import { getPostDetails, getCurrentUserDbInfo } from '@/lib/actions';
import {notifications} from "@mantine/notifications";

export function PostModal({ postId }: { postId: string }) {
    const router = useRouter();
    const isMobile = useMediaQuery('(max-width: 768px)');

    const [post, setPost] = useState<PostWithDetails | null>(null);
    const [currentUser, setCurrentUser] = useState<{ id?: number; role?: string; } | null>(null);
    // 1. 关键改动：isLoading 的初始状态永远是 true
    const [isLoading, setIsLoading] = useState(true);

    // 当关闭按钮被点击时，明确导航到主页
    const handleClose = () => router.push('/');

    useEffect(() => {
        // 2. 每次组件加载（即每次打开模态框），都重置加载状态并获取最新数据
        setIsLoading(true);
        const id = Number(postId);

        if (isNaN(id)) {
            handleClose(); // 如果 postId 无效，直接返回主页
            return;
        }

        Promise.all([
            getPostDetails(id),
            getCurrentUserDbInfo()
        ]).then(([postData, userData]) => {
            if (!postData) {
                notifications.show({ color: 'red', message: '帖子不存在或已被删除' });
                handleClose(); // 如果帖子不存在，也返回主页
            } else {
                setPost(postData);
                setCurrentUser(userData);
                setIsLoading(false); // 仅在所有数据都准备好后才停止加载
            }
        }).catch(error => {
            console.error("Failed to load post details:", error);
            setIsLoading(false);
            handleClose(); // 出现任何错误都返回主页
        });

    }, [postId]); // 依赖项是 postId，当 URL 变化时会重新执行

    return (
        <Modal
            opened={true}
            onClose={handleClose}
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
                    onClose={handleClose}
                />
            )}
        </Modal>
    );
}