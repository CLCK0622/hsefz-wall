// app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs'
import { zhCN } from "@clerk/localizations";
import {MantineProvider, ColorSchemeScript, Combobox} from '@mantine/core';
import '@mantine/core/styles.css'; // 必须引入 Mantine CSS
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import '@mantine/notifications/styles.css';
import Header from "@/components/Header/Header";
import {Footer} from "@/components/Footer/Footer";

export const metadata = {
    title: '张江多功能墙',
    description: '瀚海星云，分享此刻',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <ClerkProvider localization={zhCN}>
            <html lang="zh">
            <head><ColorSchemeScript /></head>
            <body>
            <MantineProvider defaultColorScheme="light">
                {/* 👇 Wrap with ModalsProvider */}
                <ModalsProvider>
                    <Notifications />
                    <Header />
                    {children}
                    <Footer />
                </ModalsProvider>
            </MantineProvider>
            </body>
            </html>
        </ClerkProvider>
    )
}