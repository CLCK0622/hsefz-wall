// components/PostDetailView.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { Box, Text, Group, Avatar, Badge, Stack, Textarea, Button, Loader, Center, ActionIcon, Paper, Menu, rem } from '@mantine/core';
import { Carousel } from '@mantine/carousel';
import '@mantine/carousel/styles.css';
import { PostWithDetails } from '../PostCard/PostCard'; // 确保类型路径正确
import { formatInBeijingTime } from '@/lib/formatDate';
import { addCommentAction, getCommentsAction, toggleLikeAction } from '@/lib/social-actions';
import { deletePostAction, deleteCommentAction, reportAction } from '@/lib/moderation-actions';
import { IconDotsVertical, IconUserCircle, IconEdit, IconTrash, IconFlag, IconHeartFilled, IconHeart, IconX } from '@tabler/icons-react';
import { modals } from '@mantine/modals';
import { EditPostForm } from "@/components/EditPostForm/EditPostForm";
import {useRouter} from "next/navigation";

// (这里的 Comment 类型定义、ActionMenu、CommentInput、PostContentView 辅助组件可以从 PostFeed.tsx 移过来)
type Comment = { id: number; content: string; created_at: Date; user_id: number; username: string; avatar_url: string | null; };

interface ActionMenuProps {
    isOwner: boolean;
    isAdmin: boolean;
    onDelete: () => void;
    onReport: () => void;
    onEdit?: () => void;
}

function ActionMenu({ isOwner, isAdmin, onDelete, onReport, onEdit }: ActionMenuProps) {
    const openDeleteModal = () => modals.openConfirmModal({
        title: '确认删除',
        centered: true,
        children: (<Text size="sm">确定要删除这条内容吗？此操作不可撤销。</Text>),
        labels: {confirm: '确认删除', cancel: '取消'},
        confirmProps: {color: 'red'},
        onConfirm: onDelete,
        zIndex: 4000,
    });

    return (
        <Menu shadow="md" width={200} position="bottom-end" withArrow zIndex={2100}>
            <Menu.Target>
                <ActionIcon variant="subtle" color="gray"><IconDotsVertical size="1rem" /></ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
                {/* 编辑：只对内容所有者显示 */}
                {isOwner && onEdit && (
                    <Menu.Item leftSection={<IconEdit style={{ width: rem(14), height: rem(14) }} />} onClick={onEdit}>
                        编辑
                    </Menu.Item>
                )}

                {/* 举报：只对非内容所有者且非管理员的普通用户显示 */}
                {!isOwner && !isAdmin && (
                    <Menu.Item leftSection={<IconFlag style={{ width: rem(14), height: rem(14) }} />} onClick={onReport}>
                        举报
                    </Menu.Item>
                )}

                {/* 删除：对内容所有者 或 任何管理员/超级管理员 显示 */}
                {(isOwner || isAdmin) && (
                    <Menu.Item
                        color="red"
                        leftSection={<IconTrash style={{ width: rem(14), height: rem(14) }} />}
                        onClick={openDeleteModal}
                    >
                        {/* 根据身份显示不同文本 */}
                        {isOwner ? '删除' : '删除 (管理员)'}
                    </Menu.Item>
                )}
            </Menu.Dropdown>
        </Menu>
    );
}

// -----------------------------------------------------------------------------
// CommentInput: “哑”组件，只负责UI和调用父级函数
// -----------------------------------------------------------------------------
interface CommentInputProps {
    onSubmit: (content: string) => Promise<void>;
}

function CommentInput({onSubmit}: CommentInputProps) {
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddComment = async () => {
        if (!newComment.trim() || isSubmitting) return;
        setIsSubmitting(true);
        await onSubmit(newComment);
        setNewComment('');
        setIsSubmitting(false);
    };

    return (
        <Paper p="sm" radius={0} withBorder>
            <Group gap="sm">
                <Textarea
                    placeholder="留下你的精彩评论..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    style={{flex: 1}}
                    autosize
                    minRows={1}
                    maxRows={4}
                />
                <Button onClick={handleAddComment} loading={isSubmitting}>发送</Button>
            </Group>
        </Paper>
    );
}

// -----------------------------------------------------------------------------
// PostContentView: 接收所有需要的 props 来正确渲染
// -----------------------------------------------------------------------------
interface PostContentViewProps {
    post: PostWithDetails;
    actionMenu: React.ReactNode;
}

const PostContentView = ({post, actionMenu}: PostContentViewProps) => {
    const authorName = post.is_anonymous ? '匿名用户' : post.user?.username || '未知用户';
    const authorAvatar = post.is_anonymous ? null : post.user?.avatar_url;
    const postDate = formatInBeijingTime(post.created_at, 'yyyy年M月d日 HH:mm');

    const handleLikeClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        React.startTransition(() => {
            toggleLikeAction(post.id);
        });
    }

    return (
        <Box>
            {post.images.length > 0 && (
                <Carousel withIndicators styles={{root: {backgroundColor: '#f1f3f5'}}}>
                    {post.images.map((image, index) => (
                        <Carousel.Slide key={index}>
                            <Center h={{base: 'auto', md: '60vh'}}>
                                <img src={image.image_url} alt={`Image ${index + 1}`} style={{
                                    width: 'auto',
                                    height: 'auto',
                                    maxWidth: '100%',
                                    maxHeight: '60vh',
                                    objectFit: 'contain'
                                }}/>
                            </Center>
                        </Carousel.Slide>
                    ))}
                </Carousel>
            )}
            <Box p="md">
                <Group justify="space-between" wrap="nowrap">
                    <Group>
                        <Avatar src={authorAvatar} radius="xl"><IconUserCircle/></Avatar>
                        <div><Text size="sm" fw={500}>{authorName}</Text><Text size="xs" c="dimmed">{postDate}</Text>
                        </div>
                    </Group>
                    <Group wrap="nowrap">
                        <ActionIcon variant="subtle" color="gray" onClick={handleLikeClick}>
                            {post.has_liked ? <IconHeartFilled style={{color: 'red'}}/> : <IconHeart/>}
                        </ActionIcon>
                        <Text size="sm">{post.like_count}</Text>
                        {actionMenu}
                    </Group>
                </Group>
                {post.is_announcement && <Badge color="yellow" mt="sm">公告</Badge>}
                <Text my="md" style={{whiteSpace: 'pre-wrap'}}>{post.content}</Text>
            </Box>
        </Box>
    );
}

