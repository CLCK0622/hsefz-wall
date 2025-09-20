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
import "./main.scss";
import {FeedbackWidget} from "@/components/FeedbackWidget/FeedbackWidget";

export const metadata = {
    title: '张江多功能墙',
    description: '瀚海星云，分享此刻',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <ClerkProvider localization={zhCN}>
            <html lang="zh">
            <head><ColorSchemeScript /><script async src="https://tally.so/widgets/embed.js"></script></head>
            <body>
            <MantineProvider defaultColorScheme="light">
                {/* 👇 Wrap with ModalsProvider */}
                <ModalsProvider>
                    <Notifications />
                    <Header />
                    <div className="main-content">
                        {children}
                    </div>
                    <Footer />
                    <FeedbackWidget />
                </ModalsProvider>
            </MantineProvider>
            </body>
            </html>
        </ClerkProvider>
    )
}