// components/Header/Header.tsx
'use client';

import { Menu, Group, Avatar, Text, rem, Skeleton } from '@mantine/core';
import { useUser, useClerk } from '@clerk/nextjs';
import Link from 'next/link';
import { IconReport, IconUserCheck, IconUsers, IconSettings, IconLogout } from '@tabler/icons-react';
import styles from './Header.module.scss';

export default function Header() {
    const { isLoaded, isSignedIn, user } = useUser();
    const { signOut } = useClerk();

    const userRole = user?.publicMetadata?.role as string | undefined;
    const isAdmin = userRole === 'Admin' || userRole === 'SuperAdmin';
    const isSuperAdmin = userRole === 'SuperAdmin';

    if (!isLoaded) {
        // ... Skeleton code is the same
    }

    if (!isSignedIn) {
        return null;
    }

    return (
        <header className={styles.header}>
            <div className={styles.container}>
                <Link href="/" className={styles.logo}>HSEFZ 校园墙</Link>
                <Group>
                    <Menu shadow="md" width={220} withArrow position="bottom-end">
                        <Menu.Target>
                            <Avatar src={user.imageUrl} radius="xl" style={{ cursor: 'pointer' }} />
                        </Menu.Target>

                        <Menu.Dropdown>
                            <Menu.Label>
                                <Text size="sm" fw={500}>{user.fullName || user.primaryEmailAddress?.emailAddress}</Text>
                                <Text size="xs" c="dimmed">{userRole || 'User'}</Text>
                            </Menu.Label>
                            <Menu.Item
                                component={Link}
                                href="/user"
                                leftSection={<IconSettings style={{ width: rem(14), height: rem(14) }} />}
                            >
                                管理账户
                            </Menu.Item>

                            {isAdmin && (
                                <>
                                    <Menu.Divider />
                                    <Menu.Label>管理面板</Menu.Label>
                                    <Menu.Item
                                        component={Link}
                                        href="/admin/reports"
                                        leftSection={<IconReport style={{ width: rem(14), height: rem(14) }} />}
                                    >
                                        处理举报
                                    </Menu.Item>
                                    <Menu.Item
                                        component={Link}
                                        href="/admin/verifications"
                                        leftSection={<IconUserCheck style={{ width: rem(14), height: rem(14) }} />}
                                    >
                                        审核新用户
                                    </Menu.Item>
                                </>
                            )}

                            {isSuperAdmin && (
                                <Menu.Item
                                    component={Link}
                                    href="/admin/users"
                                    leftSection={<IconUsers style={{ width: rem(14), height: rem(14) }} />}
                                >
                                    设置管理员
                                </Menu.Item>
                            )}

                            <Menu.Divider />
                            <Menu.Item
                                color="red"
                                leftSection={<IconLogout style={{ width: rem(14), height: rem(14) }} />}
                                onClick={() => signOut({ redirectUrl: '/' })}
                            >
                                退出登录
                            </Menu.Item>
                        </Menu.Dropdown>
                    </Menu>
                </Group>
            </div>
        </header>
    );
}