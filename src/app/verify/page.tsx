// app/verify/page.tsx
'use client';
import {
    Container,
    Title,
    Text,
    Button,
    Modal,
    TextInput,
    FileInput,
    Stack,
    Alert,
    Center,
    Loader,
    Paper
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useState, useRef, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { autoVerifyAction, submitVerificationRequestAction, getUserVerificationStatusAction } from '@/lib/verification-actions';
import { notifications } from '@mantine/notifications';
import { IconInfoCircle } from '@tabler/icons-react';

export default function VerifyPage() {
    // Hooks for controlling modals
    const [manualModalOpened, { open: openManualModal, close: closeManualModal }] = useDisclosure(false);
    const [autoModalOpened, { open: openAutoModal, close: closeAutoModal }] = useDisclosure(false);

    // State for form submissions and user status
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [studentCardFile, setStudentCardFile] = useState<File | null>(null);
    const [verificationStatus, setVerificationStatus] = useState<'loading' | 'pending' | 'rejected' | null>('loading');

    const { user } = useUser();
    const router = useRouter();
    const manualFormRef = useRef<HTMLFormElement>(null);

    // 1. 页面加载时，获取用户当前的认证申请状态
    useEffect(() => {
        getUserVerificationStatusAction().then(status => {
            setVerificationStatus(status as any);
        });
    }, []);

    // 2. 处理自动验证的提交
    const handleAutoVerifySubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(event.currentTarget);

        try {
            const result = await autoVerifyAction(formData);
            if (result.success) {
                notifications.show({ color: 'green', title: '成功', message: '验证成功！即将跳转到主页...' });
                // 验证成功后，强制刷新页面以让中间件重新评估权限
                window.location.href = '/';
            }
        } catch (error: any) {
            notifications.show({ color: 'red', title: '验证失败', message: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    // 3. 处理手动验证的提交 (逻辑基本不变)
    const handleManualSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!studentCardFile) { notifications.show({ color: 'red', message: '请上传学生卡照片' }); return; }
        if (!manualFormRef.current) return;

        setIsSubmitting(true);
        try {
            const uploadResponse = await fetch(`/api/upload?filename=${encodeURIComponent(studentCardFile.name)}`, { method: 'POST', body: studentCardFile });
            if (!uploadResponse.ok) throw new Error('图片上传失败');
            const blob = await uploadResponse.json();

            const formData = new FormData(manualFormRef.current);
            formData.append('imageUrl', blob.url);

            const dataToSubmit = {
                realName: formData.get('realName') as string,
                classNumber: formData.get('classNumber') as string,
                email: formData.get('email') as string,
                imageUrl: blob.url,
            };

            const result = await submitVerificationRequestAction(dataToSubmit);
            notifications.show({ color: 'green', title: '成功', message: result.message });
            setVerificationStatus('pending');
            closeManualModal();
        } catch (error: any) {
            notifications.show({ color: 'red', title: '错误', message: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const primaryEmail = user?.primaryEmailAddress?.emailAddress;
    const isHsefzEmail = primaryEmail?.endsWith('@hsefz.cn');

    // ------------------- 主渲染逻辑 -------------------
    if (verificationStatus === 'loading') {
        return <Center h="100vh"><Loader /></Center>;
    }

    if (verificationStatus === 'pending') {
        return (
            <Container size="sm" py="xl">
                <Alert color="blue" title="审核中" icon={<IconInfoCircle />} mt="xl">
                    您的认证申请已提交，正在等待管理员审核，请耐心等待。
                </Alert>
            </Container>
        );
    }

    return (
        <Container size="sm" py="xl">
            <Title order={2} ta="center">账户认证</Title>
            <Text c="dimmed" ta="center" mt="md">
                为了访问社区内容，您的账户需要与您的真实身份关联。
            </Text>

            {verificationStatus === 'rejected' && (
                <Alert color="red" title="申请被拒绝" icon={<IconInfoCircle />} mt="xl">
                    您上一次的申请被拒绝了，请仔细核对您提交的信息后重新申请。
                </Alert>
            )}

            <Stack mt="xl" gap="lg">
                {/* 4. 如果是 hsefz.cn 邮箱，显示自动验证选项 */}
                {isHsefzEmail && (
                    <Paper withBorder shadow="md" p="lg" radius="md">
                        <Text fw={500}>自动验证 (推荐)</Text>
                        <Text size="sm" c="dimmed" mt="xs">
                            您的主邮箱 ({primaryEmail}) 符合自动验证要求，请输入您的真实姓名以立即完成认证。
                        </Text>
                        <Button onClick={openAutoModal} mt="md">开始自动验证</Button>
                    </Paper>
                )}

                {/* 5. 手动验证选项 */}
                <Paper withBorder shadow="md" p="lg" radius="md">
                    <Text fw={500}>申请手动批准</Text>
                    <Text size="sm" c="dimmed" mt="xs">
                        如果自动验证失败，或您无法使用校内邮箱，可以提交资料申请管理员手动批准。
                    </Text>
                    <Button onClick={openManualModal} mt="md" variant="default">申请手动批准</Button>
                </Paper>
            </Stack>

            {/* 自动验证 Modal */}
            <Modal opened={autoModalOpened} onClose={closeAutoModal} title="自动身份验证" centered>
                <form onSubmit={handleAutoVerifySubmit}>
                    <Stack>
                        <Text size="sm">请输入您在学校登记的真实姓名，以匹配您的邮箱 `{primaryEmail}`。</Text>
                        <TextInput name="realName" label="真实姓名" withAsterisk />
                        <Button type="submit" mt="md" loading={isSubmitting}>验证</Button>
                    </Stack>
                </form>
            </Modal>

            {/* 手动验证 Modal */}
            <Modal opened={manualModalOpened} onClose={closeManualModal} title="手动批准申请" centered>
                <form ref={manualFormRef} onSubmit={handleManualSubmit}>
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