import type { Metadata, Viewport } from "next";
import "./globals.css";
import DevPanel from "@/components/DevPanel";
import MigrationScript from "@/components/MigrationScript";
import { MembershipProvider } from "@/context/MembershipContext";

export const metadata: Metadata = {
  title: "Aesthetic English — Beauty and Brains",
  description: "基于视频切片的影子跟读法，在沉浸式艺术画廊氛围中习得英语。Curated by Scarlett Zhang.",
  keywords: ["English learning", "shadowing", "aesthetic", "语言学习", "影子跟读"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
        <MembershipProvider>
          <MigrationScript />
          {children}
          <DevPanel />
        </MembershipProvider>
      </body>
    </html>
  );
}
