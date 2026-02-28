import type { Metadata, Viewport } from "next";
import "./globals.css";
import { MembershipProvider } from "@/context/MembershipContext";

// 仅在开发环境动态导入
const DevPanel = process.env.NODE_ENV === 'development' 
  ? require("@/components/DevPanel").default 
  : () => null;

export const metadata: Metadata = {
  title: "Aesthetic English — Beauty and Brains",
  description: "基于视频切片的影子跟读法，在沉浸式艺术画廊氛围中习得英语。Curated by Scarlett Zhang.",
  keywords: ["English learning", "shadowing", "aesthetic", "语言学习", "影子跟读"],
  icons: {
    icon: '/favicon.ico',
  },
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
    <html lang="en" suppressHydrationWarning>
      <body className="safe-top" suppressHydrationWarning>
        <MembershipProvider>
          {children}
          <DevPanel />
        </MembershipProvider>
      </body>
    </html>
  );
}
