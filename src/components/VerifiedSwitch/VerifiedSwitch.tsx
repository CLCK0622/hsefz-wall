// components/VerifiedSwitch.tsx
'use client';

import { Switch, Group } from '@mantine/core';
import { useState } from 'react';
import { updateUserVerifiedStatusAction } from '@/lib/admin-actions';
import { notifications } from '@mantine/notifications';

interface VerifiedSwitchProps {
    userId: string;
    isVerified: boolean;
}

export function VerifiedSwitch({ userId, isVerified }: VerifiedSwitchProps) {
    // 使用状态来即时反映 UI 变化
    const [checked, setChecked] = useState(isVerified);
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const newCheckedState = event.currentTarget.checked;
        setIsLoading(true);
        setChecked(newCheckedState); // 乐观更新 UI

        try {
            await updateUserVerifiedStatusAction(userId, newCheckedState);
            notifications.show({
                color: 'green',
                title: '成功',
                message: `用户认证状态已更新为: ${newCheckedState ? '已认证' : '未认证'}`,
            });
        } catch (error: any) {
            notifications.show({
                color: 'red',
                title: '操作失败',
                message: error.message,
            });
            setChecked(!newCheckedState); // 如果失败，则回滚 UI 状态
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Group>
            <Switch
                checked={checked}
                onChange={handleChange}
                disabled={isLoading}
                label={checked ? "已认证" : "未认证"}
            />
        </Group>
    );
}