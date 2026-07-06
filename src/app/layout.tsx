import type { Metadata } from "next";
import Script from "next/script";
import { IBM_Plex_Sans } from "next/font/google";
import { ThemeProvider } from "@/components/theme/theme-provider";
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
    <html lang="id" suppressHydrationWarning>
      <body className={ibmPlexSans.variable}>
        <Script id="theme-init" strategy="beforeInteractive">
          {`
            (function () {
              try {
                var savedTheme = localStorage.getItem("simon-theme");
                var systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
                var resolvedTheme = savedTheme === "dark" || savedTheme === "light" ? savedTheme : systemTheme;
                document.documentElement.dataset.theme = resolvedTheme;
                document.documentElement.style.colorScheme = resolvedTheme;
              } catch (error) {}
            })();
          `}
        </Script>
        <ThemeProvider>
          {children}
          <AppToaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
