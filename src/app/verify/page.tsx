// app/verify/page.tsx
'use client';
import { Container, Title, Text, Button, Modal, TextInput, FileInput, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
// 1. Import useRef from React
import { useState, useRef } from 'react';
import { submitVerificationRequestAction } from '@/lib/verification-actions';
import { notifications } from '@mantine/notifications';

export default function VerifyPage() {
    const [opened, { open, close }] = useDisclosure(false);
    const [studentCardFile, setStudentCardFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    // 2. Create a ref to hold the form element
    const formRef = useRef<HTMLFormElement>(null);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!studentCardFile) {
            notifications.show({ color: 'red', message: '请上传学生卡照片' });
            return;
        }
        // Add a check to ensure the ref is connected
        if (!formRef.current) return;

        setIsSubmitting(true);

        try {
            const uploadResponse = await fetch(`/api/upload?filename=${encodeURIComponent(studentCardFile.name)}`, {
                method: 'POST', body: studentCardFile,
            });
            if (!uploadResponse.ok) throw new Error('图片上传失败');
            const blob = await uploadResponse.json();

            // 3. Use the ref's current value to create FormData
            const formData = new FormData(formRef.current);
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
            {/* ... Other JSX is the same ... */}
            <Modal opened={opened} onClose={close} title="手动批准申请" centered>
                {/* 4. Attach the ref to the form element */}
                <form ref={formRef} onSubmit={handleSubmit}>
                    <Stack>
                        <TextInput name="realName" label="真实姓名" withAsterisk />
                        <TextInput name="classNumber" label="四位数字班级 (如 2501)" withAsterisk />
                        <TextInput name="email" label="hsefz.cn 邮箱" withAsterisk />
                        <FileInput
                            label="学生卡照片"
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