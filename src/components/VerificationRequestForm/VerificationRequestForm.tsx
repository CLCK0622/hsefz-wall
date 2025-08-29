'use client';

import { useState } from 'react';
import { Accordion, Text, Stack, Image, Button, Group, Box, Avatar } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { approveVerificationAction, rejectVerificationAction } from '@/lib/admin-actions';

// We pass the request data as a prop
export function VerificationRequestItem({ request }: { request: any }) {
    const [isLoading, setIsLoading] = useState(false);

    const handleApprove = async () => {
        setIsLoading(true);
        try {
            await approveVerificationAction(request.id, request.clerk_user_id!);
            notifications.show({ color: 'green', message: '已批准' });
            // Instead of reloading, we can let revalidatePath handle the update
        } catch (error: any) {
            notifications.show({ color: 'red', message: `操作失败: ${error.message}` });
        }
        setIsLoading(false);
    };

    const handleReject = async () => {
        setIsLoading(true);
        try {
            await rejectVerificationAction(request.id);
            notifications.show({ color: 'gray', message: '已拒绝' });
        } catch (error: any) {
            notifications.show({ color: 'red', message: `操作失败: ${error.message}` });
        }
        setIsLoading(false);
    };

    return (
        <Accordion.Item key={request.id} value={String(request.id)}>
            <Accordion.Control>
                <Text>
                    申请用户 Clerk ID: <Text span c="blue" inherit>{request.clerk_user_id}</Text>
                </Text>
            </Accordion.Control>
            <Accordion.Panel>
                <Stack>
                    <Text><strong>提交信息:</strong> {request.details_text}</Text>
                    <Text><strong>申请邮箱:</strong> {request.requested_email}</Text>
                    <Text><strong>学生卡照片:</strong></Text>
                    <Image src={request.image_url} maw={240} radius="sm" alt="学生卡照片" />

                    <Group mt="md">
                        <Button
                            color="green"
                            size="xs"
                            onClick={handleApprove}
                            loading={isLoading}
                            disabled={isLoading}
                            type="button"
                        >
                            批准认证
                        </Button>
                        <Button
                            color="red"
                            size="xs"
                            onClick={handleReject}
                            loading={isLoading}
                            disabled={isLoading}
                            type="button"
                        >
                            拒绝
                        </Button>
                    </Group>
                </Stack>
            </Accordion.Panel>
        </Accordion.Item>
    );
}