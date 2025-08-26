// components/EditPostForm.tsx
'use client';

import { useState } from 'react';
import { PostWithDetails } from '../PostCard/PostCard';
import { Textarea, Checkbox, Group, Button, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { updatePostAction } from '@/lib/moderation-actions';

interface EditPostFormProps {
    post: PostWithDetails;
}

export function EditPostForm({ post }: EditPostFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData(event.currentTarget);
        try {
            await updatePostAction(formData);
            notifications.show({ color: 'green', title: '成功', message: '帖子已更新！' });
            modals.closeAll(); // 成功后关闭所有弹窗
        } catch (error: any) {
            notifications.show({ color: 'red', title: '错误', message: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <Stack>
                <input type="hidden" name="postId" value={post.id} />
                <Textarea
                    name="content"
                    label="帖子内容"
                    defaultValue={post.content}
                    autosize
                    minRows={5}
                />
                <Checkbox
                    name="is_anonymous"
                    label="匿名发布"
                    defaultChecked={post.is_anonymous}
                    value="true"
                />
                <Group justify="flex-end" mt="md">
                    <Button variant="default" onClick={() => modals.closeAll()}>取消</Button>
                    <Button type="submit" loading={isSubmitting}>保存更改</Button>
                </Group>
            </Stack>
        </form>
    );
}