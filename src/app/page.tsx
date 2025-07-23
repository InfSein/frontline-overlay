'use client';

import { useCallback, useEffect, useState } from 'react'
//import Image from "next/image";
import PageStyle from './page.module.css'
import GcCard from "./components/GcCard";
import PointCard from "./components/PointCard";
import useOverlay from "./tools/overlay";
import { GrandCompany, Frontline } from './types'
import { ChangePrimaryPlayerData, ChangeZoneData, LoglineData } from './types/overlay';
import {
  getGrandCompanyName,
  getGrandCompanyColor,
  getActionDamageFromLogLine,
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
  hitActionDamage: number;
}
interface DeathInfo {
  happenTime: number;
  victimName: string;
  perpetratorName: string;
  summonedBy?: string;
  lasthitActionName: string;
}
interface SelfActionLog {
  happenTime: number;
  perpetratorName: string;
  actionName: string;
  actionDamage: number;
}

/** 玩家表 | `key:charID` | `val:charName` */
let playerMap : Record<string, string> = {}
/** 召唤物表 | `key:召唤物ID` | `val:召唤者ID` */
let summonMap : Record<string, string> = {}
/** 上次受击表 | `key:施害者ID+受害者ID` */
let playerLasthitMap : Record<string, LasthitInfo> = {}
const deaths : DeathInfo[] = []
const goodboys : SelfActionLog[] = []
const badboys : SelfActionLog[] = []

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

  const [playerId, setPlayerId] = useState<string>('')
  const [playerName, setPlayerName] = useState<string>('')
  const [onConflict, setOnConflict] = useState<boolean>(false)
  const [frontline, setFrontline] = useState<Frontline | "">('')
  const [gc, setGc] = useState<GrandCompany | "">('')
  const [ptMax, setPtMax] = useState<number>(0)
  const [dummy, setDummy] = useState(0) // 手动刷新

  const availableTabs = ['situation', 'knockout', 'death', 'goodboy', 'badboy', 'calendar'] as const
  const [activeTab, setActiveTab] = useState<typeof availableTabs[number]>('situation');
  const [collapsed, setCollapsed] = useState(false);
  const getTabName = (tab: typeof availableTabs[number]) => {
    switch (tab) {
      case 'situation': return '战况';
      case 'knockout': return '击倒';
      case 'death': return '阵亡';
      case 'goodboy': return '好人';
      case 'badboy': return '坏人';
      case 'calendar': return '日历';
      default: return '???';
    }
  }

  const getCurrPointCount = () => {
    return prePoints.length + Object.keys(pointMap).length
  }
  const activePoint = (key: string, owner: GrandCompany, ptLv: string, total: number, drop: number) => {
    if (pointMap[key] && pointMap[key].type !== 'initial') {
      pointMap[key].owner = owner
      pointMap[key].resume()
      setDummy(d => d + 1)
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
      } else if ((msgType === '21' || msgType === '22')) { // 发动技能
        // https://github.com/OverlayPlugin/cactbot/blob/main/docs/LogGuide.md#line-21-0x15-networkability
        // 22|2025-07-21T20:15:49.3900000+08:00|1058F1D5|浮|72DC|霰弹枪|40000002|木人|720003|17700000|0|0|0|0|0|0|0|0|0|0|0|0|0|0|75000|75000|10000|10000|||104.12|-4.71|2.31|3.14|57000|57000|10000|10000|||94.94|-13.42|2.31|-2.71|0007B835|1|2|00||01|72DC|72DC|0.100|0000|69f2e27a0f10b758
        const perpetratorId = data.line[2]
        const perpetratorName = data.line[3] || '???'
        const hitActionId = data.line[4]
        const hitActionName = data.line[5] || '???'
        const victimId = data.line[6]
        const victimName = data.line[7] || '???'

        if (perpetratorId && victimId) {
          const { hit, damage } = getActionDamageFromLogLine(data.line)

          // 记录上次伤害表
          if (hit) {
            const key = `${perpetratorId}-${victimId}`
            playerLasthitMap[key] = {
              perpetratorName: perpetratorName,
              victimName: victimName,
              hitActionName: hitActionName,
              hitActionDamage: damage,
            }
          }
          if (hitActionId && victimId === playerId && perpetratorId !== playerId) {
            // 记录好人
            const goodActions = [
              '卫护', '至黑之夜',
              '疗愈', '救疗', '水流幕', '鼓舞激励之策', '吉星相位', '心关',
              '闭式舞姿',
              '守护之光',
            ]
            if (goodActions.includes(hitActionId) || goodActions.includes(hitActionName)) {
              if (!goodActions.includes(hitActionId)) console.log('[Action]\t' + hitActionId + '\t' + hitActionName)
              goodboys.push({
                happenTime: Date.now(),
                perpetratorName: perpetratorName,
                actionName: hitActionName,
                actionDamage: damage,
              })
            }
            // 记录坏人
            const badActions = [
              '全力挥打', '献身', '陨石冲击', '魔弹射手',
            ]
            if (badActions.includes(hitActionId) || badActions.includes(hitActionName)) {
              if (!badActions.includes(hitActionId)) console.log('[Action]\t' + hitActionId + '\t' + hitActionName)
              badboys.push({
                happenTime: Date.now(),
                perpetratorName: perpetratorName,
                actionName: hitActionName,
                actionDamage: damage,
              })
            }
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
    
    if (!onConflict && !frontline) return

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
        while (prePoints.length && getCurrPointCount() > ptMax) prePoints.pop()
        if (prePoints.length < ptMax) {
          const key = `seize-${Date.now()}-${dummy}`
          prePoints.push(createPrePoint(key, 15))
        }
        setDummy(d => d + 1)
        return
      }

      if (msg === '距离“尘封秘岩（争夺战）”结束还有10分钟。') {
        setPtMax(3)
        while (prePoints.length && getCurrPointCount() > 3) prePoints.pop()
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
        setDummy(d => d + 1)
      }
      if (msg === '距离战斗开始已经过10分钟，无垢的大地的同时出现数量减少了！') {
        setPtMax(3)
        setDummy(d => d + 1)
      }
      if (msg === '距离战斗开始已经过15分钟，无垢的大地的同时出现数量减少了！') {
        setPtMax(2)
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
    onConflict, frontline, ptMax, dummy, playerId,
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
          ptDescription: '中立' + (val.time ? ('／还需 ' + val.time.remain.toString() + 's') : ('／剩余 ' + val.ptTotal.toString())),
        }
      } else {
        return {
          key: `pointMap-${key}`,
          type: val.paused ? 'neutrality' : 'active',
          specifyColor: val.paused ? '' : getGrandCompanyColor(val.owner),
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
  const getKnockouts = () => {
    return deaths.filter(death => death.perpetratorName === playerName || death.summonedBy === playerName)
  }
  const getDeaths = () => {
    return deaths.filter(death => death.victimName === playerName)
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

  return (
    <div
      className="flex flex-col h-full items-center justify-items-center gap-2 p-1 bg-transparent"
      style={{
        width: 'calc(100% - 8px)',
        fontFamily: '"Cambria", "思源宋体 CN"',
      }}
    >
      {/* 顶部操作栏 */}
      <div className="w-full flex justify-between items-center bg-white/10 p-1 px-2 rounded">
        <div className="flex gap-2">
          {availableTabs.map((tab) => (
            <div
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="text-[20px] px-2 py-1 border border-transparent rounded text-white cursor-pointer text-shadow"
              style={{
                background: !collapsed && activeTab === tab ? 'rgba(255,255,255,0.3)' : 'transparent',
              }}
            >
              {getTabName(tab)}
            </div>
          ))}
        </div>
        <div
          onClick={() => setCollapsed(!collapsed)}
          className="text-[20px] px-2 py-1 border border-transparent rounded text-white cursor-pointer text-shadow"
          style={{
            background: collapsed ? 'rgba(255, 255, 255, 0.3)' : 'transparent',
          }}
        >
          点此{collapsed ? '展开' : '折叠'}
        </div>
      </div>

      {/* 主要内容区 */}
      {!collapsed && (
        <main className="w-full flex flex-1 flex-col gap-1 items-center">
          {/* 战况 */}
          {activeTab === 'situation' && (
            <div className={PageStyle.panel}>
              <div className={PageStyle.title}>剩余点分</div>
              <div className="w-full grid grid-cols-3 gap-2">
                <GcCard gc={GrandCompany.maelstrom} me={gc === GrandCompany.maelstrom} floatPoints={getGcPoint(GrandCompany.maelstrom)} />
                <GcCard gc={GrandCompany.twinadder} me={gc === GrandCompany.twinadder} floatPoints={getGcPoint(GrandCompany.twinadder)} />
                <GcCard gc={GrandCompany.immoflame} me={gc === GrandCompany.immoflame} floatPoints={getGcPoint(GrandCompany.immoflame)} />
              </div>
              <div className={PageStyle.title}>当前据点</div>
              <div className="w-full flex flex-col gap-0.5">
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
            <div className={PageStyle.panel}>
              {
                !getKnockouts().length && (
                  <div className={PageStyle.title}>暂无击倒记录</div>
                )
              }
              {
                getKnockouts().map((death, deathIndex) => (
                  <div key={'knockout' + deathIndex} className={PageStyle.title}>
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
            <div className={PageStyle.panel}>
              {
                !getDeaths().length && (
                  <div className={PageStyle.title}>暂无死亡记录</div>
                )
              }
              {
                getDeaths().map((death, deathIndex) => (
                  <div key={'death' + deathIndex} className={PageStyle.title}>
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
          {/* 好人 */}
          {activeTab === 'goodboy' && (
            <div className={PageStyle.panel}>
              {
                !goodboys.length && (
                  <div className={PageStyle.title}>暂无记录</div>
                )
              }
              {
                goodboys.map((log, logIndex) => (
                  <div key={'goodboy' + logIndex} className={PageStyle.title}>
                    <span>{formatTime(log.happenTime)}　</span>
                    <span style={{color: 'orangered'}}>{log.perpetratorName}</span>
                    <span>对你发动了</span>
                    <span style={{color: 'orangered'}}>{log.actionName}</span>
                  </div>
                ))
              }
            </div>
          )}
          {/* 坏人 */}
          {activeTab === 'badboy' && (
            <div className={PageStyle.panel}>
              {
                !badboys.length && (
                  <div className={PageStyle.title}>暂无记录</div>
                )
              }
              {
                badboys.map((log, logIndex) => (
                  <div key={'badboy' + logIndex} className={PageStyle.title}>
                    <span>{formatTime(log.happenTime)}　</span>
                    <span style={{color: 'orangered'}}>{log.perpetratorName}</span>
                    <span>对你发动了</span>
                    <span style={{color: 'orangered'}}>{log.actionName}</span>
                    {
                      log.actionDamage && (
                        <>
                          <span>，造成了</span>
                          <span style={{color: 'orangered'}}>{log.actionDamage}</span>
                          <span>伤害</span>
                        </>
                      )
                    }
                  </div>
                ))
              }
            </div>
          )}
          {/* 日历 */}
          {activeTab === 'calendar' && (
            <CalendarTab />
          )}
        </main>
      )}
    </div>
  );
}
