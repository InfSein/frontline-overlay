import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import './globals.css'
import { ToastProvider } from "./components/ToastContext"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Frontline overlay",
  description: "ACT Overlay for FFXIV PvP Frontline",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" style={{ height: "100%", userSelect: "none" }}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased h-full`}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
