'use client';

import { useCallback, useEffect, useState } from 'react'
//import Image from "next/image";
import GcCard from "./components/GcCard";
import useOverlay from "./tools/overlay";
import { GrandCompany, Frontline } from './types'
import { ChangeZoneData, LoglineData } from './types/overlay';

const gcFp : Record<GrandCompany, number> = {
  [GrandCompany.maelstrom]: 0,
  [GrandCompany.twinadder]: 0,
  [GrandCompany.immoflame]: 0,
}

export default function Home() {
  const { initialize, addOverlayListener, removeOverlayListener, startOverlayEvents } = useOverlay()

  const [onConflict, setOnConflict] = useState<boolean>(false)
  const [frontline, setFrontline] = useState<Frontline | "">('')
  const [gc, setGc] = useState<GrandCompany | "">('')

  const zoneChangeCallback = (data: ChangeZoneData) => {
    // console.log('Zone changed:', JSON.stringify(data))
    if (data.zoneID === 554) {
      setOnConflict(true); setFrontline(Frontline.shatter)
    } else {
      setOnConflict(false); setFrontline('')
      gcFp.maelstrom = 0; gcFp.twinadder = 0; gcFp.immoflame = 0
    }
  }
  const loglineCallback = useCallback((data: LoglineData) => {
    const msgType = data.line[0] // "00"
    const msgChannel = data.line[2] // "0839"
    const msg = data.line[4] // "冰封的石文A1启动了，冰块变得脆弱了！"

    if (msgType !== '00' || msgChannel !== '0839') return
    //if (!onConflict) return

    const matchGc = msg.match(/以(黑涡团|双蛇党|恒辉队)的身份参加了纷争前线！/)
    if (matchGc && matchGc[1]) {
      if (matchGc[1] === '黑涡团') setGc(GrandCompany.maelstrom)
      else if (matchGc[1] === '双蛇党') setGc(GrandCompany.twinadder)
      else if (matchGc[1] === '恒辉队') setGc(GrandCompany.immoflame)
      return
    }

    if (frontline === Frontline.shatter) {
      const getFp = (ptLv: string) => {
        if (ptLv === 'A') return 200
        else if (ptLv === 'B') return 50
        throw new Error('[gcFp] wtf point is? ' + ptLv)
      }
      const judgeBelong = (pt: string) => {
        const immoflame = ['A4', 'B3', 'B4', 'B5', 'B6']
        const twinadder = ['A3', 'B7', 'B8', 'B9', 'B10']
        const maelstrom = ['A2', 'B1', 'B2', 'B11', 'B12']

        if (immoflame.includes(pt)) return GrandCompany.immoflame
        if (twinadder.includes(pt)) return GrandCompany.twinadder
        if (maelstrom.includes(pt)) return GrandCompany.maelstrom
        throw new Error('[judgeBelong] wtf point is? ' + pt)
      }

      const matchPtActive = msg.match(/冰封的石文(A|B)(\d{1,2})启动了，冰块变得脆弱了！/)
      if (matchPtActive && matchPtActive[1] && matchPtActive[2]) {
        const fp = getFp(matchPtActive[1])
        const pt = matchPtActive[1] + matchPtActive[2]
        const _gc = judgeBelong(pt)
        gcFp[_gc] += fp
      }

      const matchPtDestroy = msg.match(/冰封的石文(A|B)(\d{1,2})被破坏了！/)
      if (matchPtDestroy && matchPtDestroy[1] && matchPtDestroy[2]) {
        const fp = getFp(matchPtDestroy[1])
        const pt = matchPtDestroy[1] + matchPtDestroy[2]
        const _gc = judgeBelong(pt)
        gcFp[_gc] -= fp
      }
    }
    else if (frontline === Frontline.naadam) {
      const getFp = (ptLv: string) => {
        if (ptLv === 'S') return 200
        else if (ptLv === 'A') return 100
        else if (ptLv === 'B') return 50
        throw new Error('[gcFp] wtf point is? ' + ptLv)
      }

    }

    if (
      data.rawLine.includes('参加了纷争前线')
      || data.rawLine.includes('无垢的大地')
      || data.rawLine.includes('获得了50个亚拉戈诗学神典石。')
    ) console.log(JSON.stringify(data))
    // setLogs(val => val + '\r\n' + data.rawLine)
  }, [frontline])

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
  }, [
    loglineCallback,
    initialize, addOverlayListener, removeOverlayListener, startOverlayEvents
  ])

  return (
    <div className="font-sans w-full flex flex-col items-center justify-items-center min-h-screen p-8 pb-20 gap-16">
      <main className="w-full flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <div className="w-full grid grid-cols-3 gap-2">
          <GcCard gc={GrandCompany.maelstrom} me={gc === GrandCompany.maelstrom} floatPoints={gcFp.maelstrom} />
          <GcCard gc={GrandCompany.twinadder} me={gc === GrandCompany.twinadder} floatPoints={gcFp.twinadder} />
          <GcCard gc={GrandCompany.immoflame} me={gc === GrandCompany.immoflame} floatPoints={gcFp.immoflame} />
        </div>
      </main>
    </div>
  );
}
