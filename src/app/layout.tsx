import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kas Keluarga",
  description: "Aplikasi manajemen kas keluarga, kantor, dan sekolah",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0", // Mencegah zoom di mobile
};

import BottomNav from "@/components/BottomNav";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${inter.className} bg-slate-100`}>
        <div className="mobile-container pb-24">
          {children}
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
