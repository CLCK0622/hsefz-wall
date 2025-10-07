// app/@modal/(.)post/[postId]/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { Modal, Loader, Center, Text } from '@mantine/core';
import { useEffect, useState } from 'react';
import { useMediaQuery } from '@mantine/hooks';
import { PostDetailView } from '@/components/PostDetailView/PostDetailView';
import { getPostDetails, getCurrentUserDbInfo } from '@/lib/actions';
import { usePostStore } from '@/lib/store';
import { PostWithDetails } from '@/components/PostCard/PostCard';

export default function PostModal({ params }: { params: any }) {
    const router = useRouter();
    const isMobile = useMediaQuery('(max-width: 768px)');

    const allPosts = usePostStore((state) => state.posts);
    const postId = Number(params.postId);
    const postFromStore = allPosts.find(p => p.id === postId);

    const [post, setPost] = useState<PostWithDetails | undefined>(postFromStore);
    const [currentUser, setCurrentUser] = useState<{ id?: number; role?: string; } | null>(null);
    const [isLoading, setIsLoading] = useState(!postFromStore);

    useEffect(() => {
        // 如果 store 中没有（比如直接刷新或从外部链接进入），再从服务器获取
        if (!postFromStore) {
            setIsLoading(true);
            Promise.all([ getPostDetails(postId), getCurrentUserDbInfo() ])
                .then(([postData, userData]) => {
                    if (!postData) { router.back(); }
                    else { setPost(postData); setCurrentUser(userData); setIsLoading(false); }
                });
        } else {
            // 如果 store 中有，也需要获取当前用户信息
            getCurrentUserDbInfo().then(setCurrentUser);
        }
    }, [postId, postFromStore, router]);

    return (
        <Modal opened={true} onClose={() => router.back()} size="80%" fullScreen={isMobile} padding={0} zIndex={2000} styles={{ body: { minHeight: '80vh' } }} withCloseButton={false}>
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