// components/FeedbackWidget.tsx
'use client';

import { Affix, ActionIcon, Tooltip, rem } from '@mantine/core';
import { IconMessageCircle } from '@tabler/icons-react';

export function FeedbackWidget() {
    // 1. 将 Tally 提供的所有 data-* 属性组织成一个对象
    //    请确保 data-tally-open 的值 "mKbxqz" 是您自己表单的正确 ID
    const tallyAttributes = {
        'data-tally-open': 'mKbxqz',
        'data-tally-width': '360',
        'data-tally-hide-title': '1',
        'data-tally-auto-close': '1000',
    };

    return (
        // 2. 使用 Mantine 的 <Affix> 组件让按钮悬浮在右下角
        <Affix position={{ bottom: rem(20), right: rem(20) }}>
            {/* 3. 使用 Tooltip 增加用户体验 */}
            <Tooltip label="反馈与建议" position="left" withArrow>
                {/* 4. 使用 ActionIcon 创建圆形图标按钮，并附加 Tally 属性 */}
                <ActionIcon
                    size="xl"
                    radius="xl"
                    variant="filled"
                    color="blue"
                    {...tallyAttributes}
                >
                    <IconMessageCircle style={{ width: '60%', height: '60%' }} />
                </ActionIcon>
            </Tooltip>
        </Affix>
    );
}