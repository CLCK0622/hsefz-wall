// app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs'
import { zhCN } from "@clerk/localizations";

export default function RootLayout({
                                     children,
                                   }: {
  children: React.ReactNode
}) {
  return (
      <ClerkProvider localization={zhCN}>
        <html lang="zh">
        <body>{children}</body>
        </html>
      </ClerkProvider>
  )
}