// components/Footer/Footer.tsx
import { Container, Text, Group } from '@mantine/core';
import styles from './Footer.module.scss';

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className={styles.footer}>
            <Container className={styles.inner}>
                <Text c="dimmed" size="sm">
                    © {currentYear} 张江多功能墙. All rights reserved.
                </Text>
                <Group gap="xs" justify="flex-end" wrap="nowrap">
                    {/* 这里未来可以放置一些其他的链接，比如“关于我们”、“服务条款”等 */}
                    {/* <Anchor c="dimmed" size="sm">Privacy</Anchor> */}
                    {/* <Anchor c="dimmed" size="sm">Contact</Anchor> */}
                </Group>
            </Container>
        </footer>
    );
}