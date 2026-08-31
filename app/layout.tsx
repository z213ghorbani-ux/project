import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "کلینیک آریتمی قلب",
  description: "سامانه‌ی داخلی جواب‌دهی آنلاین بیماران",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
