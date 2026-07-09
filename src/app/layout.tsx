

import type { Metadata } from "next";
import { IBM_Plex_Sans, Geist } from "next/font/google";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { AppToaster } from "@/components/ui/app-toaster";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "SIMON PST | BPS Provinsi Sumatera Barat",
  description:
    "Sistem Monitoring Kinerja Petugas PST Badan Pusat Statistik Provinsi Sumatera Barat"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <body className={geist.variable}>
        <ThemeProvider>
          {children}
          <AppToaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
