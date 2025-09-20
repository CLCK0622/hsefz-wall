// app/verify/page.tsx
'use client';
import { Container, Title, Text, Button, Modal, TextInput, FileInput, Stack, Alert, Center, Loader, Paper, Group } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { getUserVerificationStatusAction } from '@/lib/verification-actions';
import { notifications } from '@mantine/notifications';
import { IconInfoCircle } from '@tabler/icons-react';
import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import { autoVerifyAction, submitVerificationRequestAction } from '@/lib/verification-actions';

// 自动验证的提交按钮，自带加载状态
function AutoVerifySubmitButton() {
    const { pending } = useFormStatus();
    return <Button type="submit" mt="md" loading={pending}>验证</Button>;
}

// 手动验证的提交按钮，自带加载状态
function ManualVerifySubmitButton() {
    const { pending } = useFormStatus();
    return <Button type="submit" mt="md" loading={pending}>提交申请</Button>;
}

export default function VerifyPage() {
    const [manualModalOpened, { open: openManualModal, close: closeManualModal }] = useDisclosure(false);
    const [autoModalOpened, { open: openAutoModal, close: closeAutoModal }] = useDisclosure(false);
    const [verificationStatus, setVerificationStatus] = useState<'loading' | 'pending' | 'rejected' | null>('loading');
    const { user } = useUser();

    // 为两个 Action 分别设置 useFormState
    const [autoVerifyState, autoVerifyFormAction] = useFormState(autoVerifyAction, { success: false, message: '' });
    const [manualVerifyState, manualVerifyFormAction] = useFormState(submitVerificationRequestAction, { success: false, message: '' });

    // 处理成功后的逻辑
    useEffect(() => {
        if (autoVerifyState.success) {
            notifications.show({ color: 'green', title: '成功', message: '验证成功！即将跳转到主页...' });
            window.location.href = '/';
        }
    }, [autoVerifyState]);

    useEffect(() => {
        if (manualVerifyState.success) {
            notifications.show({ color: 'green', title: '成功', message: manualVerifyState.message });
            setVerificationStatus('pending');
            closeManualModal();
        }
    }, [manualVerifyState]);

    useEffect(() => {
        getUserVerificationStatusAction().then(status => {
            setVerificationStatus(status as any);
        });
    }, []);

    const primaryEmail = user?.primaryEmailAddress?.emailAddress;
    const isHsefzEmail = !!primaryEmail?.endsWith('@hsefz.cn');

    if (verificationStatus === 'loading') { return <Center h="100vh"><Loader /></Center>; }

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
                {/* --- 核心修改在这里 --- */}
                {/* 1. 移除了外层的条件渲染，让这个卡片始终可见 */}
                <Paper withBorder shadow="md" p="lg" radius="md">
                    <Text fw={500}>自动验证 (推荐)</Text>
                    <Text size="sm" c="dimmed" mt="xs">
                        请确保您的 <Text component={Link} href="/user" variant="link">主邮箱</Text> 是 `@hsefz.cn` 后缀，然后输入真实姓名以完成即时认证。
                    </Text>

                    {/* 2. 新增一个提示，当邮箱不符合时显示 */}
                    {!isHsefzEmail && (
                        <Text size="xs" c="red" mt="sm">
                            您当前的主邮箱 ({primaryEmail}) 不符合要求，请先去“管理账户”页面添加、验证 hsefz.cn 邮箱并设置为主要邮箱。
                        </Text>
                    )}

                    {/* 3. 根据 isHsefzEmail 的值来禁用按钮 */}
                    <Button onClick={openAutoModal} mt="md" disabled={!isHsefzEmail}>
                        开始自动验证
                    </Button>
                </Paper>

                <Paper withBorder shadow="md" p="lg" radius="md">
                    <Text fw={500}>申请手动批准</Text>
                    <Text size="sm" c="dimmed" mt="xs">
                        如果自动验证失败，或您无法使用校内邮箱，可以提交资料申请管理员手动批准。
                    </Text>
                    <Button onClick={openManualModal} mt="md" variant="default">申请手动批准</Button>
                </Paper>
            </Stack>

            {/* 自动验证 Modal */}
            <Modal opened={autoModalOpened} onClose={closeAutoModal} title="自动身份验证" centered zIndex={3000}>
                <form action={autoVerifyFormAction}>
                    <Stack>
                        <Text size="sm">请输入您在学校登记的真实姓名，以匹配您的邮箱 `{primaryEmail}`。</Text>
                        <TextInput name="realName" label="真实姓名" withAsterisk />

                        {/* 6. 在表单中显示 Server Action 返回的错误信息 */}
                        {autoVerifyState.message && !autoVerifyState.success && (
                            <Text c="red" size="sm" mt="xs">{autoVerifyState.message}</Text>
                        )}

                        <AutoVerifySubmitButton />
                    </Stack>
                </form>
            </Modal>

            {/* 手动验证 Modal */}
            <Modal opened={manualModalOpened} onClose={closeManualModal} title="手动批准申请" centered>
                {/* 将 form 的 action 指向 manualVerifyFormAction */}
                <form action={manualVerifyFormAction}>
                    <Stack>
                        <TextInput name="realName" label="真实姓名" withAsterisk />
                        <TextInput name="classNumber" label="四位数字班级 (如 2501)" withAsterisk />
                        <TextInput name="email" label="hsefz.cn 邮箱" withAsterisk />
                        <FileInput name="studentCardFile" label="学生卡照片" placeholder="点击上传" withAsterisk accept="image/*" />

                        {manualVerifyState.message && !manualVerifyState.success && (
                            <Text c="red" size="sm" mt="xs">{manualVerifyState.message}</Text>
                        )}
                        <ManualVerifySubmitButton />
                    </Stack>
                </form>
            </Modal>
        </Container>
    );
}