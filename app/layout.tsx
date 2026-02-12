import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aesthetic English — Beauty and Brains",
  description: "基于视频切片的影子跟读法，在沉浸式艺术画廊氛围中习得英语。Curated by Scarlett Zhang.",
  keywords: ["English learning", "shadowing", "aesthetic", "语言学习", "影子跟读"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#F2EFE5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="safe-top">
        {children}
      </body>
    </html>
  );
}
