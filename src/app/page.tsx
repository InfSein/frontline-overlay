'use client';

import { useCallback, useEffect, useState } from 'react'
//import Image from "next/image";
import GcCard from "./components/GcCard";
import PointCard from "./components/PointCard";
import PreferenceTab from './components/PreferenceTab';
import useOverlay from "./tools/overlay";
import { GrandCompany, Frontline } from './types'
import { ChangePrimaryPlayerData, ChangeZoneData, LoglineData } from './types/overlay';
import {
  getGrandCompanyName,
  getGrandCompanyColor,
} from '@/app/tools'
import CalendarTab from './components/CalendarTab';

/** 标准点结构，包括被其他方占领而暂停跳分的点 */
interface PointInfo {
  type?: undefined;
  remain: number;
  total: number;
  owner: GrandCompany;
  ptLv: string;
  paused: boolean;
  pause: () => void;
  resume: () => void;
  cancel: () => void;
}
/** 初始点结构，仅限刚刚刷新出来，未被占领过的点 */
interface InitialPointInfo {
  type: 'initial';
  /** 草原的点刷出来之后要等一段时间才能占领 */
  time?: {
    /** 剩余刷新时间 */
    remain: number;
    /** 总需刷新时间 */
    total: number;
  }
  /** 点等级 */
  ptLv: string;
  /** 点总分 */
  ptTotal: number;
  cancel: () => void;
}
/** 还未刷新，但可以推测剩余刷新时间的点 */
interface PrePointInfo {
  key: string;
  /** 剩余刷新时间 */
  remain: number;
  /** 总需刷新时间 */
  total: number;
}

const gcFp : Record<GrandCompany, number> = {
  [GrandCompany.maelstrom]: 0,
  [GrandCompany.twinadder]: 0,
  [GrandCompany.immoflame]: 0,
}
const pointMap : Record<string, PointInfo | InitialPointInfo> = {}
const prePoints : PrePointInfo[] = []

interface LasthitInfo {
  perpetratorName: string;
  victimName: string;
  hitActionName: string;
}
interface DeathInfo {
  happenTime: number;
  victimName: string;
  perpetratorName: string;
  summonedBy?: string;
  lasthitActionName: string;
}

/** 玩家表 | `key:charID` | `val:charName` */
let playerMap : Record<string, string> = {}
/** 召唤物表 | `key:召唤物ID` | `val:召唤者ID` */
let summonMap : Record<string, string> = {}
/** 上次受击表 | `key:施害者ID+受害者ID` */
let playerLasthitMap : Record<string, LasthitInfo> = {}
const deaths : DeathInfo[] = []

const parseGc = (gc_name: string) => {
  if (gc_name === '黑涡团') return GrandCompany.maelstrom
  else if (gc_name === '双蛇党') return GrandCompany.twinadder
  else if (gc_name === '恒辉队') return GrandCompany.immoflame
  throw new Error('parseGc: unknown gc:' + gc_name)
}
const formatTime = (timestamp: number) => {
  return new Date(timestamp).toTimeString().slice(0, 8)
}

