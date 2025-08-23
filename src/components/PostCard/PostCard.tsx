// components/PostCard/PostCard.tsx
import { Card, Text, Avatar, Group, Box } from '@mantine/core';
import { IconUserCircle } from '@tabler/icons-react';
import { ActionIcon, Flex } from '@mantine/core';
import { IconHeart, IconHeartFilled, IconMessageCircle } from '@tabler/icons-react';
import { toggleLikeAction } from '@/lib/social-actions';
import React from "react";

// 定义一个完整的帖子数据类型，这很重要
export type PostWithDetails = {
    id: number;
    content: string;
    created_at: Date;
    is_anonymous: boolean;
    is_announcement: boolean; // Add this line
    user: {
        username: string;
        avatar_url: string | null;
    } | null;
    images: {
        image_url: string;
    }[];
    like_count: number;
    comment_count: number;
    has_liked: boolean;
    user_id: number; // The post author's ID from our own DB
};

interface PostCardProps {
    post: PostWithDetails;
    onClick: () => void;
    className?: string; // 1. 添加 className 属性
}

export function PostCard({ post, onClick, className }: PostCardProps) {
    const authorName = post.is_anonymous ? '匿名用户' : post.user?.username || '未知用户';
    const authorAvatar = post.is_anonymous ? null : post.user?.avatar_url;

    const handleLikeClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent the modal from opening when clicking the heart
        // We use startTransition for optimistic updates in the future if needed
        React.startTransition(() => {
            toggleLikeAction(post.id);
        });
    }

    return (
        <Card className={className} shadow="sm" padding="md" radius="md" withBorder onClick={onClick} style={{ cursor: 'pointer' }}>
            {post.images.length > 0 && (
                <Card.Section>
                    <img
                        src={post.images[0].image_url}
                        alt="Post image"
                        style={{ width: '100%', maxHeight: '450px', objectFit: 'cover' }}
                    />
                </Card.Section>
            )}

            <Box mt="md">
                <Text lineClamp={3} size="sm">{post.content}</Text>
            </Box>

            <Flex justify="space-between" align="center" mt="md">
                <Group gap="xs">
                    <Avatar src={authorAvatar} radius="xl" size="sm">
                        {!authorAvatar && <IconUserCircle />}
                    </Avatar>
                    <Text size="xs" c="dimmed">{authorName}</Text>
                </Group>

                <Group gap={2}>
                    <ActionIcon variant="subtle" color="gray" onClick={handleLikeClick}>
                        {post.has_liked ? <IconHeartFilled style={{ color: 'red' }}/> : <IconHeart />}
                    </ActionIcon>
                    <Text size="sm">{post.like_count}</Text>
                    <ActionIcon variant="subtle" color="gray" style={{ cursor: 'default' }}>
                        <IconMessageCircle />
                    </ActionIcon>
                    <Text size="sm">{post.comment_count}</Text>
                </Group>
            </Flex>
        </Card>
    );
}