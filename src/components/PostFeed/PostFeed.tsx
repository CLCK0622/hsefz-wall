// components/PostFeed/PostFeed.tsx
'use client';
import { Box, Center, Loader } from '@mantine/core'; // 1. 导入 Center 和 Loader
import { PostCard, PostWithDetails } from '../PostCard/PostCard';
import styles from './PostFeed.module.scss';
import { usePostStore } from '@/lib/store';
import { useEffect } from 'react';
import Link from 'next/link';

// 2. 组件现在接收一个新的 isLoading 属性
export function PostFeed({ posts: initialPosts, isLoading }: {
    posts: PostWithDetails[];
    isLoading?: boolean; // 设为可选
}) {
    const { posts, setPosts, toggleLike } = usePostStore();

    useEffect(() => {
        setPosts(initialPosts);
    }, [initialPosts, setPosts]);

    return (
        // 3. 容器本身始终被渲染
        <Box className={styles.masonryContainer}>
            {/* 4. 在容器内部根据 isLoading 决定显示什么 */}
            {isLoading ? (
                <Box w="100%" h={400} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Loader />
                </Box>
            ) : (
                posts.map(post => (
                    <Link key={post.id} href={`/post/${post.id}`} className={styles.masonryItem} style={{ textDecoration: 'none' }}>
                        <PostCard
                            post={post}
                            onLikeToggle={() => toggleLike(post.id)}
                        />
                    </Link>
                ))
            )}
        </Box>
    );
}