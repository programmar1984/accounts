import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { getLang } from "@/lib/i18n";
import { themeCookieScript } from "@/lib/theme";
import { getTheme } from "@/lib/theme-server";
import { ThemeProvider } from "@/components/theme/theme-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SHIME — Bookkeeping",
  description: "Simple bookkeeping for small businesses in Japan",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const lang = await getLang();
  const theme = await getTheme();
  return (
    <html
      lang={lang}
      data-theme={theme}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <Script id="shime-theme-init" strategy="beforeInteractive">
          {themeCookieScript()}
        </Script>
      </head>
      <body className="app-shell">
        <ThemeProvider initialTheme={theme}>{children}</ThemeProvider>
      </body>
    </html>
  );
}
