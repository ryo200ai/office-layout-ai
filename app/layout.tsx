import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "オフィスレイアウトAI診断 | 不動産仲介担当者向けツール",
  description:
    "物件情報を入力するだけでAIがオフィスレイアウト提案書を自動生成。ログイン不要・完全無料。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  );
}
