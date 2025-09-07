'use client';

import { useCallback, useEffect, useState } from 'react'
import { Button } from 'tdesign-react/lib/'
import {
  IconFont,
  CopyIcon, ShareIcon, LogoGithubIcon, SystemLogIcon,
} from 'tdesign-icons-react'
//import Image from "next/image";
import PageStyle from './page.module.css'
import AlertCard from './components/AlertCard';
import CalendarTab from './components/CalendarTab';
import FlogCard from './components/FlogCard';
import GcCard from "./components/GcCard";
import PieChart from './components/PieChart';
import PointCard from "./components/PointCard";
import { useToast } from './components/ToastContext';
import useOverlay from "./tools/overlay";
import { GrandCompany, Frontline, FrontlineLog, DeathInfo, CrystalConflict, FrontlineResult, GameZonesMap, AppConstants, PvPBattle, RivalWings } from './types'
import { ChangePrimaryPlayerData, ChangeZoneData, LoglineData } from './types/overlay';
import {
  getGrandCompanyName,
  getGrandCompanyColor,
  getActionDamageFromLogLine,
  getFrontlineNames,
  checkAppUpdates,
  deepCopy,
  copyToClipboard,
} from '@/app/tools'
import { AppConfig, fixAppConfig } from './types/config';
import { loadConfig } from './tools/config';

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
const reactive = {
  currFrontlineResult: undefined as FrontlineResult | undefined,
  currFrontlineStartTime: 0,
}

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
  const { showToast } = useToast()
  const { initialize, addOverlayListener, removeOverlayListener, startOverlayEvents } = useOverlay()

  const [appNewVersion, setAppNewVersion] = useState<string>('')
  const [checkingAppUpdate, setCheckingAppUpdate] = useState(false)
  const checkAppUpdate = async () => {
    try {
      setCheckingAppUpdate(true)
      const { needUpdate, latestVersion } = await checkAppUpdates()
      if (needUpdate) setAppNewVersion(latestVersion)
      else setAppNewVersion('')
    } catch (e) {
      console.error('检查应用新版本时发生错误：', e)
    } finally {
      setCheckingAppUpdate(false)
    }
  }
  const handleCheckAppUpdate = async () => {
    if (checkingAppUpdate) {
      showToast('正在检测中，请稍候'); return
    }
    await checkAppUpdate()
    if (appNewVersion) {
      showToast('检测到新版本')
    } else {
      showToast('已是最新版本')
    }
  }
  const handleUpdateApp = async () => {
    const cacheKeys = await caches.keys()
    for (const name of cacheKeys) {
      await caches.delete(name)
    }
    location.reload()
  }

  const [appConfig, setAppConfig] = useState<AppConfig>(fixAppConfig())

  const [playerId, setPlayerId] = useState<string>('')
  const [playerName, setPlayerName] = useState<string>('')
  const [onConflict, setOnConflict] = useState<boolean>(false)
  const [zone, setZone] = useState<PvPBattle | "">('')
  const [gc, setGc] = useState<GrandCompany | "">('')
  const [ptMax, setPtMax] = useState<number>(0)
  const [dummy, setDummy] = useState(0) // 手动刷新
  const [frontlineLog, setFrontlineLog] = useState<FrontlineLog[]>([])

  const tabPages = {
    situation: '战况',
    knockout: '击倒',
    death: '阵亡',
    goodboy: '好人',
    badboy: '坏人',
    statistics: '统计',
    calendar: '日历',
    about: '关于',
  } as const
  type TabPage = keyof typeof tabPages
  const availableTabs = Object.keys(tabPages) as TabPage[]
  const [activeTab, setActiveTab] = useState<TabPage>('situation')
  const [collapsed, setCollapsed] = useState(false)

  const getCurrPointCount = () => {
    return prePoints.length + Object.keys(pointMap).length
  }
  const activatePoint = (key: string, owner: GrandCompany, ptLv: string, total: number, drop: number) => {
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
    if (zone === Frontline.seize || zone === Frontline.naadam) {
      const arr = Object.values(pointMap)
        .filter(val => val.type !== 'initial' && val.owner === gc)
        .map(val => (val as PointInfo).remain)
      if (!arr.length) return 0
      return arr.reduce((prev, cur) => prev + cur)
    } else {
      return gcFp[gc]
    }
  }
  const getKnockouts = useCallback(() => {
    return deaths.filter(death => death.perpetratorName === playerName || death.summonedBy === playerName)
  }, [playerName])
  const getDeaths = useCallback(() => {
    return deaths.filter(death => death.victimName === playerName)
  }, [playerName])

  const zoneChangeCallback = useCallback((data: ChangeZoneData) => {
    const conflictZone = GameZonesMap.get(data.zoneID)
    if (conflictZone) {
      setZone(conflictZone)
    } else {
      if (zone) {
        let result = undefined
        if (
          reactive.currFrontlineResult
          && (
            Object.values(CrystalConflict).includes(zone as CrystalConflict)
            || zone === RivalWings.hiddengorge
          )
        ) {
          result = reactive.currFrontlineResult
          reactive.currFrontlineResult = undefined
        }
        const log = deepCopy<FrontlineLog>({
          zone: zone,
          result,
          start_time: reactive.currFrontlineStartTime,
          knockouts: getKnockouts(),
          deaths: getDeaths()
        })
        setFrontlineLog(prev => [...prev, log])
        if (appConfig.auto_collapse_when_leave_battlefield) {
          setCollapsed(true)
        }
      }
      setOnConflict(false); setZone(''); setGc('')
      gcFp.maelstrom = 0; gcFp.twinadder = 0; gcFp.immoflame = 0
      Object.entries(pointMap).forEach(([key, val]) => {
        if (val.type === 'initial') delete pointMap[key]
        else val.cancel()
      })
      prePoints.length = 0
      playerMap = {}; summonMap = {}; playerLasthitMap = {}
      setDummy(0)
      if (process.env.NODE_ENV === 'development') {
        console.log('[Zone] ', data.zoneID, ' / ', data.zoneName)
      }
    }
  }, [
    zone, getKnockouts, getDeaths,
    appConfig.auto_collapse_when_leave_battlefield,
  ])
  const primaryPlayerChangeCallback = useCallback((data: ChangePrimaryPlayerData) => {
    setPlayerId(data.charID.toString(16).toUpperCase())
    setPlayerName(data.charName)
  }, [
    setPlayerId, setPlayerName
  ]);
  const loglineCallback = useCallback((data: LoglineData) => {
    const msgType = data.line[0] // "00"
    const msgChannel = data.line[2] // "0839"
    const msg = data.line[4] // "冰封的石文A1启动了，冰块变得脆弱了！"

    // 处理战斗日志
    if (onConflict || zone || true) { // * 为了减轻负载，仅在纷争前线期间解析战斗
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

        let isValidAction = data.line[8] !== '0'
        if (hitActionId === '72D3'/*默者的夜曲*/) {
          isValidAction = data.line[10] !== '0'
        }

        if (process.env.NODE_ENV === 'development') {
          console.log(
            `[Action] ${perpetratorName}(${perpetratorId}) -> ${victimName}(${victimId}): ${hitActionName}(${hitActionId})`,
            '\ndetail:', data.rawLine
          )
        }

        if (isValidAction && perpetratorId && victimId) {
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
              '718A'/*卫护*/, '71A5'/*至黑之夜*/, 'A1E3'/*刚玉之心*/,
              'A8F7'/*疗愈*/, '7228'/*救疗*/, '722B'/*水流幕*/, '7230'/*鼓舞激励之策*/,
              '723B'/*吉星相位*/, '723F'/*吉星相位2*/, '7250'/*心关*/,
              'A8F2'/*勇气*/, '72D8'/*光阴神的礼赞凯歌*/, '72F7'/*闭式舞姿*/,
              '73E6'/*守护之光*/, '7344'/*命水*/,
            ]
            const mustHeal = [
              '723B'/*吉星相位*/, '723F'/*吉星相位2*/,
            ]
            if (goodActions.includes(hitActionId) || goodActions.includes(hitActionName)) {
              if (!goodActions.includes(hitActionId)) console.log('[Action]\t' + hitActionId + '\t' + hitActionName + '\t' + damage)
              let record = true
              if (mustHeal.includes(hitActionId) && !hit) {
                record = false
              }
              if (hitActionName === '光阴神的礼赞凯歌' && data.line[10] === '0') {
                record = false
              }
              if (record) {
                goodboys.push({
                  happenTime: Date.now(),
                  perpetratorName: perpetratorName,
                  actionName: hitActionName,
                  actionDamage: damage,
                })
              }
            }
            // 记录坏人
            const badActions = [
              'A8ED'/*全力挥打*/, '7199'/*献身*/, '732D'/*陨石冲击*/,
              '72E7'/*魔弹射手*/, '72DF'/*空气锚*/,
              '72D3'/*默者的夜曲*/, 'A1FB'/*英雄的返场余音*/, '72D2'/*爆破箭*/,
              'A226'/*昏沉*/,
            ]
            const mustHit = [
              '732D'/*陨石冲击*/, '72E7'/*魔弹射手*/,
              '72DF'/*空气锚*/, '72D2'/*爆破箭*/,
            ]
            if (badActions.includes(hitActionId) || badActions.includes(hitActionName)) {
              if (!badActions.includes(hitActionId)) console.log('[Action]\t' + hitActionId + '\t' + hitActionName + '\t' + damage)
              let record = true
              if (mustHit.includes(hitActionId) && !hit) {
                record = false
              }
              if (record) {
                badboys.push({
                  happenTime: Date.now(),
                  perpetratorName: perpetratorName,
                  actionName: hitActionName,
                  actionDamage: damage,
                })
              }
            }
          }
        }
      } else if (msgType === '25') { // Death
        // 25|2025-07-21T20:04:08.8860000+08:00|10582BA7|卷饼|1058F1D5|浮|d94e2430f7a262f2
        const victimId = data.line[2]
        const victimName = data.line[3] || '???'
        const perpetratorId = data.line[4]
        const perpetratorName = data.line[5] || '???'
        if (victimId && !victimId.startsWith('40')) { // 忽略场景物体被打倒的信息
          if (perpetratorId) {
            let summoner : string | undefined
            if (summonMap[perpetratorId]) {
              const summonerId = summonMap[perpetratorId]
              if (playerMap[summonerId]) {
                summoner = playerMap[summonerId]
              } else if (summonerId === playerId) {
                summoner = playerName
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

    // 过滤无关频道
    const validChannels = ['0039', '0839', '0840', '083E']
    if (msgType !== '00' || !validChannels.includes(msgChannel)) return
    if (!msg) return

    // 处理战斗开始信息
    const matchGc = msg.match(/以(黑涡团|双蛇党|恒辉队)的身份参加了纷争前线！/)
    if (
      matchGc
      || msg === '战斗即将开始！'
      || (zone === RivalWings.hiddengorge && msg === "进入了对战区域。 当前职业为可以进行对战的特职时， 状态参数和热键栏会被切换为对战专用版。")
    ) {
      if (matchGc && matchGc[1]) {
        const _gc = parseGc(matchGc[1])
        setGc(_gc)
      }
      setOnConflict(true)
      Object.keys(playerLasthitMap).forEach(key => delete playerLasthitMap[key])
      deaths.length = 0
      goodboys.length = 0
      badboys.length = 0

      if (zone === Frontline.seize) setPtMax(4)
      else if (zone === Frontline.naadam) setPtMax(6)
      else setPtMax(0)

      reactive.currFrontlineStartTime = Date.now()
      if (appConfig.auto_expand_when_enter_battlefield) {
        setCollapsed(false)
      }
      return
    }
    
    if (!onConflict && !zone) return

    // 处理刷点信息
    if (zone === Frontline.seize) {
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
        activatePoint(pt, owner, ptLv, total, drop)
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
    else if (zone === Frontline.shatter) {
      /*
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
        return undefined
      }

      const matchPtActive = msg.match(/冰封的石文(A|B)(\d{1,2})启动了，冰块变得脆弱了！/)
      if (matchPtActive && matchPtActive[1] && matchPtActive[2]) {
        const fp = getFp(matchPtActive[1])
        const pt = matchPtActive[1] + matchPtActive[2]
        const _gc = judgeBelong(pt)
        if (_gc) gcFp[_gc] += fp
        setDummy(d => d + 1)
      }

      const matchPtDestroy = msg.match(/冰封的石文(A|B)(\d{1,2})被破坏了！/)
      if (matchPtDestroy && matchPtDestroy[1] && matchPtDestroy[2]) {
        const fp = getFp(matchPtDestroy[1])
        const pt = matchPtDestroy[1] + matchPtDestroy[2]
        const _gc = judgeBelong(pt)
        if (_gc) gcFp[_gc] -= fp
        setDummy(d => d + 1)
      }
      */
    }
    else if (zone === Frontline.naadam) {
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
        activatePoint(pt, owner, ptLv, total, drop)
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

    // 处理结算信息，尝试获取比赛结果
    if (Object.values(Frontline).includes(zone as Frontline)) {

    }
    else if (zone === RivalWings.hiddengorge) {
      // 隐塞
      const matchRewardSeriesExp = msg.match(/获得了([\d,]+)点系列赛经验值。/)
      if (matchRewardSeriesExp && matchRewardSeriesExp[1]) {
        if (matchRewardSeriesExp[1] === '1,250') {
          reactive.currFrontlineResult = 'win'
        } else if (matchRewardSeriesExp[1] === '750') {
          reactive.currFrontlineResult = 'lose'
        }
      }
    }
    else {
      // 55
      const matchRewardSeriesExp = msg.match(/获得了(\d+)点系列赛经验值。/)
      if (matchRewardSeriesExp && matchRewardSeriesExp[1]) {
        if (matchRewardSeriesExp[1] === '900') {
          reactive.currFrontlineResult = 'win'
        } else if (matchRewardSeriesExp[1] === '700') {
          reactive.currFrontlineResult = 'lose'
        }
      }
    }
  }, [
    onConflict, zone, ptMax, dummy, playerId, playerName,
    appConfig.auto_expand_when_enter_battlefield,
  ])

  const getCards = () => {
    const result : {
      key: string,
      type: "active" | "neutrality" | "preparing"
      specifyColor?: string
      ptLv?: string
      ptName: string
      ptProgress?: number
      ptDescription: string
    }[] = Object.entries(pointMap).map(([key, val]) => {
      let ptName = ''
      if (zone === Frontline.seize) ptName = '亚拉戈石文'
      else if (zone === Frontline.shatter) ptName = '冰封的石文'
      else if (zone === Frontline.naadam) ptName = '无垢的大地'
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
        ptLv: '?',
        ptName: '即将刷新',
        ptProgress: val.remain / val.total * 100,
        ptDescription: '还需 ' + val.remain.toString() + 's',
      })
    })
    return result
  }
  const getConnectionButtons = () => {
    const list = [
      { key: 'githubRepo', icon: (<LogoGithubIcon />), label: 'Github' },
      { key: 'changelogDoc', icon: (<SystemLogIcon />), label: '更新日志' },
    ] as const
    return list.map(item => (
      <div key={item.key} className="flex gap-1">
        <Button
          size="large"
          icon={item.icon}
          onClick={() => window.open(AppConstants[item.key])}
          style={{
            fontFamily: 'unset',
            fontSize: '1.25rem',
            paddingLeft: 'auto',
            paddingRight: 'auto',
            width: '12.5rem',
          }}
        >{item.label}</Button>
        <Button
          size="large"
          icon={<CopyIcon />}
          onClick={() => {
            copyToClipboard(AppConstants[item.key])
            showToast('已复制链接')
          }}
        />
      </div>
    ))
  }
  const resolveLog = useCallback(() => {
    const knockouts = frontlineLog.map(log => log.knockouts).flat()
    const deaths = frontlineLog.map(log => log.deaths).flat()
    let kd = 0
    if (deaths.length) {
      kd = Math.floor(knockouts.length / deaths.length * 100) / 100
    }
    const knockoutEachMatch = frontlineLog.length ? Math.floor(knockouts.length / frontlineLog.length * 100) / 100 : 0
    const deathEachMatch = frontlineLog.length ? Math.floor(deaths.length / frontlineLog.length * 100) / 100 : 0

    const knockoutSkillMap : Record<string, number> = {}
    knockouts.forEach(knockout => {
      if (!knockoutSkillMap[knockout.lasthitActionName]) knockoutSkillMap[knockout.lasthitActionName] = 0
      knockoutSkillMap[knockout.lasthitActionName]++
    })
    const knockoutDataForPie = Object.entries(knockoutSkillMap).map(([skill, count]) => {
      return { amount: count, label: skill }
    })
    const deathSkillMap : Record<string, number> = {}
    deaths.forEach(death => {
      if (!deathSkillMap[death.lasthitActionName]) deathSkillMap[death.lasthitActionName] = 0
      deathSkillMap[death.lasthitActionName]++
    })
    const deathDataForPie = Object.entries(deathSkillMap).map(([skill, count]) => {
      return { amount: count, label: skill }
    })

    return {
      knockouts, deaths, kd,
      knockoutEachMatch, deathEachMatch,
      knockoutDataForPie, deathDataForPie,
    }
  },[
    frontlineLog,
  ])
  const logInfo = resolveLog()

  const handleCopySituation = () => {
    const situation = {
      hw: getGcPoint(GrandCompany.maelstrom),
      ss: getGcPoint(GrandCompany.twinadder),
      hh: getGcPoint(GrandCompany.immoflame),
    }
    const situationText = `【剩余点分】黑涡${situation.hw} / 双蛇${situation.ss} / 恒辉${situation.hh}`
    copyToClipboard(situationText)
    showToast('已复制！')
  }
  const handleCopyStatisticsImage = async () => {
    /*
    const screenshotArea = document.getElementById('statistics-tab')
    if (!screenshotArea) {
      showToast('页面未加载，请等待……'); return
    }
    const err = await captureAndCopy(screenshotArea)
    if (err) showToast(`复制失败：${err}`)
    else showToast('已复制！')
    */
  }

  useEffect(() => {
    checkAppUpdate()
    const config = loadConfig()
    setAppConfig(config)

    if (config.auto_collapse_when_launch) {
      setCollapsed(true)
    }

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
  useEffect(() => {
    if (typeof window === 'undefined') return
    initialize(window)

    addOverlayListener('ChangeZone', zoneChangeCallback)
    addOverlayListener('ChangePrimaryPlayer', primaryPlayerChangeCallback)
    addOverlayListener('LogLine', loglineCallback)

    startOverlayEvents()

    if (process.env.NODE_ENV === 'development') {
      ;(window as any).test_zone = (zone: number) => {
        console.log('zone:', GameZonesMap.get(zone))
      }
      ;(window as any).gen_demo_data = () => {
        const min = 60 * 1000
        setFrontlineLog([
          {
            zone: Frontline.seize,
            result: 'win',
            start_time: Date.now(),
            knockouts: [
              genDeath('其他玩家01', '星遁天诛'),
              genDeath('其他玩家02', '星遁天诛'),
              genDeath('其他玩家03', '星遁天诛'),
              genDeath('其他玩家04', '星遁天诛'),
              genDeath('其他玩家05', '冰晶乱流之术'),
            ],
            deaths: [
              genDeath('其他玩家01', '魔弹射手'),
              genDeath('其他玩家02', '百万核爆'),
              genDeath('其他玩家03', '天穹破碎'),
            ],
          },
          {
            zone: Frontline.shatter,
            result: 'lose',
            start_time: Date.now() + min*15,
            knockouts: [
              genDeath('其他玩家01', '星遁天诛'),
              genDeath('其他玩家02', '星遁天诛'),
            ],
            deaths: [
              genDeath('其他玩家03', '天穹破碎'),
            ],
          },
          {
            zone: CrystalConflict.palaistra,
            result: 'win',
            start_time: Date.now() + min*31,
            knockouts: [
              genDeath('其他玩家01', '星遁天诛'),
            ],
            deaths: [
              genDeath('其他玩家03', '天穹破碎'),
              genDeath('其他玩家05', '天穹破碎'),
            ],
          },
          {
            zone: CrystalConflict.volcanic,
            result: 'lose',
            start_time: Date.now() + min*48,
            knockouts: [
              genDeath('其他玩家01', '猛击'),
              genDeath('其他玩家02', '冰晶乱流之术'),
              genDeath('其他玩家03', '冰晶乱流之术'),
              genDeath('其他玩家04', '猛击'),
              genDeath('其他玩家05', '是生灭法'),
              genDeath('其他玩家06', '是生灭法'),
              genDeath('其他玩家05', '是生灭法'),
              genDeath('其他玩家06', '是生灭法'),
              genDeath('其他玩家05', '是生灭法'),
              genDeath('其他玩家06', '是生灭法'),
            ],
            deaths: [
              genDeath('其他玩家03', '夜昏'),
              genDeath('其他玩家03', '夜昏'),
              genDeath('其他玩家03', '夜昏'),
              genDeath('其他玩家03', '夜昏'),
              genDeath('其他玩家03', '夜昏'),
            ],
          },
          {
            zone: CrystalConflict.castletown,
            result: 'win',
            start_time: Date.now() + min*31,
            knockouts: [
              genDeath('其他玩家01', '星遁天诛'),
            ],
            deaths: [
              genDeath('其他玩家03', '天穹破碎'),
              genDeath('其他玩家05', '天穹破碎'),
            ],
          },
        ])

        function genDeath(p: string, action: string) {
          return {
            happenTime: 0,
            victimName: p,
            perpetratorName: p,
            lasthitActionName: action,
          }
        }
      }
    }

    return () => {
      removeOverlayListener('ChangeZone', zoneChangeCallback)
      removeOverlayListener('ChangePrimaryPlayer', primaryPlayerChangeCallback)
      removeOverlayListener('LogLine', loglineCallback)
    }
  }, [
    zoneChangeCallback, loglineCallback, primaryPlayerChangeCallback,
    initialize, addOverlayListener, removeOverlayListener, startOverlayEvents,
  ])

  const lockSituationMsg = () => {
    if (!onConflict && !zone){
      return '还未进入对战'
    } else if (!onConflict) {
      return '正在等待战斗开始'
    } else if (zone === Frontline.shatter || zone === Frontline.secure) {
      return '暂不支持解析 ' + getFrontlineNames(zone)[1] + ' 的战况数据'
    } else if (zone === RivalWings.hiddengorge) {
      return '暂不支持解析 烈羽争锋 的战况数据'
    } else if (Object.values(CrystalConflict).includes(zone as CrystalConflict)) {
      return '暂不支持解析 水晶冲突 的战况数据'
    }
    return false
  }

  return (
    <div
      className="flex flex-col h-full items-center justify-items-center gap-2 p-1 bg-transparent"
      style={{
        width: 'calc(100% - 8px)',
      }}
    >
      {/* 顶部操作栏 */}
      <div className="w-full flex justify-between items-center p-1 px-2 rounded"
        style={{
          backgroundColor: collapsed ? 'transparent' : 'rgb(0 0 0 / 0.3)',
        }}
      >
        <div className="flex gap-2">
          {!collapsed && availableTabs.map((tab) => (
            <div
              key={tab}
              onClick={() => setActiveTab(tab)}
              data-active={activeTab === tab}
              className="text-[1.25rem] px-2 py-1 border border-transparent rounded text-white cursor-pointer text-shadow
              hover:bg-gray-700 data-[active=true]:bg-white/30 transition-colors duration-200"
            >
              { tabPages[tab] }
            </div>
          ))}
        </div>
        <div
          className="flex gap-2"
        >
          {!collapsed && (
            <div
              className="text-[1.25rem] px-2 py-1 border border-transparent rounded text-white hover:bg-gray-700 cursor-pointer text-shadow transition-colors duration-200"
              onClick={() => window.open('./config')}
            >
              <IconFont name="setting-1" />
            </div>
          )}
          <div
            data-active={collapsed}
            className="text-[1.25rem] px-2 py-1 border border-transparent rounded text-white cursor-pointer text-shadow
            hover:bg-gray-700 data-[active=true]:bg-white/30 transition-colors duration-200"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <IconFont name="chevron-down" /> : <IconFont name="chevron-up" />}
          </div>
        </div>
      </div>

      {/* 主要内容区 */}
      {!collapsed && (
        <main className="w-full flex flex-1 flex-col gap-1 items-center overflow-y-auto">
          {/* 战况 */}
          {activeTab === 'situation' && (
            <div className={PageStyle.panel}>
              {
                lockSituationMsg() && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center backdrop-blur-sm bg-black/30">
                    <div className="text-center text-white">
                      <div className="text-4xl mb-2">
                        ⛓️🔒⛓️
                      </div>
                      <div className="text-2xl font-semibold">
                        { lockSituationMsg() }
                      </div>
                    </div>
                  </div>
                )
              }
              <div className={PageStyle.title}>剩余点分</div>
              <div className="w-full grid grid-cols-3 gap-2">
                {
                  Object.values(GrandCompany).map(company => (
                    <GcCard key={company} gc={company} me={gc === company} floatPoints={getGcPoint(company)} />
                  ))
                }
              </div>
              <div className={PageStyle.title}>当前据点</div>
              {
                (zone === Frontline.shatter || zone === Frontline.secure) && (
                  <div className="w-full text-[1.25rem] self-baseline text-white px-1 py-0.5 rounded bg-gray-400/90 border border-black/50">
                    暂不支持解析{ getFrontlineNames(zone)[1] }的当前据点数据。
                  </div>
                )
              }
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
                        specifyColor={val.specifyColor}
                      />
                    )
                  })
                }
              </div>
              <div className="fixed bottom-4 right-8 z-10">
                {
                  !appConfig.hide_situation_copy_btn
                  && <Button
                    size="large"
                    shape="circle"
                    theme="success"
                    icon={<CopyIcon />}
                    onClick={handleCopySituation}
                  />
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
                (!!getKnockouts().length && (!onConflict && !zone)) && (
                  <AlertCard msg="此处展示的是上一场的记录，下次进入对战时会被清除。" />
                )
              }
              {
                getKnockouts().map((death, deathIndex) => (
                  <div key={'knockout' + deathIndex} className={PageStyle.title}>
                    <div>{formatTime(death.happenTime)}　</div>
                    <div className="flex flex-wrap flex-1">
                      <span>使用</span>
                      {
                        death.summonedBy && (
                          <>
                            <span className="text-orange-700">{death.perpetratorName}</span>
                            <span>发动的</span>
                          </>
                        )
                      }
                      <span className="text-orange-700">{death.lasthitActionName}</span>
                      <span>击倒了</span>
                      <span className="text-orange-700">{death.victimName}</span>
                    </div>
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
                (!!getDeaths().length && (!onConflict && !zone)) && (
                  <AlertCard msg="此处展示的是上一场的记录，下次进入对战时会被清除。" />
                )
              }
              {
                getDeaths().map((death, deathIndex) => (
                  <div key={'death' + deathIndex} className={PageStyle.title}>
                    <div>{formatTime(death.happenTime)}　</div>
                    <div className="flex flex-wrap flex-1">
                      <span>被</span>
                      <span className="text-orange-700">{death.summonedBy || death.perpetratorName}</span>
                      {
                        death.summonedBy && (
                          <>
                            <span>召唤的</span>
                            <span className="text-orange-700">{death.perpetratorName}</span>
                          </>
                        )
                      }
                      <span>用</span>
                      <span className="text-orange-700">{death.lasthitActionName}</span>
                      <span>击倒了</span>
                    </div>
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
                (!!goodboys.length && (!onConflict && !zone)) && (
                  <AlertCard msg="此处展示的是上一场的记录，下次进入对战时会被清除。" />
                )
              }
              {
                goodboys.map((log, logIndex) => (
                  <div key={'goodboy' + logIndex} className={PageStyle.title}>
                    <div>{formatTime(log.happenTime)}　</div>
                    <div className="flex flex-wrap flex-1">
                      <span className="text-orange-700">{log.perpetratorName}</span>
                      <span>对你发动了</span>
                      <span className="text-orange-700">{log.actionName}</span>
                      {
                        !!log.actionDamage && (
                          <>
                            <span>，回复了</span>
                            <span className="text-orange-700">{log.actionDamage}</span>
                            <span>体力</span>
                          </>
                        )
                      }
                    </div>
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
                (!!badboys.length && (!onConflict && !zone)) && (
                  <AlertCard msg="此处展示的是上一场的记录，下次进入对战时会被清除。" />
                )
              }
              {
                badboys.map((log, logIndex) => (
                  <div key={'badboy' + logIndex} className={PageStyle.title}>
                    <div>{formatTime(log.happenTime)}　</div>
                    <div className="flex flex-wrap flex-1">
                      <span className="text-orange-700">{log.perpetratorName}</span>
                      <span>对你发动了</span>
                      <span className="text-orange-700">{log.actionName}</span>
                      {
                        !!log.actionDamage && (
                          <>
                            <span>，造成了</span>
                            <span className="text-orange-700">{log.actionDamage}</span>
                            <span>伤害</span>
                          </>
                        )
                      }
                    </div>
                  </div>
                ))
              }
            </div>
          )}
          {/* 统计 */}
          {activeTab === 'statistics' && (
            <div id="statistics-tab" className={PageStyle.panel}>
              {
                !frontlineLog.length && (
                  <AlertCard msg="暂无记录。请完成至少一场纷争前线后再来查看。" />
                )
              }
              <div className={PageStyle.title}>
                参战统计
                <div className="ml-auto mr-5 flex items-center gap-1">
                  <div className="w-[4.5rem] text-right">K</div>
                  <div className="w-[4.5rem] text-right">D</div>
                </div>
              </div>
              {
                frontlineLog.length ? frontlineLog.map((log, logIndex) => (
                  <FlogCard key={logIndex} frontlineLog={log} />
                )) : <div className={PageStyle.content}>暂无数据</div>
              }
              <div className={PageStyle.title}>
                K/D统计
              </div>
              <div className={PageStyle.content}>
                <div className="w-full grid grid-cols-3">
                  <div>参战<span className="text-orange-700">{frontlineLog.length}</span>场</div>
                  <div>击倒数 <span className="text-orange-700">{logInfo.knockouts.length}</span></div>
                  <div>死亡数 <span className="text-orange-700">{logInfo.deaths.length}</span></div>
                  <div>K/D <span className="text-orange-700">{logInfo.kd}</span></div>
                  <div>场均击倒 <span className="text-orange-700">{logInfo.knockoutEachMatch}</span></div>
                  <div>场均死亡 <span className="text-orange-700">{logInfo.deathEachMatch}</span></div>
                </div>
              </div>
              <div className={PageStyle.title}>
                击倒统计
              </div>
              <div className={PageStyle.content}>
                {
                  logInfo.knockoutDataForPie.length
                    ? <PieChart data={logInfo.knockoutDataForPie} />
                    : '暂无数据'
                }
              </div>
              <div className={PageStyle.title}>
                死亡统计
              </div>
              <div className={PageStyle.content}>
                {
                  logInfo.deathDataForPie.length
                    ? <PieChart data={logInfo.deathDataForPie} />
                    : '暂无数据'
                }
              </div>
              <div className="fixed bottom-4 right-8 hidden">
                <Button
                  size="large"
                  shape="circle"
                  theme="success"
                  icon={<ShareIcon />}
                  onClick={handleCopyStatisticsImage}
                />
              </div>
            </div>
          )}
          {/* 日历 */}
          {activeTab === 'calendar' && (
            <CalendarTab />
          )}
          {/* 关于 */}
          {activeTab === 'about' && (
            <div className={PageStyle.panel}>
              <div className={PageStyle.title}>
                <span>当前版本：</span>
                <span className="text-orange-700 font-bold">{process.env.APP_VERSION}</span>
              </div>
              <div
                className={PageStyle.content}
                style={{
                  flexDirection: 'column',
                  alignItems: 'start',
                  paddingBottom: '0.375rem',
                }}
              >
                {
                  !!appNewVersion ? (
                    <>
                      <div>检测到新版本：{appNewVersion}</div>
                      <Button
                        size="large"
                        theme="success"
                        loading={checkingAppUpdate}
                        onClick={handleUpdateApp}
                        style={{
                          fontFamily: 'unset',
                          fontSize: '1.25rem',
                          paddingLeft: '2.25rem',
                          paddingRight: '2.25rem',
                        }}
                      >
                        点此更新
                      </Button>
                      <div className="text-red-600">※当前数据和已记录的场次统计将会丢失。</div>
                    </>
                  ) : (
                    <>
                      <div>已是最新版本</div>
                      <Button
                        size="large"
                        theme="primary"
                        loading={checkingAppUpdate}
                        onClick={handleCheckAppUpdate}
                        style={{
                          fontFamily: 'unset',
                          fontSize: '1.25rem',
                          paddingLeft: '2.25rem',
                          paddingRight: '2.25rem',
                        }}
                      >
                        检查更新
                      </Button>
                    </>
                  )
                }
              </div>
              <div className={PageStyle.title}>保持联系</div>
              <div className={PageStyle.content}>
                <div>点击左侧按钮来打开子窗口访问，或是点击右侧按钮复制链接。</div>
                <div className="flex flex-col gap-1">
                  { getConnectionButtons() }
                </div>
              </div>
            </div>
          )}
        </main>
      )}
    </div>
  );
}
