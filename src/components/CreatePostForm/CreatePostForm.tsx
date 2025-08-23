// components/CreatePostForm/CreatePostForm.tsx
'use client';

import { useState } from 'react';
import { createPost } from '@/lib/actions';
import { Textarea, Button, Checkbox, Group, FileButton, Text, SimpleGrid, Image, Box } from '@mantine/core';
import { notifications } from '@mantine/notifications'; // Mantine 的通知库

export function CreatePostForm() {
    const [content, setContent] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleFileChange = (selectedFiles: File[]) => {
        const limitedFiles = selectedFiles.slice(0, 9);
        setFiles(limitedFiles);
    };

    const handleSubmit = async () => {
        if (!content.trim() && files.length === 0) {
            notifications.show({ color: 'red', title: '发布失败', message: '内容和图片不能都为空' });
            return;
        }
        if (isSubmitting) return;

        setIsSubmitting(true);

        try {
            // 1. 上传图片
            const imageUrls = await Promise.all(
                files.map(async (file) => {
                    const response = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
                        method: 'POST', body: file,
                    });
                    if (!response.ok) throw new Error('图片上传失败');
                    const newBlob = await response.json();
                    return newBlob.url;
                })
            );

            // 2. 调用 Server Action
            await createPost({ content, imageUrls, is_anonymous: isAnonymous });

            notifications.show({ color: 'green', title: '成功', message: '帖子已发布！' });

            // 3. 成功后清空表单
            setContent('');
            setFiles([]);
            setIsAnonymous(false);

        } catch (err: any) {
            notifications.show({ color: 'red', title: '发布失败', message: err.message || '请稍后重试' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const previews = files.map((file, index) => {
        const imageUrl = URL.createObjectURL(file);
        return <Image key={index} src={imageUrl} radius="sm" onLoad={() => URL.revokeObjectURL(imageUrl)} />;
    });

    return (
        <Box component="form" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} p="md" mb="xl" style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: 'var(--mantine-radius-md)' }}>
            <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="分享新鲜事..."
                autosize
                minRows={3}
            />
            <SimpleGrid cols={{ base: 4, xs: 6 }} mt="md">
                {previews}
            </SimpleGrid>
            <Group justify="space-between" mt="md">
                <Group>
                    <FileButton onChange={handleFileChange} accept="image/png,image/jpeg" multiple>
                        {(props) => <Button variant="light" {...props}>选择图片</Button>}
                    </FileButton>
                    <Text size="sm" c="dimmed">{files.length}/9</Text>
                    <Checkbox
                        label="匿名发布"
                        checked={isAnonymous}
                        onChange={(event) => setIsAnonymous(event.currentTarget.checked)}
                    />
                </Group>
                <Button type="submit" loading={isSubmitting}>
                    发布
                </Button>
            </Group>
        </Box>
    );
}

// 注意: 为了使用 notifications, 你需要在 app/layout.tsx 的 MantineProvider 内部添加 <Notifications />
// <MantineProvider><Notifications />{children}</MantineProvider>