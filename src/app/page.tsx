'use client';

import { useEffect, useState } from 'react'
import Image from "next/image";
import GcCard from "./components/GcCard";
import useOverlay from "./tools/overlay";
import { ChangeZoneData, LoglineData } from './types/overlay';

export default function Home() {
  const { initialize, addOverlayListener, removeOverlayListener, startOverlayEvents } = useOverlay()

  const [logs, setLogs] = useState('')

  const zoneChangeCallback = (data: ChangeZoneData) => {
    // console.log('Zone changed:', JSON.stringify(data))
    // 554：碎冰
  }
  const loglineCallback = (data: LoglineData) => {
    if (
      data.rawLine.includes('参加了纷争前线')
      || data.rawLine.includes('启动了，冰块变得脆弱了')
      || data.rawLine.includes('被破坏了！')
      || data.rawLine.includes('黑涡团')
      || data.rawLine.includes('获得了50个亚拉戈诗学神典石。')
    ) console.log(JSON.stringify(data))
    // setLogs(val => val + '\r\n' + data.rawLine)
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    initialize(window)

    addOverlayListener('ChangeZone', zoneChangeCallback)
    addOverlayListener('LogLine', loglineCallback)

    startOverlayEvents()

    return () => {
      removeOverlayListener('ChangeZone', zoneChangeCallback)
      removeOverlayListener('LogLine', loglineCallback)
    }
  }, [initialize, addOverlayListener, removeOverlayListener, startOverlayEvents])

  const downloadLogs = () => {
    console.log(logs)
    const blob = new Blob([logs], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'logs.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <ol className="font-mono list-inside list-decimal text-sm/6 text-center sm:text-left">
          <li className="mb-2 tracking-[-.01em]">
            Get started by editing{" "}
            <code className="bg-black/[.05] dark:bg-white/[.06] font-mono font-semibold px-1 py-0.5 rounded">
              src/app/page.tsx
            </code>
            .
          </li>
          <li className="tracking-[-.01em]">
            Save and see your changes instantly. 2
          </li>
        </ol>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <button
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
            onClick={downloadLogs}
          >
            下载日志
          </button>
        </div>
      </main>
    </div>
  );
}
