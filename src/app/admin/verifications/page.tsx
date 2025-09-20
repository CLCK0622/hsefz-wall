import { db } from '@/lib/db';
import { Container, Title, Accordion, Text, Center } from '@mantine/core';
import Header from '@/components/Header/Header';
// 1. Import the new client component
import { VerificationRequestItem } from '@/components/VerificationRequestForm/VerificationRequestForm';

// This is now purely a Server Component
export default async function VerificationsPage() {

    const pendingVerifications = await db.selectFrom('manual_verifications')
        .selectAll()
        .where('status', '=', 'pending')
        .orderBy('created_at', 'asc')
        .execute();

    console.log('[Admin Verifications Page] Fetched pending requests:', pendingVerifications);

    return (
        <>
            <Container py="xl">
                <Title order={2} mb="lg">审核新用户申请</Title>

                {pendingVerifications.length > 0 ? (
                    <Accordion variant="separated">
                        {/* 2. Render the client component in a loop */}
                        {pendingVerifications.map(req => (
                            <VerificationRequestItem key={req.id} request={req} />
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