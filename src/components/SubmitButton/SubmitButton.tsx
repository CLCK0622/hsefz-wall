// components/SubmitButton.tsx
'use client';

import { Button } from '@mantine/core';
import { useFormStatus } from 'react-dom';

export function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <Button type="submit" size="xs" loading={pending}>
            保存
        </Button>
    );
}