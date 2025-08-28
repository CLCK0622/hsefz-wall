// components/PostFeed/PostFeed.tsx
'use client';
import {useState, useEffect} from 'react';
import {
    Box,
    Modal,
    Text,
    Group,
    Avatar,
    Badge,
    Grid,
    Stack,
    Textarea,
    Button,
    Loader,
    ScrollArea,
    ActionIcon,
    Paper,
    Center,
    Menu,
    rem
} from '@mantine/core';
import {useDisclosure, useMediaQuery} from '@mantine/hooks';
import {Carousel} from '@mantine/carousel';
import '@mantine/carousel/styles.css';
import {PostCard, PostWithDetails} from '../PostCard/PostCard';
import {IconDotsVertical, IconUserCircle, IconX, IconEdit, IconTrash, IconFlag} from '@tabler/icons-react';
import {addCommentAction, getCommentsAction} from '@/lib/social-actions';
import {deletePostAction, deleteCommentAction, reportAction} from '@/lib/moderation-actions';
import styles from './PostFeed.module.scss';
import {modals} from '@mantine/modals';
import {EditPostForm} from "@/components/EditPostForm/EditPostForm";

// 1. 更新 Comment 类型定义，加入 user_id
type Comment = {
    id: number;
    content: string;
    created_at: Date;
    user_id: number; // <-- 新增
    username: string;
    avatar_url: string | null;
}

// -----------------------------------------------------------------------------
// ActionMenu: 一个可复用的操作菜单
// -----------------------------------------------------------------------------
interface ActionMenuProps {
    isOwner: boolean;
    isAdmin: boolean;
    onDelete: () => void;
    onReport: () => void;
    onEdit: () => void; // 未来可以添加
}

