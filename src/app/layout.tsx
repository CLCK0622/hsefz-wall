// app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs'
import { zhCN } from "@clerk/localizations";
import { MantineProvider, ColorSchemeScript } from '@mantine/core';
import '@mantine/core/styles.css'; // 必须引入 Mantine CSS
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import Header from "@/components/Header/Header";

export const metadata = {
    title: 'HSEFZ 校园墙',
    description: '瀚海星云，分享此刻',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <ClerkProvider localization={zhCN}>
            <html lang="zh">
            <head><ColorSchemeScript /></head>
            <body>
            <MantineProvider defaultColorScheme="auto">
                {/* 👇 Wrap with ModalsProvider */}
                <ModalsProvider>
                    <Notifications />
                    <Header />
                    {children}
                </ModalsProvider>
            </MantineProvider>
            </body>
            </html>
        </ClerkProvider>
    )
}