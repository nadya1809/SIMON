import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import { AppToaster } from "@/components/ui/app-toaster";
import "./globals.css";

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"]
});

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
    <html lang="id">
      <body className={ibmPlexSans.variable}>
        {children}
        <AppToaster />
      </body>
    </html>
  );
}
