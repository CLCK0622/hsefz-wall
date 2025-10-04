// components/PostFeed/PostFeed.tsx
'use client';
import { Box } from '@mantine/core';
import { PostCard, PostWithDetails } from '../PostCard/PostCard';
import styles from './PostFeed.module.scss';
import Link from 'next/link';
import { usePostStore } from '@/lib/store'; // 1. 导入 store
import { useEffect } from 'react';

export function PostFeed({ posts: initialPosts }: { posts: PostWithDetails[]; }) {
    // 2. 从 store 中获取 posts 和 setPosts 方法
    const { posts, setPosts, toggleLike } = usePostStore();

    // 3. 当初始数据变化时，将其载入 store
    useEffect(() => {
        setPosts(initialPosts);
    }, [initialPosts, setPosts]);

    return (
        <Box className={styles.masonryContainer}>
            {posts.map(post => (
                <PostCard
                    key={post.id}
                    post={post}
                    className={styles.masonryItem}
                    // 4. 将 store 中的 toggleLike 方法传递下去
                    onLikeToggle={toggleLike}
                />
            ))}
        </Box>
    );
}