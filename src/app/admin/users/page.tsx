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
import { db } from '@/lib/db';
import {VerifiedSwitch} from "@/components/VerifiedSwitch/VerifiedSwitch"; // 导入 db

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
            <Title order={2} mb="lg">用户身份管理</Title>

            {/* Use the standalone components instead of the Component.SubComponent syntax */}
            <Table striped withTableBorder verticalSpacing="sm">
                <TableThead>
                    <TableTr>
                        <TableTh>用户名</TableTh>
                        <TableTh>邮箱</TableTh>
                        <TableTh>认证状态</TableTh>
                        <TableTh>角色</TableTh>
                        <TableTh>操作</TableTh>
                    </TableTr>
                </TableThead>
                <TableTbody>
                    {users.map(user => {
                        const role = (user.publicMetadata as { role?: string }).role || 'User';
                        const isVerified = (user.publicMetadata as { verified?: boolean })?.verified || false;
                        const isSuperAdmin = role === 'SuperAdmin';
                        console.log(isSuperAdmin);

                        return (
                            <TableTr key={user.id}>
                                <TableTd>{user.lastName}{user.firstName || user.username}</TableTd>
                                <TableTd>{user.emailAddresses[0]?.emailAddress}</TableTd>
                                <TableTd>
                                    <VerifiedSwitch userId={user.id} isVerified={isVerified} />
                                </TableTd>
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