export default function Home() {
  const { initialize, addOverlayListener, removeOverlayListener, startOverlayEvents } = useOverlay()

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [playerId, setPlayerId] = useState<string>('')
  const [playerName, setPlayerName] = useState<string>('')
  const [onConflict, setOnConflict] = useState<boolean>(false)
  const [frontline, setFrontline] = useState<Frontline | "">('')
  const [gc, setGc] = useState<GrandCompany | "">('')
  const [ptMax, setPtMax] = useState<number>(0)
  const [ppIndex, setPpIndex] = useState<number>(0)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [dummy, setDummy] = useState(0) // 手动刷新

  const availableTabs = ['situation', 'knockout', 'death', 'calendar', 'preference'] as const
  const [activeTab, setActiveTab] = useState<typeof availableTabs[number]>('situation');
  const [collapsed, setCollapsed] = useState(false);
  const getTabName = (tab: typeof availableTabs[number]) => {
    switch (tab) {
      case 'situation': return '战况';
      case 'knockout': return '击倒';
      case 'death': return '阵亡';
      case 'calendar': return '日历';
      case 'preference': return '设置';
      default: return '???';
    }
  }

  const activePoint = (key: string, owner: GrandCompany, ptLv: string, total: number, drop: number) => {
    if (pointMap[key] && pointMap[key].type !== 'initial') {
      pointMap[key].owner = owner
      pointMap[key].resume()
      return
    }
    if (pointMap[key]) {
      pointMap[key].cancel()
    }

    let remain = total
    let timer: NodeJS.Timeout | null = null
    let paused = false

    const tick = () => {
      if (paused) return
      remain -= drop
      if (remain <= 0) {
        remain = 0; cleanup()
      }
      setDummy(d => d + 1)
    }
    const cleanup = () => {
      if (timer) clearInterval(timer)
      delete pointMap[key]
      setDummy(d => d + 1)
    }
    const startTimer = () => {
      if (!timer) {
        timer = setInterval(tick, 3000)
      }
    }

    pointMap[key] = {
      get remain() {
        return remain
      },
      total: total,
      owner: owner,
      ptLv: ptLv,
      get paused() {
        return paused
      },
      pause() {
        paused = true
      },
      resume() {
        if (!paused) return
        paused = false
      },
      cancel() {
        cleanup()
      }
    }

    startTimer()
  }
  const createInitialPoint = (key: string, ptLv: string, total: number, countdown?: number) => {
    if (pointMap[key]) {
      pointMap[key].cancel()
    }

    let remain = countdown || 0
    let timer: NodeJS.Timeout | null = null

    const tick = () => {
      if (!countdown) return
      remain -= 1
      if (remain <= 0) {
        remain = 0; cleanup()
      }
      setDummy(d => d + 1)
    }
    const cleanup = () => {
      if (timer) clearInterval(timer)
      delete pointMap[key]
      setDummy(d => d + 1)
    }
    const startTimer = () => {
      if (!timer) {
        timer = setInterval(tick, 1000)
      }
    }

    pointMap[key] = {
      type: 'initial',
      time: countdown ? {
        get remain() {
          return remain
        },
        total: countdown,
      } : undefined,
      ptLv: ptLv,
      ptTotal: total,
      cancel() {
        cleanup()
      }
    }

    startTimer()
  }
  const createPrePoint = (key: string, total: number) => {
    let remain = total
    let timer: NodeJS.Timeout | null = null

    const tick = () => {
      remain -= 1
      if (remain <= 0) {
        remain = 0; cleanup()
      }
      setDummy(d => d + 1)
    }
    const cleanup = () => {
      if (timer) clearInterval(timer)
      const index = prePoints.findIndex(item => item.key === key)
      if (index !== -1) {
        prePoints.splice(index, 1)
      }
    }
    const startTimer = () => {
      if (!timer) {
        timer = setInterval(tick, 1000)
      }
    }

    const val : PrePointInfo = {
      key: key,
      get remain() {
        return remain
      },
      total: total,
    }

    startTimer()
    return val
  }

  const getGcPoint = (gc: GrandCompany) => {
    if (frontline === Frontline.seize) {
      const arr = Object.values(pointMap)
        .filter(val => val.type !== 'initial' && val.owner === gc)
        .map(val => (val as PointInfo).remain)
      if (!arr.length) return 0
      return arr.reduce((prev, cur) => prev + cur)
    } else {
      return gcFp[gc]
    }
  }

  const zoneChangeCallback = (data: ChangeZoneData) => {
    console.log('Zone changed:', JSON.stringify(data))
    if (data.zoneID === 1273) {
      setFrontline(Frontline.secure)
    } else if (data.zoneID === 431) {
      setFrontline(Frontline.seize)
    } else if (data.zoneID === 554) {
      setFrontline(Frontline.shatter)
    } else if (data.zoneID === 999) {
      setFrontline(Frontline.naadam)
    } else {
      setOnConflict(false); setFrontline(''); setGc('')
      gcFp.maelstrom = 0; gcFp.twinadder = 0; gcFp.immoflame = 0
      Object.entries(pointMap).forEach(([key, val]) => {
        if (val.type === 'initial') delete pointMap[key]
        else val.cancel()
      })
      prePoints.length = 0
      playerMap = {}; summonMap = {}; playerLasthitMap = {}
      setDummy(0)
    }
  }
  const primaryPlayerChangeCallback = useCallback((data: ChangePrimaryPlayerData) => {
    setPlayerId(data.charID)
    setPlayerName(data.charName)
  }, [
    setPlayerId, setPlayerName
  ]);
  const loglineCallback = useCallback((data: LoglineData) => {
    const msgType = data.line[0] // "00"
    const msgChannel = data.line[2] // "0839"
    const msg = data.line[4] // "冰封的石文A1启动了，冰块变得脆弱了！"

    if (onConflict || frontline) { // * 为了减轻负载，仅在纷争前线期间解析战斗
      if (msgType === '03') { // 添加战斗成员
        // 03|2025-07-21T19:50:15.3580000+08:00|100F9FCA|西风|18|64|0000|415|MoDuNa|0|0|54000|55500|10000|10000|||241.34|135.04|-7.08|-2.09|af51ebeec28c5c27
        const charId = data.line[2]
        const charName = data.line[3]
        playerMap[charId] = charName
      } else if (
        (msgType === '21' || msgType === '22') // 发动技能
        && (
          (data.line[8] || '').toString().endsWith('3')
          || (data.line[10] || '').toString().endsWith('3')
          || (data.line[12] || '').toString().endsWith('3')
          || (data.line[14] || '').toString().endsWith('3')
          || (data.line[16] || '').toString().endsWith('3')
        ) // 造成了伤害
      ) {
        // https://github.com/OverlayPlugin/cactbot/blob/main/docs/LogGuide.md#line-21-0x15-networkability
        // 22|2025-07-21T20:15:49.3900000+08:00|1058F1D5|浮|72DC|霰弹枪|40000002|木人|720003|17700000|0|0|0|0|0|0|0|0|0|0|0|0|0|0|75000|75000|10000|10000|||104.12|-4.71|2.31|3.14|57000|57000|10000|10000|||94.94|-13.42|2.31|-2.71|0007B835|1|2|00||01|72DC|72DC|0.100|0000|69f2e27a0f10b758
        const perpetratorId = data.line[2]
        const perpetratorName = data.line[3]
        const hitActionName = data.line[5]
        const victimId = data.line[6]
        const victimName = data.line[7]
        if (perpetratorId && perpetratorName && hitActionName && victimId && victimName) {
          const key = `${perpetratorId}-${victimId}`
          playerLasthitMap[key] = {
            perpetratorName: perpetratorName,
            victimName: victimName,
            hitActionName: hitActionName,
          }
        }
      } else if (msgType === '25') { // Death
        // 25|2025-07-21T20:04:08.8860000+08:00|10582BA7|卷饼|1058F1D5|浮|d94e2430f7a262f2
        const victimId = data.line[2]
        const victimName = data.line[3]
        const perpetratorId = data.line[4]
        const perpetratorName = data.line[5]
        if (victimId && !victimId.startsWith('40')) { // 忽略场景物体
          if (perpetratorId && perpetratorName && victimName) {
            let summoner : string | undefined
            if (summonMap[perpetratorId]) {
              const summonerId = summonMap[perpetratorId]
              if (playerMap[summonerId]) {
                summoner = playerMap[summonerId]
              }
            }
            deaths.push({
              happenTime: Date.now(),
              victimName: victimName,
              perpetratorName: perpetratorName,
              summonedBy: summoner,
              lasthitActionName: playerLasthitMap[`${perpetratorId}-${victimId}`]?.hitActionName || '???',
            })
            setDummy(d => d + 1)
          }
        }
        
      } else if (msgType === '261' && data.line[2] === 'Add') { // Summon
        // 261|2025-07-21T20:19:36.6860000+08:00|Add|40007109|BNpcID|3951|BNpcNameID|E53|CastTargetID|E0000000|CurrentMP|10000|CurrentWorldID|65535|Heading|1.6445|Level|100|MaxHP|57000|MaxMP|10000|ModelStatus|3072|Name|象式浮空炮塔|NPCTargetID|E0000000|OwnerID|1058F1D5|PosX|95.1405|PosY|-7.4485|PosZ|2.3552|Radius|1.0000|Type|2|WorldID|65535|0ed50912a51e73d8
        const summonedId = data.line[3]
        const ownerId = data.line[29]
        if (summonedId && ownerId) {
          summonMap[summonedId] = ownerId
        }
      }
    }

    if (msgType !== '00' || (msgChannel !== '0839' && msgChannel !== '083E')) return
    if (!onConflict) return
    if (!msg) return

    const matchGc = msg.match(/以(黑涡团|双蛇党|恒辉队)的身份参加了纷争前线！/)
    if (matchGc && matchGc[1]) {
      const _gc = parseGc(matchGc[1])
      setGc(_gc)
      setOnConflict(true)
      if (frontline === Frontline.seize) setPtMax(4)
      else if (frontline === Frontline.naadam) setPtMax(6)
      else setPtMax(0)
      return
    }

    if (frontline === Frontline.seize) {
      const getFp = (ptLv: string) => {
        if (ptLv === 'S') return [160, 4]
        else if (ptLv === 'A') return [120, 3]
        else if (ptLv === 'B') return [80, 2]
        throw new Error('[gcFp] wtf point is? ' + ptLv)
      }

      const matchNeutral = msg.match(/(S|A|B)级的亚拉戈石文(.*?)开始活动了！/)
      if (matchNeutral && matchNeutral[2]) {
        const ptLv = matchNeutral[1]
        const pt = matchNeutral[2]
        const [total] = getFp(ptLv)
        createInitialPoint(pt, ptLv, total)
        setDummy(d => d + 1)
        return
      }

      const matchConquer = msg.match(/(黑涡团|双蛇党|恒辉队)占领了(S|A|B)级的亚拉戈石文(.*?)！/)
      if (matchConquer) {
        const pt = matchConquer[3]
        const ptLv = matchConquer[2]
        const owner = parseGc(matchConquer[1])
        const [total, drop] = getFp(ptLv)
        activePoint(pt, owner, ptLv, total, drop)
        setDummy(d => d + 1)
        return
      }

      const matchPause = msg.match(/(S|A|B)级的亚拉戈石文(.*?)变为中立状态！/)
      if (matchPause) {
        const pt = matchPause[2]
        if (pointMap[pt] && pointMap[pt].type !== 'initial') {
          pointMap[pt].pause()
        }
        setDummy(d => d + 1)
        return
      }

      const matchClean = msg.match(/(S|A|B)级的亚拉戈石文(.*?)的情报已枯竭！/)
      if (matchClean) {
        const pt = matchClean[2]
        if (pointMap[pt] && pointMap[pt].type !== 'initial') {
          pointMap[pt].cancel()
        }
        while (prePoints.length > ptMax) prePoints.pop()
        if (prePoints.length < ptMax) {
          const key = `seize-${Date.now()}-${ppIndex}`
          setPpIndex(index => index + 1)
          prePoints.push(createPrePoint(key, 15))
        }
        setDummy(d => d + 1)
        return
      }

      if (msg === '距离“尘封秘岩（争夺战）”结束还有10分钟。') {
        setPtMax(3)
        while (prePoints.length > 3) prePoints.pop()
        setDummy(d => d + 1)
      }
    }
    else if (frontline === Frontline.shatter) {
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
        if (ptLv === 'S') return [200, 20]
        else if (ptLv === 'A') return [100, 10]
        else if (ptLv === 'B') return [50, 5]
        throw new Error('[gcFp] wtf point is? ' + ptLv)
      }

      const matchInitial = msg.match(/30秒后(S|A|B)级无垢的大地(.*?)即将进入可契约状态。/)
      if (matchInitial && matchInitial[2]) {
        const ptLv = matchInitial[1]
        const pt = matchInitial[2]
        const [total] = getFp(ptLv)
        createInitialPoint(pt, ptLv, total, 30)
        setDummy(d => d + 1)
        return
      }

      const matchNeutral = msg.match(/(S|A|B)级无垢的大地(.*?)进入了可契约状态！/)
      if (matchNeutral && matchNeutral[2]) {
        const ptLv = matchNeutral[1]
        const pt = matchNeutral[2]
        const [total] = getFp(ptLv)
        createInitialPoint(pt, ptLv, total)
        setDummy(d => d + 1)
        return
      }

      const matchConquer = msg.match(/(黑涡团|双蛇党|恒辉队)与(S|A|B)级无垢的大地(.*?)签订了契约。/)
      if (matchConquer) {
        const pt = matchConquer[3]
        const ptLv = matchConquer[2]
        const owner = parseGc(matchConquer[1])
        const [total, drop] = getFp(ptLv)
        activePoint(pt, owner, ptLv, total, drop)
        setDummy(d => d + 1)
        return
      }

      const matchClean = msg.match(/无垢的大地(.*?)已失效。/)
      if (matchClean) {
        const pt = matchClean[1]
        if (pointMap[pt] && pointMap[pt].type !== 'initial') {
          pointMap[pt].cancel()
        }
        setDummy(d => d + 1)
        return
      }

      if (msg === '距离战斗开始已经过5分钟，无垢的大地的同时出现数量减少了！') {
        setPtMax(4)
        while (prePoints.length > 4) prePoints.pop()
        setDummy(d => d + 1)
      }
      if (msg === '距离战斗开始已经过10分钟，无垢的大地的同时出现数量减少了！') {
        setPtMax(3)
        while (prePoints.length > 3) prePoints.pop()
        setDummy(d => d + 1)
      }
      if (msg === '距离战斗开始已经过15分钟，无垢的大地的同时出现数量减少了！') {
        setPtMax(2)
        while (prePoints.length > 2) prePoints.pop()
        setDummy(d => d + 1)
      }
    }

    if (
      data.rawLine.includes('参加了纷争前线')
      || data.rawLine.includes('无垢的大地')
      || data.rawLine.includes('亚拉戈石文')
      || data.rawLine.includes('获得了50个亚拉戈诗学神典石。')
    ) console.log(JSON.stringify(data))
    // setLogs(val => val + '\r\n' + data.rawLine)
  }, [
    onConflict, frontline, ptMax, ppIndex,
  ])

  const getCards = () => {
    const result : {
      key: string,
      type: "active" | "neutrality" | "preparing"
      ptLv?: string
      ptName: string
      ptProgress?: number
      ptDescription: string
    }[] = Object.entries(pointMap).map(([key, val]) => {
      let ptName = ''
      if (frontline === Frontline.seize) ptName = '亚拉戈石文'
      else if (frontline === Frontline.shatter) ptName = '冰封的石文'
      else if (frontline === Frontline.naadam) ptName = '无垢的大地'
      ptName += key
      if (val.type === 'initial') {
        return {
          key: `pointMap-${key}`,
          type: 'neutrality',
          ptLv: val.ptLv,
          ptName: ptName,
          ptDescription: '中立' + val.time?.remain ? ('／还需 ' + val.time!.remain.toString() + 's') : ('／剩余 ' + val.ptTotal.toString()),
        }
      } else {
        return {
          key: `pointMap-${key}`,
          type: val.paused ? 'neutrality' : 'active',
          color: val.paused ? '' : getGrandCompanyColor(val.owner),
          ptLv: val.ptLv,
          ptName: ptName,
          ptProgress: val.remain / val.total * 100,
          ptDescription: (val.paused ? '中立': getGrandCompanyName(val.owner)) + '／剩余 ' + val.remain.toString(),
        }
      }
    })
    prePoints.forEach(val => {
      result.push({
        key: `prePoints-${val.key}`,
        type: 'preparing',
        ptName: '即将刷新',
        ptProgress: val.remain / val.total * 100,
        ptDescription: '还需 ' + val.remain.toString() + 's',
      })
    })
    return result
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    initialize(window)

    addOverlayListener('ChangeZone', zoneChangeCallback)
    addOverlayListener('ChangePrimaryPlayer', primaryPlayerChangeCallback)
    addOverlayListener('LogLine', loglineCallback)

    startOverlayEvents()

    return () => {
      removeOverlayListener('ChangeZone', zoneChangeCallback)
      removeOverlayListener('ChangePrimaryPlayer', primaryPlayerChangeCallback)
      removeOverlayListener('LogLine', loglineCallback)
    }
  }, [
    loglineCallback, primaryPlayerChangeCallback,
    initialize, addOverlayListener, removeOverlayListener, startOverlayEvents
  ])

  const titleStyle : React.CSSProperties = {
    width: 'calc(100% - 10px)',
    fontSize: '20px',
    alignSelf: 'baseline',
    color: 'white',
    background: 'rgba(31, 31, 31, 0.9)',
    border: '1px solid rgba(0, 0, 0, 0.5)',
    borderRadius: '4px',
    padding: '2px 4px',
  }
  const panelStyle : React.CSSProperties = {
    width: '100%',
    flex: 1,
    background: 'rgba(255,255,255,0.1)',
    padding: '8px',
    borderRadius: '4px',
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  }

  return (
    <div
      style={{
        fontFamily: '"Cambria", "思源宋体 CN"',
        width: 'calc(100% - 8px)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyItems: 'center',
        gap: '8px',
        padding: '4px',
        background: 'transparent',
      }}
    >
      {/* 顶部操作栏 */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '4px 8px',
          borderRadius: '4px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          {availableTabs.map((tab) => (
            <div
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                fontSize: '20px',
                padding: '4px 8px',
                background: activeTab === tab ? 'rgba(255,255,255,0.3)' : 'transparent',
                border: '1px solid transparent',
                borderRadius: '4px',
                color: 'black',
                cursor: 'pointer',
              }}
            >
              {getTabName(tab)}
            </div>
          ))}
        </div>
        <div
          onClick={() => setCollapsed(!collapsed)}
          style={{
            fontSize: '20px',
            padding: '4px 8px',
            border: '1px solid transparent',
            borderRadius: '4px',
            background: collapsed ? 'rgba(255, 255, 255, 0.3)' : 'transparent',
            color: 'black',
            cursor: 'pointer',
          }}
        >
          点此{collapsed ? '展开' : '折叠'}
        </div>
      </div>

      {/* 主要内容区 */}
      {!collapsed && (
        <main
          style={{
            width: '100%',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            alignItems: 'center',
          }}
        >
          {/* 战况 */}
          {activeTab === 'situation' && (
            <div style={panelStyle}>
              <div style={titleStyle}>剩余点分</div>
              <div
                style={{
                  width: '100%',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                }}
              >
                <GcCard gc={GrandCompany.maelstrom} me={gc === GrandCompany.maelstrom} floatPoints={getGcPoint(GrandCompany.maelstrom)} />
                <GcCard gc={GrandCompany.twinadder} me={gc === GrandCompany.twinadder} floatPoints={getGcPoint(GrandCompany.twinadder)} />
                <GcCard gc={GrandCompany.immoflame} me={gc === GrandCompany.immoflame} floatPoints={getGcPoint(GrandCompany.immoflame)} />
              </div>
              <div style={titleStyle}>当前据点</div>
              <div
                style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                }}
              >
                {
                  getCards().map(val => {
                    return (
                      <PointCard
                        key={val.key}
                        type={val.type}
                        ptLv={val.ptLv}
                        ptName={val.ptName}
                        ptProgress={val.ptProgress}
                        ptDescription={val.ptDescription}
                      />
                    )
                  })
                }
              </div>
            </div>
          )}
          {/* 击倒 */}
          {activeTab === 'knockout' && (
            <div style={panelStyle}>
              {
                deaths.filter(death => death.perpetratorName === playerName || death.summonedBy === playerName).map((death, deathIndex) => (
                  <div key={'knockout' + deathIndex} style={titleStyle}>
                    <span>{formatTime(death.happenTime)}　</span>
                    <span>使用</span>
                    {
                      death.summonedBy && (
                        <>
                          <span style={{color: 'orangered'}}>{death.perpetratorName}</span>
                          <span>发动的</span>
                        </>
                      )
                    }
                    <span style={{color: 'orangered'}}>{death.lasthitActionName}</span>
                    <span>击倒了</span>
                    <span style={{color: 'orangered'}}>{death.victimName}</span>
                  </div>
                ))
              }
            </div>
          )}
          {/* 死亡 */}
          {activeTab === 'death' && (
            <div style={panelStyle}>
              {
                deaths.filter(death => death.victimName === playerName).map((death, deathIndex) => (
                  <div key={'death' + deathIndex} style={titleStyle}>
                    <span>{formatTime(death.happenTime)}　</span>
                    <span>被</span>
                    <span style={{color: 'orangered'}}>{death.summonedBy || death.perpetratorName}</span>
                    {
                      death.summonedBy && (
                        <>
                          <span>召唤的</span>
                          <span style={{color: 'orangered'}}>{death.perpetratorName}</span>
                        </>
                      )
                    }
                    <span>用</span>
                    <span style={{color: 'orangered'}}>{death.lasthitActionName}</span>
                    <span>击倒了</span>
                  </div>
                ))
              }
            </div>
          )}
          {/* 日历 */}
          {activeTab === 'calendar' && (
            <CalendarTab
              panelStyle={panelStyle}
              titleStyle={titleStyle}
            />
          )}
          {/* 设置 */}
          {activeTab === 'preference' && (<PreferenceTab onSave={() => {}} />)}
        </main>
      )}
    </div>
  );
}
