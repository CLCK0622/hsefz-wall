// app/admin/users/page.tsx
import {clerkClient} from '@clerk/nextjs/server';
import {Container, Title, Table, Select, Group} from '@mantine/core';
import {updateUserRoleAction} from '@/lib/admin-actions';
import {SubmitButton} from '@/components/SubmitButton/SubmitButton';

export default async function AdminUsersPage() {
    const users = await (await clerkClient()).users.getUserList();

    return (
        <Container py="xl">
            <Title order={2} mb="lg">用户角色管理</Title>
            <Table striped withTableBorder>
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>用户名</Table.Th>
                        <Table.Th>邮箱</Table.Th>
                        <Table.Th>角色</Table.Th>
                        <Table.Th>操作</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {users.data.map(user => {
                        // 修正：使用类型断言
                        const role = (user.publicMetadata as { role?: string }).role || 'User';
                        const isSuperAdmin = role === 'SuperAdmin';

                        return (
                            <Table.Tr key={user.id}>
                                <Table.Td>{user.firstName} {user.lastName}</Table.Td>
                                <Table.Td>{user.emailAddresses[0]?.emailAddress}</Table.Td>
                                <Table.Td>{role}</Table.Td>
                                <Table.Td>
                                    {!isSuperAdmin && (
                                        <form action={updateUserRoleAction}>
                                            <input type="hidden" name="userId" value={user.id}/>
                                            <Group>
                                                <Select
                                                    name="role"
                                                    defaultValue={role}
                                                    data={['User', 'Admin']}
                                                    size="xs"
                                                />
                                                <SubmitButton/>
                                            </Group>
                                        </form>
                                    )}
                                </Table.Td>
                            </Table.Tr>
                        );
                    })}
                </Table.Tbody>
            </Table>
        </Container>
    );
}