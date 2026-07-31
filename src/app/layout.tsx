import type { Metadata } from "next";
import { Noto_Serif_TC, Noto_Sans_TC } from "next/font/google";
import "./globals.css";

const notoSerifTC = Noto_Serif_TC({
  subsets: ["latin"],
  weight: ["600", "700", "900"],
  variable: "--font-heading",
});

const notoSansTC = Noto_Sans_TC({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-body",
});

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
    <html lang="zh-TW" className={`h-full ${notoSerifTC.variable} ${notoSansTC.variable}`}>
      <body className="min-h-full flex flex-col bg-background text-white font-body">{children}</body>
    </html>
  );
}
