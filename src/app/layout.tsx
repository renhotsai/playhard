import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PlayHard 劇本殺",
  description: "預約最優質的劇本殺體驗",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" className="h-full">
      <body className="min-h-full flex flex-col bg-gray-50">{children}</body>
    </html>
  );
}