interface PostDetailViewProps {
    post: PostWithDetails;
    currentUserId?: number;
    currentUserRole?: string;
    onClose?: () => void; // 用于关闭 Modal 的回调
}

export function PostDetailView({ post, currentUserId, currentUserRole, onClose }: PostDetailViewProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoadingComments, setIsLoadingComments] = useState(true);
    const isAdmin = currentUserRole === 'Admin' || currentUserRole === 'SuperAdmin';

    const router = useRouter(); // 2. 获取 router 实例

    // 3. 定义一个智能的关闭处理函数
    const handleClose = onClose ? onClose : () => router.push('/');

    const fetchComments = (postId: number) => {
        setIsLoadingComments(true);
        getCommentsAction(postId).then(data => {
            setComments(data.map(c => ({...c, created_at: new Date(c.created_at), user_id: c.user_id})));
            setIsLoadingComments(false);
        });
    };

    useEffect(() => {
        if (post) {
            fetchComments(post.id);
        }
    }, [post]);

    const handleAddComment = async (content: string) => {
        await addCommentAction(post.id, content);
        fetchComments(post.id);
    };

    const openReportModal = (contentId: number, contentType: 'post' | 'comment') => {
        let reason = '';
        modals.openConfirmModal({
            title: '举报内容',
            children: (<Textarea placeholder="请输入举报原因..." label="举报原因" withAsterisk
                                 onChange={(e) => reason = e.currentTarget.value}/>),
            labels: {confirm: '提交举报', cancel: '取消'},
            centered: true,
            zIndex: 3500,
            onConfirm: () => reportAction({contentId, contentType, reason}),
        });
    }

    const handleOpenEditModal = (post: PostWithDetails) => {
        modals.open({
            title: '编辑帖子',
            centered: true,
            zIndex: 3500,
            size: 'lg',
            children: <EditPostForm post={post} userRole={currentUserRole} />,
        });
    };

    const commentsList = (
        isLoadingComments ? <Center h="100%"><Loader/></Center> :
            <Stack gap="md" p="md">
                {comments.length === 0 && <Text c="dimmed" ta="center">还没有评论，快来抢沙发吧！</Text>}
                {comments.map(comment => (
                    <Group key={comment.id} gap="sm" align="flex-start" wrap="nowrap">
                        <Avatar src={comment.avatar_url} radius="xl"/>
                        <Box style={{flex: 1}}>
                            <Text size="sm" fw={500}>{comment.username}</Text>
                            <Text size="sm" style={{whiteSpace: 'pre-wrap'}}>{comment.content}</Text>
                            <Text size="xs"
                                  c="dimmed">{formatInBeijingTime(comment.created_at, 'yyyy年M月d日 HH:mm')}</Text>
                        </Box>
                        <ActionMenu
                            isOwner={currentUserId === comment.user_id}
                            isAdmin={isAdmin}
                            onDelete={() => deleteCommentAction(comment.id).then(() => fetchComments(post.id))}
                            onReport={() => openReportModal(comment.id, 'comment')}
                            onEdit={function (): void {
                                throw new Error('Function not implemented.');
                            }}/>
                    </Group>
                ))}
            </Stack>
    );

    const postActionMenu = (
        <ActionMenu
            isOwner={currentUserId === post.user_id}
            isAdmin={isAdmin}
            onDelete={() => {
                deletePostAction(post.id);
                onClose?.();
            }}
            onReport={() => openReportModal(post.id, 'post')}
            onEdit={() => handleOpenEditModal(post)}
        />
    );

    return (
        // 这里是我们之前在 PostFeed 中为桌面端设计的 Flexbox 布局
        <Box style={{ display: 'flex', height: '100%'}}>
            {/* 左侧栏 */}
            <Box style={{ flex: 7, borderRight: '1px solid #dee2e6', overflowY: 'auto' }}>
                <PostContentView post={post} actionMenu={postActionMenu} />
            </Box>
            {/* 右侧栏 */}
            <Box style={{ flex: 5, display: 'flex', flexDirection: 'column' }}>
                <Group justify='space-between' p='sm' style={{ borderBottom: '1px solid #dee2e6' }}>
                    <Text fw={500}>评论 ({comments.length})</Text>
                    <ActionIcon onClick={handleClose} variant='subtle'><IconX /></ActionIcon>
                </Group>
                <Box style={{ flex: 1, overflowY: 'auto' }}>
                    {commentsList}
                </Box>
                <CommentInput onSubmit={handleAddComment} />
            </Box>
        </Box>
    );
}
