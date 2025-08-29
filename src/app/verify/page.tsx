// app/verify/page.tsx
'use client';
import {Container, Title, Text, Button, Modal, TextInput, FileInput, Stack, Alert, Center, Loader} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {useState, useRef, useEffect} from 'react';
import {getUserVerificationStatusAction, submitVerificationRequestAction} from '@/lib/verification-actions';
import { notifications } from '@mantine/notifications';
import {IconInfoCircle} from "@tabler/icons-react";

export default function VerifyPage() {
    const [opened, { open, close }] = useDisclosure(false);
    const [studentCardFile, setStudentCardFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);
    const [verificationStatus, setVerificationStatus] = useState<'loading' | 'pending' | 'rejected' | null>('loading');

    // 4. 页面加载时获取用户当前的认证状态
    useEffect(() => {
        getUserVerificationStatusAction().then(status => {
            setVerificationStatus(status as any);
        });
    }, []);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!studentCardFile) {
            notifications.show({ color: 'red', message: '请上传学生卡照片' });
            return;
        }
        if (!formRef.current) return;

        setIsSubmitting(true);

        try {
            // 图片上传逻辑不变
            const uploadResponse = await fetch(`/api/upload?filename=${encodeURIComponent(studentCardFile.name)}`, {
                method: 'POST', body: studentCardFile,
            });
            if (!uploadResponse.ok) throw new Error('图片上传失败');
            const blob = await uploadResponse.json();

            // 1. 使用 FormData 从表单读取数据
            const formData = new FormData(formRef.current);

            // 2. 构造一个普通的 JavaScript 对象
            const dataToSubmit = {
                realName: formData.get('realName') as string,
                classNumber: formData.get('classNumber') as string,
                email: formData.get('email') as string,
                imageUrl: blob.url,
            };

            // 3. 将这个普通对象传递给 Server Action
            const result = await submitVerificationRequestAction(dataToSubmit);
            notifications.show({ color: 'green', title: '成功', message: result.message });
            setVerificationStatus('pending');
            close();

        } catch (error: any) {
            notifications.show({ color: 'red', title: '错误', message: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderApplySection = () => {
        if (verificationStatus === 'loading') {
            return <Center mt="xl"><Loader /></Center>;
        }
        if (verificationStatus === 'pending') {
            return (
                <Alert color="blue" title="审核中" icon={<IconInfoCircle />} mt="xl">
                    您的认证申请已提交，正在等待管理员审核，请耐心等待。
                </Alert>
            );
        }
        return (
            <>
                {verificationStatus === 'rejected' && (
                    <Alert color="red" title="申请被拒绝" icon={<IconInfoCircle />} mt="xl">
                        您上一次的申请被拒绝了，请仔细核对您提交的信息后重新申请。
                    </Alert>
                )}
                <Button onClick={open} mt="md">申请手动批准</Button>
            </>
        );
    }

    return (
        <Container size="sm" py="xl">
            <Title order={2} ta="center">账户邮箱验证</Title>
            <Text c="dimmed" ta="center" mt="md">为了访问社区内容，您的账户主邮箱必须是 `@hsefz.cn` 后缀。</Text>

            <Stack mt="xl" gap="md">
                <Text fw={500}>方案一 (推荐):</Text>
                <Text>请点击页面右上角的头像，选择“管理账户”，在“邮箱地址”部分，添加您的 `@hsefz.cn` 邮箱并将其设为主要邮箱。</Text>
                <Text fw={500} mt="lg">方案二:</Text>
                <Text>如果您无法使用校内邮箱，可以提交以下信息申请管理员手动批准。</Text>
                {renderApplySection()}
            </Stack>

            <Modal opened={opened} onClose={close} title="手动批准申请" centered>
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