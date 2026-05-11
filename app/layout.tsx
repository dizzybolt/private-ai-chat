import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Private AI Chat",
  description: "Private character AI chat service",

  applicationName: "YATA AI Chat",

  appleWebApp: {
    capable: true,
    title: "YATA AI Chat",
  },

  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}