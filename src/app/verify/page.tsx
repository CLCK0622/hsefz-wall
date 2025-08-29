// app/verify/page.tsx
'use client';
import { Container, Title, Text, Button, Modal, TextInput, FileInput, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useState } from 'react';
import { submitVerificationRequestAction } from '@/lib/verification-actions';
import { notifications } from '@mantine/notifications';

export default function VerifyPage() {
    const [opened, { open, close }] = useDisclosure(false);
    const [studentCardFile, setStudentCardFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!studentCardFile) {
            notifications.show({ color: 'red', message: '请上传学生卡照片' });
            return;
        }
        setIsSubmitting(true);

        try {
            // 1. 上传图片
            const uploadResponse = await fetch(`/api/upload?filename=${encodeURIComponent(studentCardFile.name)}`, {
                method: 'POST', body: studentCardFile,
            });
            if (!uploadResponse.ok) throw new Error('图片上传失败');
            const blob = await uploadResponse.json();

            // 2. 提交表单
            const formData = new FormData(event.currentTarget);
            formData.append('imageUrl', blob.url);

            const result = await submitVerificationRequestAction(formData);
            notifications.show({ color: 'green', title: '成功', message: result.message });
            close();
        } catch (error: any) {
            notifications.show({ color: 'red', title: '错误', message: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Container size="sm" py="xl">
            <Title order={2} ta="center">账户邮箱验证</Title>
            <Text c="dimmed" ta="center" mt="md">
                为了访问社区内容，您的账户主邮箱必须是 `@hsefz.cn` 后缀。
            </Text>

            <Stack mt="xl" gap="md">
                <Text fw={500}>方案一 (推荐):</Text>
                <Text>请点击页面右上角的头像，选择“管理账户”，在“邮箱地址”部分，添加您的 `@hsefz.cn` 邮箱并将其设为主要邮箱。</Text>

                <Text fw={500} mt="lg">方案二:</Text>
                <Text>如果您无法使用校内邮箱，可以提交以下信息申请管理员手动批准。</Text>
                <Button onClick={open}>申请手动批准</Button>
            </Stack>

            <Modal opened={opened} onClose={close} title="手动批准申请" centered zIndex="3000">
                <form onSubmit={handleSubmit}>
                    <Stack>
                        <TextInput name="realName" label="真实姓名" withAsterisk />
                        <TextInput name="classNumber" label="四位数字班级 (如 2501)" withAsterisk />
                        <TextInput name="email" label="hsefz.cn 邮箱" withAsterisk />
                        <FileInput
                            label="学生卡照片（不超过 4.5MB）"
                            placeholder="点击上传"
                            value={studentCardFile}
                            onChange={setStudentCardFile}
                            withAsterisk
                            accept="image/*"
                        />
                        <Button type="submit" mt="md" loading={isSubmitting}>提交申请</Button>
                    </Stack>
                </form>
            </Modal>
        </Container>
    );
}