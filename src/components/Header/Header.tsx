// components/Header/Header.tsx
'use client';

import {Menu, Group, Avatar, Text, rem, Skeleton, Indicator, Box, TextInput, ActionIcon} from '@mantine/core';
import {useUser, useClerk} from '@clerk/nextjs';
import Link from 'next/link';
import {IconReport, IconUserCheck, IconUsers, IconSettings, IconLogout, IconSearch, IconX} from '@tabler/icons-react';
import styles from './Header.module.scss';
import {useEffect, useState} from "react";
import {getPendingVerificationCountAction} from "@/lib/admin-actions";
import {useRouter, useSearchParams} from "next/navigation";
import {usePostStore} from "@/lib/store";

export default function Header() {
    const {isLoaded, isSignedIn, user} = useUser();
    const {signOut} = useClerk();
    const [pendingCount, setPendingCount] = useState(0);
    const { setIsSearching } = usePostStore();

    const [searchTerm, setSearchTerm] = useState(''); // 搜索框的本地状态
    const router = useRouter();
    const searchParams = useSearchParams();

    const userRole = user?.publicMetadata?.role as string | undefined;
    const isAdmin = userRole === 'Admin' || userRole === 'SuperAdmin';
    const isSuperAdmin = userRole === 'SuperAdmin';

    useEffect(() => {
        if (isAdmin) {
            getPendingVerificationCountAction().then(setPendingCount);
        }
    }, [isAdmin]); // 当 isAdmin 状态明确后执行


    // 初始化搜索框的值为 URL 中的 'q' 参数
    useEffect(() => {
        const q = searchParams.get('q');
        if (q) {
            setSearchTerm(q);
        }
    }, [searchParams]);

    const displayName = user ?
        (user.lastName || user.firstName ? `${user.lastName || ''}${user.firstName || ''}`.trim() : user.primaryEmailAddress?.emailAddress)
        : '';

    if (!isLoaded) {
        // ... Skeleton code is the same
    }

    if (!isSignedIn) {
        return null;
    }

    const handleSearch = (e?: React.FormEvent) => {
        e?.preventDefault(); // 阻止表单默认提交行为
        setIsSearching(true);
        if (searchTerm.trim()) {
            // 导航到主页，并添加 q 参数
            router.push(`/?q=${encodeURIComponent(searchTerm.trim())}`);
        } else {
            // 如果搜索框为空，导航回主页，并移除 q 参数
            router.push('/');
        }
    };

    const handleClearSearch = () => {
        setSearchTerm('');
        setIsSearching(true);
        router.push('/'); // 清除搜索，导航回主页
    };

    return (
        <header className={styles.header}>
            <div className={styles.container}>
                <Link href="/" className={styles.logo}>张江多功能墙</Link>

                <Box style={{ flexGrow: 1, maxWidth: '500px', margin: '0 20px' }}>
                    <form onSubmit={handleSearch}>
                        <TextInput
                            placeholder="搜索帖子..."
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.currentTarget.value)}
                            leftSection={<IconSearch size="1rem" stroke={1.5} />}
                            rightSection={
                                searchTerm ? (
                                    <ActionIcon size="sm" variant="subtle" color="gray" onClick={handleClearSearch}>
                                        <IconX size="1rem" stroke={1.5} />
                                    </ActionIcon>
                                ) : null
                            }
                            rightSectionWidth={40}
                        />
                    </form>
                </Box>

                <Group>
                    <Menu shadow="md" width={220} withArrow position="bottom-end">
                        <Menu.Target>
                            <Avatar src={user.imageUrl} radius="xl" style={{cursor: 'pointer'}}/>
                        </Menu.Target>

                        <Menu.Dropdown>
                            <Menu.Label>
                                <Text size="sm" fw={500}>{displayName || user.primaryEmailAddress?.emailAddress}</Text>
                                <Text size="xs" c="dimmed">{userRole || 'User'}</Text>
                            </Menu.Label>
                            <Menu.Item
                                component={Link}
                                href="/user"
                                leftSection={<IconSettings style={{width: rem(14), height: rem(14)}}/>}
                            >
                                管理账户
                            </Menu.Item>

                            {isAdmin && (
                                <>
                                    <Menu.Divider/>
                                    <Menu.Label>管理面板</Menu.Label>
                                    <Menu.Item
                                        component={Link}
                                        href="/admin/reports"
                                        leftSection={<IconReport style={{width: rem(14), height: rem(14)}}/>}
                                    >
                                        处理举报
                                    </Menu.Item>
                                    <Menu.Item
                                        component={Link}
                                        href="/admin/verifications"
                                        leftSection={<Indicator inline size={8} color="red"
                                                                disabled={pendingCount === 0}><IconUserCheck
                                            style={{width: rem(14), height: rem(14)}}/></Indicator>}
                                    >
                                        审核新用户
                                    </Menu.Item>
                                </>
                            )}

                            {isSuperAdmin && (
                                <Menu.Item
                                    component={Link}
                                    href="/admin/users"
                                    leftSection={<IconUsers style={{width: rem(14), height: rem(14)}}/>}
                                >
                                    设置管理员
                                </Menu.Item>
                            )}

                            <Menu.Divider/>
                            <Menu.Item
                                color="red"
                                leftSection={<IconLogout style={{width: rem(14), height: rem(14)}}/>}
                                onClick={() => signOut({redirectUrl: '/'})}
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