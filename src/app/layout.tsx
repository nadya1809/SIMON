import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SIMON PST",
  description: "Sistem Monitoring Kinerja Petugas PST"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