function ActionMenu({isOwner, isAdmin, onDelete, onReport, onEdit}: ActionMenuProps) {
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
                <ActionIcon variant="subtle" color="gray"><IconDotsVertical size="1rem"/></ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
                {isOwner && (
                    <>
                        <Menu.Item leftSection={<IconEdit style={{width: rem(14), height: rem(14)}}/>} onClick={onEdit}>
                            编辑
                        </Menu.Item>
                        <Menu.Item color="red" leftSection={<IconTrash style={{width: rem(14), height: rem(14)}}/>}
                                   onClick={openDeleteModal}>删除</Menu.Item>
                    </>
                )}
                {!isOwner && (
                    <Menu.Item leftSection={<IconFlag style={{width: rem(14), height: rem(14)}}/>}
                               onClick={onReport}>举报</Menu.Item>
                )}
                {isAdmin && !isOwner && (
                    <Menu.Item color="red" leftSection={<IconTrash style={{width: rem(14), height: rem(14)}}/>}
                               onClick={openDeleteModal}>删除 (管理员)</Menu.Item>
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
    const postDate = new Date(post.created_at).toLocaleString('zh-CN', {dateStyle: 'medium', timeStyle: 'short'});

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
                    {actionMenu}
                </Group>
                {post.is_announcement && <Badge color="yellow" mt="sm">公告</Badge>}
                <Text my="md" style={{whiteSpace: 'pre-wrap'}}>{post.content}</Text>
            </Box>
        </Box>
    );
}

// -----------------------------------------------------------------------------
// 主组件 PostFeed: 负责所有状态管理和逻辑
// -----------------------------------------------------------------------------
export function PostFeed({posts, currentUserId, currentUserRole}: {
    posts: PostWithDetails[];
    currentUserId?: number;
    currentUserRole?: string;
}) {
    const [opened, {open, close}] = useDisclosure(false);
    const [selectedPost, setSelectedPost] = useState<PostWithDetails | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoadingComments, setIsLoadingComments] = useState(false);
    const isMobile = useMediaQuery('(max-width: 768px)');
    const isAdmin = currentUserRole === 'admin';

    const fetchComments = (postId: number) => {
        setIsLoadingComments(true);
        getCommentsAction(postId).then(data => {
            setComments(data.map(c => ({...c, created_at: new Date(c.created_at), user_id: c.user_id})));
            setIsLoadingComments(false);
        });
    }

    useEffect(() => {
        if (selectedPost) {
            fetchComments(selectedPost.id);
        }
    }, [selectedPost]);

    const handleAddComment = async (content: string) => {
        if (!selectedPost) return;
        await addCommentAction(selectedPost.id, content);
        fetchComments(selectedPost.id); // 提交后重新获取最新评论列表
    }

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

    const handlePostClick = (post: PostWithDetails) => {
        setSelectedPost(post);
        open();
    };
    const handleClose = () => {
        close();
        setTimeout(() => setSelectedPost(null), 200);
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
                                  c="dimmed">{new Date(comment.created_at).toLocaleString('zh-CN', {timeStyle: 'short'})}</Text>
                        </Box>
                        <ActionMenu
                            isOwner={currentUserId === comment.user_id}
                            isAdmin={isAdmin}
                            onDelete={() => deleteCommentAction(comment.id).then(() => fetchComments(selectedPost!.id))}
                            onReport={() => openReportModal(comment.id, 'comment')}
                            onEdit={function (): void {
                                throw new Error('Function not implemented.');
                            }}/>
                    </Group>
                ))}
            </Stack>
    );

    const postActionMenu = selectedPost ? (
        <ActionMenu
            isOwner={currentUserId === selectedPost.user_id}
            isAdmin={isAdmin}
            onDelete={() => {
                deletePostAction(selectedPost.id);
                handleClose();
            }}
            onReport={() => openReportModal(selectedPost.id, 'post')}
            onEdit={() => handleOpenEditModal(selectedPost)} // <-- 传入函数
        />
    ) : null;

    return (
        <>
            <Modal opened={opened} onClose={handleClose} size="85%" fullScreen={isMobile} centered withCloseButton={false} padding={0} zIndex={2000} styles={{ body: { height: '100%' } }}>
                {selectedPost && (
                    isMobile ? (
                        // --- 移动端全新布局 ---
                        <Box style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            {/* 1. 固定的头部 */}
                            <Group justify='space-between' p='xs' style={{ borderBottom: '1px solid #dee2e6' }}>
                                <Text fw={500}>帖子详情</Text>
                                <ActionIcon onClick={handleClose} variant='subtle'><IconX /></ActionIcon>
                            </Group>
                            {/* 2. 可伸缩、可滚动的内容区 */}
                            <Box style={{ flex: 1, overflowY: 'auto' }}>
                                <PostContentView post={selectedPost} actionMenu={postActionMenu} />
                                {commentsList}
                            </Box>
                            {/* 3. 固定的底部输入框 */}
                            <CommentInput onSubmit={handleAddComment} />
                        </Box>
                    ) : (
                        // --- 桌面端全新布局 (用 Box 代替 Grid) ---
                        <Box style={{ display: 'flex', height: '100%', maxHeight: '88vh', minHeight: '50vh' }}>
                            {/* 左侧栏 */}
                            <Box style={{ flex: 7, borderRight: '1px solid #dee2e6', overflowY: 'auto' }}>
                                <PostContentView post={selectedPost} actionMenu={postActionMenu} />
                            </Box>
                            {/* 右侧栏 */}
                            <Box style={{ flex: 5, display: 'flex', flexDirection: 'column' }}>
                                {/* 1. 固定的头部 */}
                                <Group justify='space-between' p='sm' style={{ borderBottom: '1px solid #dee2e6' }}>
                                    <Text fw={500}>评论 ({comments.length})</Text>
                                    <ActionIcon onClick={handleClose} variant='subtle'><IconX /></ActionIcon>
                                </Group>
                                {/* 2. 可伸缩、可滚动的内容区 */}
                                <Box style={{ flex: 1, overflowY: 'auto' }}>
                                    {commentsList}
                                </Box>
                                {/* 3. 固定的底部输入框 */}
                                <CommentInput onSubmit={handleAddComment} />
                            </Box>
                        </Box>
                    )
                )}
            </Modal>

            <Box className={styles.masonryContainer}>
                {posts.map(post => <PostCard key={post.id} post={post} onClick={() => handlePostClick(post)}
                                             className={styles.masonryItem}/>)}
            </Box>
        </>
    );
}