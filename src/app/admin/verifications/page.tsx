// app/admin/verifications/page.tsx
import { db } from '@/lib/db';
import {
    Container,
    Title,
    Accordion,
    Text,
    Stack,
    Image,
    Button,
    Center,
    AccordionItem,
    AccordionControl,
    AccordionPanel, Group
} from '@mantine/core';
import {approveVerificationAction, rejectVerificationAction} from '@/lib/admin-actions';
import Header from '@/components/Header/Header';

// 这是一个服务器组件，直接从数据库获取数据
export default async function VerificationsPage() {

    // 从数据库获取所有待处理的请求
    const pendingVerifications = await db.selectFrom('manual_verifications')
        .selectAll()
        .where('status', '=', 'pending')
        .orderBy('created_at', 'asc')
        .execute();

    return (
        <>
            <Container py="xl">
                <Title order={2} mb="lg">审核新用户申请</Title>

                {pendingVerifications.length > 0 ? (
                    <Accordion variant="separated">
                        {pendingVerifications.map(req => (
                            <AccordionItem key={req.id} value={String(req.id)}>
                                <AccordionControl>
                                    <Text>
                                        申请用户 Clerk ID: <Text span c="blue" inherit>{req.clerk_user_id}</Text>
                                    </Text>
                                </AccordionControl>
                                <AccordionPanel>
                                    <Stack>
                                        <Text><strong>提交信息:</strong> {req.details_text}</Text>
                                        <Text><strong>申请邮箱:</strong> {req.requested_email}</Text>
                                        <Text><strong>学生卡照片:</strong></Text>
                                        <Image
                                            src={req.image_url}
                                            maw={240}
                                            radius="sm"
                                            alt="学生卡照片"
                                        />
                                        <form action={approveVerificationAction}>
                                            <input type="hidden" name="verificationId" value={req.id} />
                                            <input type="hidden" name="clerkId" value={req.clerk_user_id!} />
                                            <Group mt="md">
                                                <form>
                                                    <input type="hidden" name="verificationId" value={req.id} />
                                                    <input type="hidden" name="clerkId" value={req.clerk_user_id!} />
                                                    <Group mt="md">
                                                        <Button
                                                            type="submit"
                                                            color="green"
                                                            size="xs"
                                                            formAction={approveVerificationAction}
                                                        >
                                                            批准认证
                                                        </Button>

                                                        <Button
                                                            type="submit"
                                                            color="red"
                                                            size="xs"
                                                            formAction={rejectVerificationAction}
                                                        >
                                                            拒绝
                                                        </Button>
                                                    </Group>
                                                </form>
                                            </Group>
                                        </form>
                                    </Stack>
                                </AccordionPanel>
                            </AccordionItem>
                        ))}
                    </Accordion>
                ) : (
                    <Center mt="xl">
                        <Text c="dimmed">太棒了，当前没有待处理的认证申请！</Text>
                    </Center>
                )}
            </Container>
        </>
    );
}