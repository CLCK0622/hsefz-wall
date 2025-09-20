'use client';

import {useEffect, useState} from 'react';
import {createPost} from '@/lib/actions';
import {
    Textarea,
    Button,
    Checkbox,
    Group,
    FileButton,
    Text,
    SimpleGrid,
    Image,
    Box,
    ActionIcon,
    Indicator
} from '@mantine/core';
import {notifications} from '@mantine/notifications';
import {IconX} from '@tabler/icons-react';

export function CreatePostForm({ userRole }: { userRole?: string }) {
    const [content, setContent] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAnnouncement, setIsAnnouncement] = useState(false);

    useEffect(() => {
        if (isAnnouncement) {
            setIsAnonymous(true);
        }
    }, [isAnnouncement]);

    const isAdmin = userRole === 'Admin' || userRole === 'SuperAdmin';

    const handleFileChange = (selectedFiles: File[]) => {
        // 允许用户继续添加图片，直到达到上限
        const combinedFiles = [...files, ...selectedFiles];
        const limitedFiles = combinedFiles.slice(0, 9);
        setFiles(limitedFiles);
    };

    // 1. 新增：删除指定索引的图片
    const handleRemoveFile = (indexToRemove: number) => {
        setFiles(files.filter((_, index) => index !== indexToRemove));
    };

    const handleSubmit = async () => {
        if (!content.trim() && files.length === 0) {
            notifications.show({color: 'red', title: '发布失败', message: '内容和图片不能都为空'});
            return;
        }
        if (isSubmitting) return;

        setIsSubmitting(true);

        try {
            // 1. 上传图片
            const imageUrls = await Promise.all(
                files.map(async (file) => {
                    const uniqueFilename = `${file.name}-${Date.now()}`;
                    const response = await fetch(`/api/upload?filename=${encodeURIComponent(uniqueFilename)}`, {
                        method: 'POST', body: file,
                    });
                    if (!response.ok) throw new Error('图片上传失败');
                    const newBlob = await response.json();
                    return newBlob.url;
                })
            );

            // 2. 调用 Server Action
            await createPost({content, imageUrls, is_anonymous: isAnonymous, is_announcement: isAnnouncement});

            notifications.show({color: 'green', title: '成功', message: '帖子已发布！'});

            // 3. 成功后清空表单
            setContent('');
            setFiles([]);
            setIsAnonymous(false);
            setIsAnnouncement(false);

        } catch (err: any) {
            notifications.show({color: 'red', title: '发布失败', message: err.message || '请稍后重试'});
        } finally {
            setIsSubmitting(false);
        }
    };

    // 2. 更新：渲染带有删除按钮的图片预览
    const previews = files.map((file, index) => {
        const imageUrl = URL.createObjectURL(file);
        return (
            <Indicator
                key={index}
                size={0}
                position="top-end"
                label={
                    <ActionIcon
                        size="xs"
                        color="red"
                        radius="xl"
                        variant="filled"
                        onClick={() => handleRemoveFile(index)}
                    >
                        <IconX size={12}/>
                    </ActionIcon>
                }
            >
                <Image
                    src={imageUrl}
                    radius="sm"
                    onLoad={() => URL.revokeObjectURL(imageUrl)}
                />
            </Indicator>
        );
    });

    return (
        <Box component="form" onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
        }} p="md" mb="xl"
             style={{border: '1px solid var(--mantine-color-gray-3)', borderRadius: 'var(--mantine-radius-md)'}}>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="分享新鲜事..." autosize
                      minRows={3}/>

            {files.length > 0 && (
                <SimpleGrid cols={{base: 4, xs: 6}} mt="md">
                    {previews}
                </SimpleGrid>
            )}

            <Group justify="space-between" mt="md">
                <Group>
                    {/* 3. 更新：按钮文字和逻辑 */}
                    <FileButton onChange={handleFileChange} accept="image/png,image/jpeg,image/webp,image/gif" multiple>
                        {(props) => <Button variant="light" {...props} disabled={files.length >= 9}>添加图片</Button>}
                    </FileButton>
                    <Text size="sm" c="dimmed">{files.length}/9</Text>
                    {/* 4. 新增：文件大小提示 */}
                    <Text size="xs" c="dimmed">单图最大 4.5MB</Text>
                </Group>
                <Group>
                    {isAdmin && (
                        <Checkbox
                            label="发布为公告"
                            checked={isAnnouncement}
                            onChange={(event) => setIsAnnouncement(event.currentTarget.checked)}
                        />
                    )}
                    <Checkbox label="匿名发布" checked={isAnonymous} disabled={isAnnouncement}
                              onChange={(event) => setIsAnonymous(event.currentTarget.checked)}/>
                    <Button type="submit" loading={isSubmitting}>发布</Button>
                </Group>
            </Group>
        </Box>
    );
}