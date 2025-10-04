// components/PostCard/PostCard.tsx
'use client'; // 1. 添加 'use client' 因为我们使用了 hook

import {Card, Text, Avatar, Group, Box, ActionIcon, Flex, Badge} from '@mantine/core';
import {IconUserCircle, IconHeart, IconHeartFilled, IconMessageCircle} from '@tabler/icons-react';
import {toggleLikeAction} from '@/lib/social-actions';
import React from "react";
import {useMediaQuery} from '@mantine/hooks'; // 2. 导入 useMediaQuery hook
import Link from 'next/link';

// 定义一个完整的帖子数据类型，这很重要
export type PostWithDetails = {
    id: number;
    content: string;
    created_at: Date;
    is_anonymous: boolean;
    is_announcement: boolean;
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
    user_id: number;
};

interface PostCardProps {
    post: PostWithDetails;
    className?: string;
    onLikeToggle: (postId: number) => void;
}

export function PostCard({post, className, onLikeToggle}: PostCardProps) {
    // 3. 使用 hook 判断是否为移动端视图
    const isMobile = useMediaQuery('(max-width: 576px)'); // Mantine sm 断点

    const authorName = post.is_anonymous ? '匿名用户' : post.user?.username || '未知用户';
    const authorAvatar = post.is_anonymous ? null : post.user?.avatar_url;

    const handleLikeClick = (e: React.MouseEvent) => {
        e.preventDefault();
        onLikeToggle(post.id);
    }

    return (
        <Link href={`/post/${post.id}`} className={className} style={{textDecoration: 'none'}}>
            <Card className={className} padding="md" radius="md" withBorder
                  style={{cursor: 'pointer'}}>
                {post.images.length > 0 && (
                    <Card.Section mb="md">
                        <img
                            src={post.images[0].image_url}
                            alt="Post image"
                            style={{width: '100%', maxHeight: '450px', objectFit: 'cover'}}
                        />
                    </Card.Section>
                )}

                {post.content.length > 0 && (
                    <Box mb="md">
                        {post.is_announcement && <Badge color="yellow" mb="md">公告</Badge>}<Text lineClamp={3}
                                                                                                  size="sm">{post.content}</Text>
                    </Box>
                )}

                <Flex justify="space-between" align="center" gap="md">
                    {/* 左侧用户区域 */}
                    <Group gap="xs" wrap="nowrap" style={{overflow: 'hidden'}}>
                        <Avatar src={authorAvatar} radius="xl" size="sm">
                            {!authorAvatar && <IconUserCircle/>}
                        </Avatar>
                        {/* 4. 给用户名 Text 添加内联样式实现省略号效果 */}
                        <Text
                            size="xs"
                            c="dimmed"
                            style={{
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}
                        >
                            {authorName}
                        </Text>
                    </Group>

                    {/* 右侧点赞/评论区域 */}
                    <Group gap={4} wrap="nowrap">
                        <ActionIcon variant="subtle" color="gray" onClick={handleLikeClick}>
                            {post.has_liked ? <IconHeartFilled style={{color: 'red'}}/> : <IconHeart/>}
                        </ActionIcon>
                        <Text size="sm">{post.like_count}</Text>

                        <ActionIcon variant="subtle" color="gray" style={{cursor: 'default', marginLeft: '8px'}}>
                            <IconMessageCircle/>
                        </ActionIcon>
                        <Text size="sm">{post.comment_count}</Text>
                    </Group>
                </Flex>
            </Card>
        </Link>
    );
}