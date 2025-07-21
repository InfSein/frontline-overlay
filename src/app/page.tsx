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

interface PointInfo {
  remain: number;
  total: number;
  owner: GrandCompany;
  ptLv: string;
  paused: boolean;
  pause: () => void;
  resume: () => void;
  cancel: () => void;
}
interface PrePointInfo {
  key: string;
  remain: number;
  total: number
}

const gcFp : Record<GrandCompany, number> = {
  [GrandCompany.maelstrom]: 0,
  [GrandCompany.twinadder]: 0,
  [GrandCompany.immoflame]: 0,
}
const pointMap : Record<string, PointInfo | "neutrality"> = {}
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
const playerMap : Record<string, string> = {}
/** 召唤物表 | `key:召唤物ID` | `val:召唤者ID` */
const summonMap : Record<string, string> = {}
/** 上次受击表 | `key:施害者ID+受害者ID` */
const playerLasthitMap : Record<string, LasthitInfo> = {}
const deaths : DeathInfo[] = []

const parseGc = (gc_name: string) => {
  if (gc_name === '黑涡团') return GrandCompany.maelstrom
  else if (gc_name === '双蛇党') return GrandCompany.twinadder
  else if (gc_name === '恒辉队') return GrandCompany.immoflame
  throw new Error('parseGc: unknown gc:' + gc_name)
}
const formatTime = (timestamp: number) => {
  return new Date(timestamp).toISOString().slice(11, 19)
}

export default function Home() {
  const { initialize, addOverlayListener, removeOverlayListener, startOverlayEvents } = useOverlay()

  const [playerId, setPlayerId] = useState<string>('')
  const [playerName, setPlayerName] = useState<string>('')
  const [onConflict, setOnConflict] = useState<boolean>(false)
  const [frontline, setFrontline] = useState<Frontline | "">('')
  const [gc, setGc] = useState<GrandCompany | "">('')
  const [ptMax, setPtMax] = useState<number>(0)
  const [ppIndex, setPpIndex] = useState<number>(0)
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
    if (pointMap[key] && pointMap[key] !== 'neutrality') {
      pointMap[key].owner = owner
      pointMap[key].resume()
      return
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
        .filter(val => val !== 'neutrality' && val.owner === gc)
        .map(val => (val as PointInfo).remain)
      if (!arr.length) return 0
      return arr.reduce((prev, cur) => prev + cur)
    } else {
      return gcFp[gc]
    }
  }

  const zoneChangeCallback = (data: ChangeZoneData) => {
    //console.log('Zone changed:', JSON.stringify(data))
    if (data.zoneID === 554) {
      setFrontline(Frontline.shatter)
    } else if (data.zoneID === 431) {
      setFrontline(Frontline.seize)
    } else {
      setOnConflict(false); setFrontline(''); setGc('')
      gcFp.maelstrom = 0; gcFp.twinadder = 0; gcFp.immoflame = 0
      Object.entries(pointMap).forEach(([key, val]) => {
        if (val === 'neutrality') delete pointMap[key]
        else val.cancel()
      })
      prePoints.length = 0
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
        console.log(JSON.stringify(data))
      } else if (msgType === '15' || msgType === '16') { // ActionEffect or AOEActionEffect
        const perpetratorId = data.line[1]
        const perpetratorName = data.line[2]
        const hitActionName = data.line[4]
        const victimId = data.line[5]
        const victimName = data.line[6]
        if (perpetratorId && perpetratorName && hitActionName && victimId && victimName) {
          const key = `${perpetratorId}-${victimId}`
          playerLasthitMap[key] = {
            perpetratorName: perpetratorName,
            victimName: victimName,
            hitActionName: hitActionName,
          }
        } else {
          console.warn('Invalid ActionEffect data:', JSON.stringify(data))
        }
      } else if (msgType === '19') { // Death
        // 19:400002F8:冰封的石文A1:400002FF:亚灵神巴哈姆特
        const victimId = data.line[1]
        const victimName = data.line[2]
        const perpetratorId = data.line[3]
        const perpetratorName = data.line[4]
        if (perpetratorId && perpetratorName && victimId && victimName) {
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
        } else {
          console.warn('Invalid Death data:', JSON.stringify(data))
        }
      } else if (msgType === '105') { // Summon
        // 105:Add:400002FF:BNpcID:1E7B:BNpcNameID:19A6:CastTargetID:E0000000:CurrentMP:10000:CurrentWorldID:65535:Heading:-0.4157:Level:100:MaxHP:57000:MaxMP:10000:ModelStatus:3072:Name:亚灵神巴哈姆特:NPCTargetID:E0000000:OwnerID:105812EF:PosX:-5.9613:PosY:-6.2225:PosZ:-5.0000:Radius:2.1000:Type:2:WorldID:65535
        const summonedId = data.line[2]
        const ownerId = data.line[28]
        if (summonedId && ownerId) {
          summonMap[summonedId] = ownerId
        } else {
          console.warn('Invalid Summon data:', JSON.stringify(data))
        }
      }
    }

    if (msgType !== '00' || (msgChannel !== '0839' && msgChannel !== '083E')) return
    //if (!onConflict) return
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
        const pt = matchNeutral[2]
        pointMap[pt] = 'neutrality'
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
        if (pointMap[pt] && pointMap[pt] !== 'neutrality') {
          pointMap[pt].pause()
        }
        setDummy(d => d + 1)
        return
      }

      const matchClean = msg.match(/(S|A|B)级的亚拉戈石文(.*?)的情报已枯竭！/)
      if (matchClean) {
        const pt = matchClean[2]
        if (pointMap[pt] && pointMap[pt] !== 'neutrality') {
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
        if (ptLv === 'S') return 200
        else if (ptLv === 'A') return 100
        else if (ptLv === 'B') return 50
        throw new Error('[gcFp] wtf point is? ' + ptLv)
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
      if (val === 'neutrality') {
        return {
          key: `pointMap-${key}`,
          type: 'neutrality', ptName: key, ptDescription: '中立'
        }
      } else {
        return {
          key: `pointMap-${key}`,
          type: val.paused ? 'neutrality' : 'active',
          color: val.paused ? '' : getGrandCompanyColor(val.owner),
          ptLv: val.ptLv,
          ptName: key,
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
        ptDescription: val.remain.toString() + 's',
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
        background: 'rgba(0, 0, 0, 0.5)',
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
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '4px 8px',
                background: activeTab === tab ? 'rgba(255,255,255,0.3)' : 'transparent',
                border: '1px solid transparent',
                borderRadius: '4px',
                color: 'white',
                cursor: 'pointer',
              }}
            >
              {getTabName(tab)}
            </button>
          ))}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            padding: '4px 8px',
            border: 'none',
            background: 'rgba(255, 255, 255, 0.3)',
            color: 'white',
            cursor: 'pointer',
          }}
        >
          {collapsed ? '展开' : '折叠'}
        </button>
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
                  <div key={'knockout' + deathIndex}>
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
                  <div key={'death' + deathIndex}>
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
            <div style={panelStyle}>Calendar 内容</div>
          )}
          {/* 设置 */}
          {activeTab === 'preference' && (<PreferenceTab onSave={() => {}} />)}
        </main>
      )}
    </div>
  );
}
