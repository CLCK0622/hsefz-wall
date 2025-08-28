// app/admin/users/page.tsx
import { clerkClient } from '@clerk/nextjs/server';
import {
    Container,
    Title,
    Table,
    Select,
    Group,
    Accordion,
    Text,
    Button,
    Image,
    TableThead,
    TableTh, TableTbody,
    TableTr, TableTd, Stack
} from '@mantine/core';
import { updateUserRoleAction, approveVerificationAction } from '@/lib/admin-actions'; // 导入新 action
import { SubmitButton } from '@/components/SubmitButton/SubmitButton';
import { db } from '@/lib/db'; // 导入 db

export default async function AdminUsersPage() {
    const client = await clerkClient();
    const { data: users } = await client.users.getUserList({ limit: 100 });

    // 新增：从我们的数据库获取待处理的请求
    const pendingVerifications = await db.selectFrom('manual_verifications')
        .selectAll()
        .where('status', '=', 'pending')
        .execute();

    return (
        <Container py="xl">
            <Title order={2} mb="lg">用户管理</Title>

            {/* 新增：待处理请求区域 */}
            {pendingVerifications.length > 0 && (
                <>
                    <Title order={3} mb="sm">待处理的认证申请 ({pendingVerifications.length})</Title>
                    <Accordion variant="separated" mb="xl">
                        {pendingVerifications.map(req => (
                            <Accordion.Item key={req.id} value={String(req.id)}>
                                <Accordion.Control>
                                    <Text>申请用户ID: {req.clerk_user_id}</Text>
                                </Accordion.Control>
                                <Accordion.Panel>
                                    <Stack>
                                        <Text><strong>提交信息:</strong> {req.details_text}</Text>
                                        <Text><strong>申请邮箱:</strong> {req.requested_email}</Text>
                                        <Text><strong>学生卡:</strong></Text>
                                        <Image src={req.image_url} maw={240} radius="sm" alt="学生卡" />
                                        <form action={approveVerificationAction}>
                                            <input type="hidden" name="verificationId" value={req.id} />
                                            <input type="hidden" name="clerkId" value={req.clerk_user_id!} />
                                            <Button type="submit" color="green" size="xs">批准</Button>
                                        </form>
                                    </Stack>
                                </Accordion.Panel>
                            </Accordion.Item>
                        ))}
                    </Accordion>
                </>
            )}

            {/* Use the standalone components instead of the Component.SubComponent syntax */}
            <Table striped withTableBorder verticalSpacing="sm">
                <TableThead>
                    <TableTr>
                        <TableTh>用户名</TableTh>
                        <TableTh>邮箱</TableTh>
                        <TableTh>角色</TableTh>
                        <TableTh>操作</TableTh>
                    </TableTr>
                </TableThead>
                <TableTbody>
                    {users.map(user => {
                        const role = (user.publicMetadata as { role?: string }).role || 'User';
                        const isSuperAdmin = role === 'SuperAdmin';
                        console.log(isSuperAdmin);

                        return (
                            <TableTr key={user.id}>
                                <TableTd>{user.firstName} {user.lastName || user.username}</TableTd>
                                <TableTd>{user.emailAddresses[0]?.emailAddress}</TableTd>
                                <TableTd>{role}</TableTd>
                                <TableTd>
                                    {!isSuperAdmin && (
                                        <form action={updateUserRoleAction}>
                                            <input type="hidden" name="userId" value={user.id} />
                                            <Group gap="xs" wrap="nowrap">
                                                <Select
                                                    name="role"
                                                    defaultValue={role}
                                                    data={['User', 'Admin']}
                                                    size="xs"
                                                    style={{ flex: 1 }}
                                                />
                                                <SubmitButton />
                                            </Group>
                                        </form>
                                    )}
                                </TableTd>
                            </TableTr>
                        );
                    })}
                </TableTbody>
            </Table>
        </Container>
    );
}