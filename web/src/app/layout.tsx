import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider"
import { QueryProvider } from "@/components/query-provider";
import { AuthProvider } from "@/lib/auth-context";
import Navigation from "@/components/navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "玩硬劇本館 | 官方網站",
  description: "專業劇本殺體驗館，提供多樣化劇本選擇，營造沉浸式遊戲體驗。立即預約，與朋友一起享受推理樂趣！",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
      <QueryProvider>
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Navigation />
            {children}
          </ThemeProvider>
        </AuthProvider>
      </QueryProvider>
      </body>
    </html>
  );
}
