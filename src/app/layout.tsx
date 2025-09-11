'use client';
import 'tdesign-react/dist/tdesign.css';
import "tdesign-react/lib/_util/react-19-adapter";

import { useEffect, useState } from 'react';
import { Geist, Geist_Mono } from "next/font/google"
import './globals.css'
import { loadConfig } from './tools/config';
import { AppConfig, fixAppConfig } from './types/config';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [appConfig, setAppConfig] = useState<AppConfig>(fixAppConfig())

  useEffect(() => {
    const config = loadConfig()
    setAppConfig(config)

    const handler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      if (event.data.type === "config:update") {
        console.log('update config')
        setAppConfig(loadConfig())
      }
    }
    window.addEventListener('message', handler)
    return () => {
      window.removeEventListener('message', handler)
    }
  }, [])
  
  return (
    <html
      lang="zh-CN"
      style={{
        height: "100%",
        userSelect: "none",
        fontSize: appConfig.app_scale + 'em'
      }}
    >
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased h-full`}>
        {children}
      </body>
    </html>
  );
}
