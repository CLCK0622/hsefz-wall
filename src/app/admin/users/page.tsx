// app/admin/users/page.tsx
import { clerkClient } from '@clerk/nextjs/server';
import {
    Container,
    Title,
    Table,
    TableThead, // <-- Import standalone compound components
    TableTbody,
    TableTr,
    TableTh,
    TableTd,
    Select,
    Group
} from '@mantine/core';
import { updateUserRoleAction } from '@/lib/admin-actions';
import { SubmitButton } from '@/components/SubmitButton/SubmitButton';

export default async function AdminUsersPage() {
    const client = await clerkClient();
    const { data: users } = await client.users.getUserList({ limit: 100 });

    return (
        <Container py="xl">
            <Title order={2} mb="lg">用户角色管理</Title>

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