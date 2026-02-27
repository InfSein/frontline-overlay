import {
  addOverlayListener,
  removeOverlayListener,
} from '@cactbot/resources/overlay_plugin_api'
import type { EventMap } from '@cactbot/types/event'
import { useStore } from '@/stores'
import { CrystalConflict, Frontline, GameZonesMap, GrandCompany, RivalWings, type PvPBattle } from '@/types'
import type {
  PointInfo,
  StaticPointInfo,
  InitialPointInfo,
  PrePointInfo,
  LasthitInfo,
  SelfActionLog,
  DeathInfo,
  FrontlineLog,
  FrontlineResult,
  IarLog,
} from '@/types/combat'
import type { OverlayCombatant } from '@/types/overlay'
import {
  getCombatants
} from '@/tools/overlay'
import {
  loadCombatLogs,
  saveCombatLogs,
} from '@/tools/combat-log'
import { deepCopy, getActionDamageFromLogLine, getFrontlineNames, getGrandCompanyColor, getGrandCompanyName, getJobInfo, getSecurePointIncrease } from '@/tools'
import type { PointConfigNaadam, PointConfigSecure, PointConfigSeize } from '@/types/point'
import { ImportantActions } from '@/constants'

// Global variables
const appVar = reactive({
  inited: false,
  collapsed: false,
})
const combatData = reactive({
  // * 基本信息
  onConflict: false,
  playerId: '',
  playerName: '',
  gc: '' as GrandCompany | "",
  zone: '' as PvPBattle | "",
  ptMax: 0,

  // * maps
  gcFp: {
    [GrandCompany.maelstrom]: 0,
    [GrandCompany.twinadder]: 0,
    [GrandCompany.immoflame]: 0,
  },
  playerMapName: { 'E0000000': '(场地/dot)' } as Record<string, string>,
  playerMapJob: {} as Record<string, number>,
  playerMapFull: {} as Record<string, OverlayCombatant>,
  pointMap: {} as Record<string, PointInfo | StaticPointInfo | InitialPointInfo>,
  prePoints: [] as PrePointInfo[],
  /**
   * 召唤物表
   * @key 召唤物ID
   * @value 召唤者ID
   */
  summonMap: {} as Record<string, string>,
  /**
   * 上次受击表
   * @key 施害者ID+受害者ID
   * @value 上次受击信息
   */
  playerLasthitMap: {} as Record<string, LasthitInfo>,

  // * logs
  allPlayersDeaths: [] as DeathInfo[],
  goodboys: [] as SelfActionLog[],
  badboys: [] as SelfActionLog[],
  mygoods: [] as SelfActionLog[],
  mybads: [] as SelfActionLog[],
  iarLog: [] as IarLog[],
  frontlineLog: [] as FrontlineLog[],
})
const insiderData = reactive({
  pidIndex: 1,
  currFrontlineResult: undefined as FrontlineResult | undefined,
  currFrontlineStartTime: 0,
  combatantWatcher: null as number | null,
})

const useCombatParser = () => {
  const isDev = import.meta.env.DEV
  const store = useStore()

  const parseGc = (gc_name: string) => {
    if (gc_name === '黑涡团') return GrandCompany.maelstrom
    else if (gc_name === '双蛇党') return GrandCompany.twinadder
    else if (gc_name === '恒辉队') return GrandCompany.immoflame
    throw new Error('parseGc: unknown gc:' + gc_name)
  }
  const getCurrPointCount = () => {
    return combatData.prePoints.length + Object.keys(combatData.pointMap).length
  }
  const getPlayerJob = async () => {
    if (combatData.playerMapJob[combatData.playerId]) {
      return combatData.playerMapJob[combatData.playerId]
    }
    const combatants = await getCombatants()
    const player = combatants.find(
      combatant => combatant.ID.toString(16).toUpperCase() === combatData.playerId
    )
    if (!player) {
      return
    }
    return player.Job
  }
  const addSelfActionLog = (list: SelfActionLog[], log: SelfActionLog) => {
    const recentLogs = list.slice(-5)

    const duplicateIndex = recentLogs.findIndex(lastLog =>
      lastLog.targetName === log.targetName &&
      lastLog.actionName === log.actionName &&
      Math.abs(lastLog.happenTime - log.happenTime) <= 4000
    )

    if (duplicateIndex !== -1) {
      const actualIndex = list.length - recentLogs.length + duplicateIndex
      list.splice(actualIndex, 1)
    }

    list.push(log)
  }
  const addIarLog = (list: IarLog[], log: IarLog, maxGapTime = 2000) => {
    const recentLogs = list.slice(-5)

    const duplicateIndex = recentLogs.findIndex(lastLog =>
      lastLog.actionName === log.actionName &&
      Math.abs(lastLog.happenTime - log.happenTime) <= maxGapTime
    )

    if (duplicateIndex !== -1) {
      const actualIndex = list.length - recentLogs.length + duplicateIndex
      const oldData = list[actualIndex]!
      list[actualIndex] = {
        ...oldData,
        actionTargets: [...new Set([...oldData.actionTargets, ...log.actionTargets])],
        totalDamage: oldData.totalDamage + log.totalDamage,
        totalHeal: oldData.totalHeal + log.totalHeal,
      }
    } else {
      list.push(log)
    }
  }

  const activatePoint = (key: string, owner: GrandCompany, ptLv: string, total: number, drop: number) => {
    if (
      combatData.pointMap[key]
      && combatData.pointMap[key].type !== 'static'
      && combatData.pointMap[key].type !== 'initial'
    ) {
      combatData.pointMap[key].owner = owner
      combatData.pointMap[key].resume()
      return
    }
    if (combatData.pointMap[key] && combatData.pointMap[key].type !== 'static') {
      combatData.pointMap[key].cancel()
    }

    let timer: number | null = null

    const cleanup = () => {
      if (timer) clearInterval(timer)
      delete combatData.pointMap[key]
    }

    const point: PointInfo = reactive({
      dropSpeed: drop,
      ptRemain: total,
      ptTotal: total,
      owner: owner,
      ptLv: ptLv,
      paused: false as boolean,
      pause() {
        this.paused = true
      },
      resume() {
        this.paused = false
      },
      cancel() {
        cleanup()
      }
    })

    const tick = () => {
      if (point.paused) return
      point.ptRemain -= drop
      if (point.ptRemain <= 0) {
        point.ptRemain = 0
        cleanup()
      }
    }

    timer = window.setInterval(tick, 3000)
    combatData.pointMap[key] = point
  }
  const createInitialPoint = (key: string, ptLv: string, total: number, countdown?: number) => {
    if (combatData.pointMap[key] && combatData.pointMap[key].type !== 'static') {
      combatData.pointMap[key].cancel()
    }

    let timer: number | null = null

    const cleanup = () => {
      if (timer) clearInterval(timer)
      delete combatData.pointMap[key]
    }

    const point: InitialPointInfo = reactive({
      type: 'initial',
      ptLv,
      ptTotal: total,

      time: countdown
        ? {
            remain: countdown,
            total: countdown
          }
        : undefined,

      cancel() {
        cleanup()
      }
    })

    if (countdown) {
      timer = window.setInterval(() => {
        if (!point.time) return

        point.time.remain -= 1

        if (point.time.remain <= 0) {
          point.time.remain = 0
          cleanup()
        }
      }, 1000)
    }

    combatData.pointMap[key] = point
  }
  const createPrePoint = (key: string, total: number) => {
    let timer: number | null = null

    const cleanup = (self: PrePointInfo) => {
      if (timer) clearInterval(timer)
      const index = combatData.prePoints.findIndex(item => item.key === self.key)
      if (index !== -1) {
        combatData.prePoints.splice(index, 1)
      }
    }

    const point: PrePointInfo = reactive({
      key,
      tRemain: total,
      tTotal: total,
      cancel() {
        cleanup(point)
      }
    })

    timer = setInterval(() => {
      point.tRemain -= 1

      if (point.tRemain <= 0) {
        point.tRemain = 0
        cleanup(point)
      }
    }, 1000)

    return point
  }

  const getGcPoint = (gc: GrandCompany) => {
    if (
      combatData.zone === Frontline.seize
      || combatData.zone === Frontline.naadam
      || combatData.zone === Frontline.triumph
    ) {
      const arr = Object.values(combatData.pointMap)
        .filter(val => val.type !== 'static' && val.type !== 'initial' && !val.paused && val.owner === gc)
        .map(val => (val as PointInfo).ptRemain)
      if (!arr.length) return 0
      return arr.reduce((prev, cur) => prev + cur)
    } else if (combatData.zone === Frontline.secure) {
      return '-'
    } else {
      return combatData.gcFp[gc]
    }
  }
  const getGcIncreaseSpeed = (gc: GrandCompany) => {
    if (
      combatData.zone === Frontline.seize
      || combatData.zone === Frontline.naadam
      || combatData.zone === Frontline.triumph
    ) {
      const arr = Object.values(combatData.pointMap)
        .filter(val => val.type !== 'static' && val.type !== 'initial' && val.owner === gc)
        .map(val => (val as PointInfo).dropSpeed)
      if (!arr.length) return 0
      return arr.reduce((prev, cur) => prev + cur)
    } else if (combatData.zone === Frontline.secure) {
      const arr = Object.values(combatData.pointMap)
        .filter(val => val.type === 'static' && val.owner === gc)
      return getSecurePointIncrease(arr.length)
    } else {
      return 0
    }
  }

  const handlePrimaryPlayerChange: EventMap['ChangePrimaryPlayer'] = (data) => {
    combatData.playerId = data.charID.toString(16).toUpperCase()
    combatData.playerName = data.charName
  }
  const handleZoneChange: EventMap['ChangeZone'] = async (data) => {
    const conflictZone = GameZonesMap.get(data.zoneID)
    if (conflictZone) {
      combatData.zone = conflictZone
    } else {
      if (combatData.zone) {
        let result: FrontlineResult | undefined = undefined
        if (
          insiderData.currFrontlineResult
          && (
            Object.values(CrystalConflict).includes(combatData.zone as CrystalConflict)
            || combatData.zone === RivalWings.hiddengorge
          )
        ) {
          result = insiderData.currFrontlineResult
          insiderData.currFrontlineResult = undefined
        }
        const { zone } = combatData
        const job = await getPlayerJob()
        const log = deepCopy<FrontlineLog>({
          zone: zone,
          job,
          result,
          start_time: insiderData.currFrontlineStartTime,
          knockouts: deepCopy(knockouts.value),
          deaths: deepCopy(deaths.value),
        })
        combatData.frontlineLog.push(log)
        if (isDev) {
          console.log(JSON.stringify(combatData.playerMapFull))
        }
        if (store.appConfig.auto_collapse_when_leave_battlefield) {
          appVar.collapsed = true
        }
      }
      combatData.onConflict = false; combatData.zone = ''; combatData.gc = ''
      combatData.gcFp.maelstrom = 0; combatData.gcFp.twinadder = 0; combatData.gcFp.immoflame = 0
      Object.entries(combatData.pointMap).forEach(([key, val]) => {
        if (val.type === 'initial' || val.type === 'static') delete combatData.pointMap[key]
        else val.cancel()
      })
      combatData.prePoints.length = 0
      combatData.playerMapName = {
        'E0000000': '(场地/dot)',
      }
      combatData.playerMapJob = {}
      combatData.playerMapFull = {}
      if (isDev && Object.values(combatData.summonMap).length) {
        console.log('summon map:', deepCopy(combatData.summonMap))
      }
      combatData.summonMap = {}; combatData.playerLasthitMap = {}
      if (isDev) {
        console.log('[Zone] ', data.zoneID, ' / ', data.zoneName)
        if (data.zoneID === 250) { // 狼狱
          combatData.onConflict = true
        }
      }
    }
  }
  const handleLogLine: EventMap['LogLine'] = (data) => {
    const msgType = data.line[0] // "00"
    const msgChannel = data.line[2] // "0839"
    const msg = data.line[4] // "冰封的石文A1启动了，冰块变得脆弱了！"

    // 处理战斗日志
    if (combatData.onConflict || combatData.zone) { // * 为了减轻负载，仅在纷争前线期间解析战斗
      parseCombatLog()
    }

    // 开始处理刷点文本日志
    // 首先过滤一些无关频道
    const validChannels = [
      '0039', '0839', '0840', '083E'
    ]
    if (!msgChannel || msgType !== '00' || !validChannels.includes(msgChannel)) return
    if (!msg) return

    // 处理战斗开始信息
    const matchGc = msg.match(/以(黑涡团|双蛇党|恒辉队)的身份参加了纷争前线！/)
    if (
      matchGc
      || msg === '战斗即将开始！'
      || (combatData.zone === RivalWings.hiddengorge && msg === "进入了对战区域。 当前职业为可以进行对战的特职时， 状态参数和热键栏会被切换为对战专用版。")
    ) {
      if (matchGc && matchGc[1]) {
        combatData.gc = parseGc(matchGc[1])
      }
      combatData.onConflict = true
      Object.keys(combatData.playerLasthitMap).forEach(key => delete combatData.playerLasthitMap[key])
      combatData.allPlayersDeaths.length = 0
      combatData.goodboys.length = 0
      combatData.badboys.length = 0
      combatData.mygoods.length = 0
      combatData.mybads.length = 0
      combatData.iarLog.length = 0

      if (combatData.zone === Frontline.seize) combatData.ptMax = 4
      else if (combatData.zone === Frontline.naadam) combatData.ptMax = 6
      else combatData.ptMax = 0

      insiderData.currFrontlineStartTime = Date.now()
      if (store.appConfig.auto_expand_when_enter_battlefield) {
        appVar.collapsed = false
      }
      return
    }

    // 战斗没有开始，那么不处理文本日志
    if (!combatData.onConflict && !combatData.zone) return

    // 处理各种刷点文本日志
    if (combatData.zone === Frontline.seize) {
      parsePointLog({
        mode: 'seize',
        neutralMatch: {
          match: /(S|A|B)级的亚拉戈石文(.*?)开始活动了！/, indexes: [2, 1],
        },
        conquerMatch: {
          match: /(黑涡团|双蛇党|恒辉队)占领了(S|A|B)级的亚拉戈石文(.*?)！/, indexes: [3, 2, 1],
        },
        pauseMatch: {
          match: /(S|A|B)级的亚拉戈石文(.*?)变为中立状态！/, indexes: [2, 1],
        },
        cleanMatch: {
          match: /(S|A|B)级的亚拉戈石文(.*?)的情报已枯竭！/, indexes: [2, 1],
        },
        getFp: (ptLv: string) => {
          if (ptLv === 'S') return [160, 4]
          else if (ptLv === 'A') return [120, 3]
          else if (ptLv === 'B') return [80, 2]
          throw new Error('[gcFp] wtf point is? ' + ptLv)
        },
        ptMax: {
          initial: 4,
          changeEvents: [
            { msg: '距离"尘封秘岩（争夺战）"结束还有10分钟。', changeTo: 3 },
          ]
        }
      })
    } else if (combatData.zone === Frontline.naadam) {
      parsePointLog({
        mode: 'naadam',
        initialMatch: {
          match: /30秒后(S|A|B)级无垢的大地(.*?)即将进入可契约状态。/, indexes: [2, 1],
        },
        neutralMatch: {
          match: /(S|A|B)级无垢的大地(.*?)进入了可契约状态！/, indexes: [2, 1],
        },
        conquerMatch: {
          match: /(黑涡团|双蛇党|恒辉队)与(S|A|B)级无垢的大地(.*?)签订了契约。/, indexes: [3, 2, 1],
        },
        cleanMatch: {
          match: /无垢的大地(.*?)已失效。/, indexes: [1],
        },
        getFp: (ptLv: string) => {
          if (ptLv === 'S') return [200, 20]
          else if (ptLv === 'A') return [100, 10]
          else if (ptLv === 'B') return [50, 5]
          throw new Error('[gcFp] wtf point is? ' + ptLv)
        },
      })
    } else if (combatData.zone === Frontline.triumph) {
      parsePointLog({
        mode: 'naadam',
        initialMatch: {
          match: /30秒后(S|A|B)级的战略目标点(.*?)将变为可控制状态……/, indexes: [2, 1],
        },
        neutralMatch: {
          match: /(S|A|B)级的战略目标点(.*?)已变为可控制状态！/, indexes: [2, 1],
        },
        conquerMatch: {
          match: /(黑涡团|双蛇党|恒辉队)控制了(S|A|B)级的战略目标点(.*?)！/, indexes: [3, 2, 1],
        },
        cleanMatch: {
          match: /战略目标点(.*?)已失效。/, indexes: [1],
        },
        getFp: (ptLv: string) => {
          if (ptLv === 'S') return [200, 20]
          else if (ptLv === 'A') return [100, 10]
          else if (ptLv === 'B') return [50, 5]
          throw new Error('[gcFp] wtf point is? ' + ptLv)
        },
      })
    } else if (combatData.zone === Frontline.secure) {
      parsePointLog({
        mode: 'secure',
        conquerMatch: {
          match: /(黑涡团|双蛇党|恒辉队)占领了(.*?)！/, indexes: [2, NaN, 1],
        },
        pauseMatch: {
          match: /(.*?)恢复成了中立状态！/, indexes: [1],
        },
      })
    }

    // 处理结算信息，尝试获取比赛结果
    if (Object.values(Frontline).includes(combatData.zone as Frontline)) {

    }
    else if (combatData.zone === RivalWings.hiddengorge) {
      // 隐塞
      const matchRewardSeriesExp = msg.match(/获得了([\d,]+)点系列赛经验值。/)
      if (matchRewardSeriesExp && matchRewardSeriesExp[1]) {
        if (matchRewardSeriesExp[1] === '1,250') {
          insiderData.currFrontlineResult = 'win'
        } else if (matchRewardSeriesExp[1] === '750') {
          insiderData.currFrontlineResult = 'lose'
        }
      }
    }
    else {
      // 55
      const matchRewardSeriesExp = msg.match(/获得了(\d+)点系列赛经验值。/)
      if (matchRewardSeriesExp && matchRewardSeriesExp[1]) {
        if (matchRewardSeriesExp[1] === '900') {
          insiderData.currFrontlineResult = 'win'
        } else if (matchRewardSeriesExp[1] === '700') {
          insiderData.currFrontlineResult = 'lose'
        }
      }
    }

    function parseCombatLog() {
      if (msgType === '03') { // 添加战斗成员
        // 03|2025-07-21T19:50:15.3580000+08:00|100F9FCA|西风|18|64|0000|415|MoDuNa|0|0|54000|55500|10000|10000|||241.34|135.04|-7.08|-2.09|af51ebeec28c5c27
        const charId = data.line[2]
        const charName = data.line[3]
        const charJob = data.line[4]
        if (charId) {
          if (charName) {
            combatData.playerMapName[charId] = charName
          }
          if (charJob && Number(charJob)) {
            combatData.playerMapJob[charId] = Number(charJob)
          }
        }
      } else if ((msgType === '21' || msgType === '22')) { // 发动技能
        // https://github.com/OverlayPlugin/cactbot/blob/main/docs/LogGuide.md#line-21-0x15-networkability
        // 22|2025-07-21T20:15:49.3900000+08:00|1058F1D5|浮|72DC|霰弹枪|40000002|木人|720003|17700000|0|0|0|0|0|0|0|0|0|0|0|0|0|0|75000|75000|10000|10000|||104.12|-4.71|2.31|3.14|57000|57000|10000|10000|||94.94|-13.42|2.31|-2.71|0007B835|1|2|00||01|72DC|72DC|0.100|0000|69f2e27a0f10b758
        const perpetratorId = data.line[2]
        const perpetratorName = data.line[3] || '???'
        const hitActionId = data.line[4]
        const hitActionName = data.line[5] || '???'
        const victimId = data.line[6]
        const victimName = data.line[7] || '???'

        const perpetratorJob = perpetratorId ? combatData.playerMapJob[perpetratorId] : undefined
        const victimJob = victimId ? combatData.playerMapJob[victimId] : undefined

        let isValidAction = data.line[8] !== '0'
        if (hitActionId === '72D3'/*默者的夜曲*/) {
          isValidAction = data.line[10] !== '0'
        }

        if (isValidAction && perpetratorId && victimId) {
          const summonerId = combatData.summonMap[perpetratorId]
          const { hit, instantDeath, damageType, damage, heal } = getActionDamageFromLogLine(data.line)

          if (
            isDev
            && (perpetratorId === combatData.playerId || victimId === combatData.playerId)
          ) {
            console.log(
              `[Action] ${perpetratorName}(${perpetratorId}) -> ${victimName}(${victimId}): ${hitActionName}(${hitActionId})`,
              '\nhit:', hit,
              '\tdamageType:', damageType,
              '\ndamage:', damage,
              '\nheal:', heal,
              '\ndetail:', data.rawLine,
            )
          }

          // 记录上次伤害表
          if (hit && (damageType === 'damage' || damageType === 'both')) {
            const specialActions = [
              '星遁天诛', '完人',
              '献身', '全力挥打', '绝空拳', '爆破箭', '胖胖之墙'
            ] // 可能不造成伤害就击杀的技能

            if (specialActions.includes(hitActionName) || damage > 0) {
              const key = `${perpetratorId}-${victimId}`
              combatData.playerLasthitMap[key] = {
                perpetratorName: perpetratorName,
                victimName: victimName,
                hitActionName: hitActionName,
                hitActionDamage: damage,
                hitActionInstantDeath: instantDeath,
              }
            }
          }
          if (hitActionId) {
            // 记录好人
            const goodActions = [
              '718A'/*卫护*/, '71A5'/*至黑之夜*/, 'A1E3'/*刚玉之心*/,
              'A8F7'/*疗愈*/, '7228'/*救疗*/, '722B'/*水流幕*/, '7230'/*鼓舞激励之策*/,
              '723B'/*吉星相位*/, '723F'/*吉星相位2*/, '7250'/*心关*/,
              'A8F2'/*勇气*/, '72D8'/*光阴神的礼赞凯歌*/, '72F7'/*闭式舞姿*/,
              '73E6'/*守护之光*/, '7344'/*命水*/,
            ]
            if (goodActions.includes(hitActionId) || goodActions.includes(hitActionName)) {
              if (victimId === combatData.playerId && perpetratorId !== combatData.playerId) {
                addSelfActionLog(combatData.goodboys, {
                  happenTime: Date.now(),
                  targetName: perpetratorName,
                  targetJob: perpetratorJob,
                  actionName: hitActionName,
                  actionDamage: heal,
                })
              } else if (victimId !== combatData.playerId && perpetratorId === combatData.playerId) {
                addSelfActionLog(combatData.mygoods, {
                  happenTime: Date.now(),
                  targetName: victimName,
                  targetJob: victimJob,
                  actionName: hitActionName,
                  actionDamage: heal,
                })
              }
            }
            // 记录坏人
            const badActions = [
              'A8ED'/*全力挥打*/, '7199'/*献身*/, '732D'/*陨石冲击*/,
              '72E7'/*魔弹射手*/, '72DF'/*空气锚*/,
              '72D3'/*默者的夜曲*/, 'A1FB'/*英雄的返场余音*/, '72D2'/*爆破箭*/,
              '72F8'/*行列舞*/
              // 'A226'/*昏沉*/,
            ]
            if (
              badActions.includes(hitActionId) || badActions.includes(hitActionName)
              || damage >= store.appConfig.badboy_threshold
            ) {
              if (victimId === combatData.playerId && perpetratorId !== combatData.playerId) {
                addSelfActionLog(combatData.badboys, {
                  happenTime: Date.now(),
                  targetName: perpetratorName,
                  targetJob: perpetratorJob,
                  actionName: hitActionName,
                  actionDamage: damage,
                  actionInstantDeath: instantDeath,
                })
              } else if (victimId !== combatData.playerId && perpetratorId === combatData.playerId) {
                addSelfActionLog(combatData.mybads, {
                  happenTime: Date.now(),
                  targetName: victimName,
                  targetJob: victimJob,
                  actionName: hitActionName,
                  actionDamage: damage,
                  actionInstantDeath: instantDeath,
                })
              }
            }
            // 记录行迹
            const importantActions = Object.keys(ImportantActions)
            if (
              importantActions.includes(hitActionName)
              && (perpetratorId === combatData.playerId || summonerId === combatData.playerId)
            ) {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const [m, maxGapTime] = ImportantActions[hitActionName]!
              const actionTargets = victimId !== combatData.playerId ? [victimName] : []
              addIarLog(combatData.iarLog, {
                happenTime: Date.now(),
                actionName: hitActionName,
                actionTargets,
                totalDamage: damage,
                totalHeal: heal,
              }, maxGapTime)
            }
          }
        }
      } else if (msgType === '25') { // Death
        // 25|2025-07-21T20:04:08.8860000+08:00|10582BA7|卷饼|1058F1D5|浮|d94e2430f7a262f2
        const victimId = data.line[2]
        const victimName = data.line[3] || '???'
        const perpetratorId = data.line[4]
        let perpetratorName = data.line[5]
        if (victimId && !victimId.startsWith('40')) { // 忽略场景物体被打倒的信息
          if (perpetratorId) {
            let summonerId: string | undefined, summonerName: string | undefined
            if (combatData.summonMap[perpetratorId]) {
              summonerId = combatData.summonMap[perpetratorId]
              if (combatData.playerMapName[summonerId]) {
                summonerName = combatData.playerMapName[summonerId]
              } else if (summonerId === combatData.playerId) {
                summonerName = combatData.playerName
              }
            }
            if (!perpetratorName) {
              perpetratorName = combatData.playerMapName[perpetratorId] || '???'
            }
            const lastHitAction = {
              name: combatData.playerLasthitMap[`${perpetratorId}-${victimId}`]?.hitActionName || '???',
              damage: combatData.playerLasthitMap[`${perpetratorId}-${victimId}`]?.hitActionDamage || 0,
              instantDeath: combatData.playerLasthitMap[`${perpetratorId}-${victimId}`]?.hitActionInstantDeath || false,
            }
            const lasthitActionName = combatData.playerLasthitMap[`${perpetratorId}-${victimId}`]?.hitActionName || '???'
            const instantDeathActions = [
              '星遁天诛', '完人',
            ]
            if (instantDeathActions.includes(lasthitActionName) && lastHitAction.damage <= 0) {
              lastHitAction.instantDeath = true
            }
            combatData.allPlayersDeaths.push({
              happenTime: Date.now(),
              victimName: victimName,
              perpetratorName: perpetratorName,
              victimJob: combatData.playerMapJob[victimId],
              perpetratorJob: combatData.playerMapJob[summonerId || perpetratorId],
              summonedBy: summonerName,
              lasthitActionName: lastHitAction.name,
              lasthitActionDamage: lastHitAction.damage,
              lasthitActionInstantDeath: lastHitAction.instantDeath,
            })
          }
        }
      } else if (msgType === '261' && data.line[2] === 'Add') { // Summon
        // 261|2025-07-21T20:19:36.6860000+08:00|Add|40007109|BNpcID|3951|BNpcNameID|E53|CastTargetID|E0000000|CurrentMP|10000|CurrentWorldID|65535|Heading|1.6445|Level|100|MaxHP|57000|MaxMP|10000|ModelStatus|3072|Name|象式浮空炮塔|NPCTargetID|E0000000|OwnerID|1058F1D5|PosX|95.1405|PosY|-7.4485|PosZ|2.3552|Radius|1.0000|Type|2|WorldID|65535|0ed50912a51e73d8
        const summonedId = data.line[3]
        const ownerId = data.line[29]
        if (
          summonedId && ownerId
          && (!ownerId.includes('.') && !ownerId.includes('-') && ownerId.length > 4)
        ) {
          combatData.summonMap[summonedId] = ownerId
        }
      }
    }
    function parsePointLog(conf: PointConfigSeize | PointConfigNaadam | PointConfigSecure) {
      if (!msg) return
      if (conf.mode === 'seize') {
        let matcher = conf.neutralMatch

        const matchNeutral = msg.match(matcher.match)
        if (matchNeutral) {
          const [ptIndex, ptLvIndex] = matcher.indexes
          const ptLv = matchNeutral[ptLvIndex!]
          const pt = matchNeutral[ptIndex!]
          if (!pt || !ptLv) return
          const [total] = conf.getFp(ptLv)
          createInitialPoint(pt, ptLv, total)
          return
        }

        matcher = conf.conquerMatch
        const matchConquer = msg.match(matcher.match)
        if (matchConquer) {
          const [ptIndex, ptLvIndex, ownerIndex] = matcher.indexes
          const pt = matchConquer[ptIndex!]
          const ptLv = matchConquer[ptLvIndex!]
          const owner = matchConquer[ownerIndex!]
          if (!pt || !ptLv || !owner) return
          const gc = parseGc(owner)
          const [total, drop] = conf.getFp(ptLv)
          activatePoint(pt, gc, ptLv, total, drop)
          return
        }

        matcher = conf.pauseMatch
        const matchPause = msg.match(matcher.match)
        if (matchPause) {
          const [ptIndex] = matcher.indexes
          const pt = matchPause[ptIndex!]
          if (!pt) return
          if (combatData.pointMap[pt] && combatData.pointMap[pt].type !== 'static' && combatData.pointMap[pt].type !== 'initial') {
            combatData.pointMap[pt].pause()
          }
          return
        }

        matcher = conf.cleanMatch
        const matchClean = msg.match(matcher.match)
        if (matchClean) {
          const [ptIndex] = matcher.indexes
          const pt = matchClean[ptIndex!]
          if (!pt) return
          if (combatData.pointMap[pt] && combatData.pointMap[pt].type !== 'static' && combatData.pointMap[pt].type !== 'initial') {
            combatData.pointMap[pt].cancel()
          }
          while (combatData.prePoints.length && getCurrPointCount() > combatData.ptMax) combatData.prePoints.pop()
          if (combatData.prePoints.length < combatData.ptMax) {
            const key = `seize-${Date.now()}-${insiderData.pidIndex++}`
            combatData.prePoints.push(createPrePoint(key, 15))
          }
          return
        }

        conf.ptMax.changeEvents?.forEach(eventConf => {
          if (msg === eventConf.msg) {
            combatData.ptMax = eventConf.changeTo
          }
        })
      } else if (conf.mode === 'naadam') {
        let matcher = conf.initialMatch

        const matchInitial = msg.match(matcher.match)
        if (matchInitial) {
          const [ptIndex, ptLvIndex] = matcher.indexes
          const ptLv = matchInitial[ptLvIndex!]
          const pt = matchInitial[ptIndex!]
          if (!pt || !ptLv) return
          const [total] = conf.getFp(ptLv)
          createInitialPoint(pt, ptLv, total, 30)
          return
        }

        matcher = conf.neutralMatch
        const matchNeutral = msg.match(matcher.match)
        if (matchNeutral) {
          const [ptIndex, ptLvIndex] = matcher.indexes
          const ptLv = matchNeutral[ptLvIndex!]
          const pt = matchNeutral[ptIndex!]
          if (!pt || !ptLv) return
          const [total] = conf.getFp(ptLv)
          createInitialPoint(pt, ptLv, total)
          return
        }

        matcher = conf.conquerMatch
        const matchConquer = msg.match(matcher.match)
        if (matchConquer) {
          const [ptIndex, ptLvIndex, ownerIndex] = matcher.indexes
          const pt = matchConquer[ptIndex!]
          const ptLv = matchConquer[ptLvIndex!]
          const owner = matchConquer[ownerIndex!]
          if (!pt || !ptLv || !owner) return
          const gc = parseGc(owner)
          const [total, drop] = conf.getFp(ptLv)
          activatePoint(pt, gc, ptLv, total, drop)
          return
        }

        matcher = conf.cleanMatch
        const matchClean = msg.match(matcher.match)
        if (matchClean) {
          const [ptIndex] = matcher.indexes
          const pt = matchClean[ptIndex!]
          if (!pt) return
          if (combatData.pointMap[pt] && combatData.pointMap[pt].type !== 'static' && combatData.pointMap[pt].type !== 'initial') {
            combatData.pointMap[pt].cancel()
          }
          return
        }
      } else if (conf.mode === 'secure') {
        let matcher = conf.conquerMatch

        const matchConquer = msg.match(matcher.match)
        if (matchConquer) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const [ptIndex, ptLvIndex, ownerIndex] = matcher.indexes
          const pt = matchConquer[ptIndex!]
          const owner = matchConquer[ownerIndex!]
          if (!pt || !owner) return
          const gc = parseGc(owner)
          combatData.pointMap[pt] = {
            type: 'static',
            owner: gc,
          }
          return
        }

        matcher = conf.pauseMatch
        const matchPause = msg.match(matcher.match)
        if (matchPause) {
          const [ptIndex] = matcher.indexes
          const pt = matchPause[ptIndex!]
          if (!pt) return
          combatData.pointMap[pt] = {
            type: 'static'
          }
          return
        }
      }
    }
  }

  // 持久化保存对战记录
  watch(combatData.frontlineLog, (newVal) => {
    if (!appVar.inited) return
    saveCombatLogs(newVal)
  })

  const situationLockMsg = computed(() => {
    if (!combatData.onConflict && !combatData.zone){
      return '还未进入对战'
    } else if (!combatData.onConflict) {
      return '正在等待战斗开始'
    } else if (combatData.zone === Frontline.shatter) {
      return '暂不支持解析 ' + getFrontlineNames(combatData.zone)[1] + ' 的战况数据'
    } else if (combatData.zone === RivalWings.hiddengorge) {
      return '暂不支持解析 烈羽争锋 的战况数据'
    } else if (Object.values(CrystalConflict).includes(combatData.zone as CrystalConflict)) {
      return '暂不支持解析 水晶冲突 的战况数据'
    }
    return false
  })
  const pointData = computed(() => {
    const result: {
      key: string,
      type: "active" | "neutrality" | "preparing"
      specifyColor?: string
      ptLv?: string
      ptName: string
      ptProgress?: number
      ptDescription: string
      sortValue?: number
    }[] = Object.entries(combatData.pointMap).map(([key, val]) => {
      let ptName = ''
      if (combatData.zone === Frontline.seize) ptName = '亚拉戈石文'
      else if (combatData.zone === Frontline.shatter) ptName = '冰封的石文'
      else if (combatData.zone === Frontline.naadam) ptName = '无垢的大地'
      else if (combatData.zone === Frontline.triumph) ptName = '战略目标点'
      ptName += key

      // 计算排序权重
      let sortValue: number | undefined = undefined
      if ('ptRemain' in val) sortValue = val.ptRemain
      else if ('ptTotal' in val) sortValue = val.ptTotal

      if (val.type === 'initial') {
        return {
          key: `pointMap-${key}`,
          type: 'neutrality',
          ptLv: val.ptLv,
          ptName: ptName,
          ptDescription: '中立' + (val.time ? ('／还需 ' + val.time.remain.toString() + 's') : ('／剩余 ' + val.ptTotal.toString())),
          sortValue
        }
      } else if (val.type === 'static') {
        return {
          key: `pointMap-${key}`,
          type: !val.owner ? 'neutrality' : 'active',
          specifyColor: val.owner ? getGrandCompanyColor(val.owner) : '',
          ptName: ptName,
          ptDescription: val.owner ? getGrandCompanyName(val.owner) : '中立',
          sortValue
        }
      } else {
        return {
          key: `pointMap-${key}`,
          type: val.paused ? 'neutrality' : 'active',
          specifyColor: val.paused ? '' : getGrandCompanyColor(val.owner),
          ptLv: val.ptLv,
          ptName: ptName,
          ptProgress: val.ptRemain / val.ptTotal * 100,
          ptDescription: (val.paused ? '中立': getGrandCompanyName(val.owner)) + '／剩余 ' + val.ptRemain.toString(),
          sortValue
        }
      }
    })
    combatData.prePoints.forEach(val => {
      result.push({
        key: `prePoints-${val.key}`,
        type: 'preparing',
        ptLv: '?',
        ptName: '即将刷新',
        ptProgress: val.tRemain / val.tTotal * 100,
        ptDescription: '还需 ' + val.tRemain.toString() + 's',
        sortValue: 120 - val.tRemain // 使用战场点分平均值作为期望
      })
    })

    // 排序
    result.sort((a, b) => {
      // undefined (无价值) 置顶
      if (a.sortValue === undefined && b.sortValue !== undefined) return -1
      if (a.sortValue !== undefined && b.sortValue === undefined) return 1
      if (a.sortValue === undefined && b.sortValue === undefined) {
        return a.key.localeCompare(b.key)
      }

      // 有价值的从高到低
      return (b.sortValue as number) - (a.sortValue as number)
    })

    return result.map(val => {
      const cardFlow = insiderData.pidIndex++
      return {
        ...val,
        cardKey: val.key + '-' + cardFlow
      }
    })
  })
  const knockouts = computed((): DeathInfo[] => {
    return combatData.allPlayersDeaths.filter(
      death => death.perpetratorName === combatData.playerName || death.summonedBy === combatData.playerName
    )
  })
  const deaths = computed((): DeathInfo[] => {
    return combatData.allPlayersDeaths.filter(
      death => death.victimName === combatData.playerName
    )
  })
  const statistics = computed(() => {
    const dealDouble = (a: number, b: number) => {
      return Math.round((a / (b || 1)) * 100) / 100
    }

    const knockouts = combatData.frontlineLog.map(log => log.knockouts).flat()
    const deaths = combatData.frontlineLog.map(log => log.deaths).flat()
    const kd = dealDouble(knockouts.length, deaths.length)
    const knockoutEachMatch = dealDouble(knockouts.length, combatData.frontlineLog.length)
    const deathEachMatch = dealDouble(deaths.length, combatData.frontlineLog.length)

    const pieData = {
      knockoutBySkill: countBy(knockouts, k => k.lasthitActionName),
      knockoutBySelfJob: countBy(knockouts, k => getJobInfo(k.perpetratorJob).job_name || '???'),
      knockoutByEnemyJob: countBy(knockouts, k => getJobInfo(k.victimJob).job_name || '???'),
      deathBySkill: countBy(deaths, d => d.lasthitActionName),
      deathBySelfJob: countBy(deaths, d => getJobInfo(d.victimJob).job_name || '???'),
      deathByEnemyJob: countBy(deaths, d => getJobInfo(d.perpetratorJob).job_name || '???'),
    }

    return {
      knockouts, deaths, kd,
      knockoutEachMatch, deathEachMatch,
      pieData,
    }

    function countBy<T>(
      list: T[],
      key: (item: T) => string
    ): { label: string; amount: number }[] {
      const map: Record<string, number> = {}
      list.forEach(item => {
        const k = key(item)
        map[k] = (map[k] ?? 0) + 1
      })
      return Object.entries(map).map(([label, amount]) => ({ label, amount }))
    }
  })

  const init = () => {
    addOverlayListener('ChangePrimaryPlayer', handlePrimaryPlayerChange)
    addOverlayListener('ChangeZone', handleZoneChange)
    addOverlayListener('LogLine', handleLogLine)

    if (insiderData.combatantWatcher) clearInterval(insiderData.combatantWatcher)
    insiderData.combatantWatcher = setInterval(async () => {
      if (!combatData.onConflict && !combatData.zone) return
      const combatants = await getCombatants()
      combatants?.forEach(combatant => {
        const playerId = combatant.ID.toString(16).toUpperCase()
        combatData.playerMapName[playerId] = combatant.Name
        combatData.playerMapJob[playerId] = combatant.Job
        combatData.playerMapFull[playerId] = combatant
      })
    }, 1000)

    combatData.frontlineLog = loadCombatLogs()

    if (store.appConfig.auto_collapse_when_launch) {
      appVar.collapsed = true
    }

    appVar.inited = true
    console.log('combat parser initialized')
  }
  const dispose = () => {
    removeOverlayListener('ChangePrimaryPlayer', handlePrimaryPlayerChange)
    removeOverlayListener('ChangeZone', handleZoneChange)
    removeOverlayListener('LogLine', handleLogLine)

    if (insiderData.combatantWatcher) clearInterval(insiderData.combatantWatcher)

    appVar.inited = false
    console.log('combat parser disposed')
  }

  const buildDebugData = () => {
    if (!isDev) return

    // 处理基本战斗数据
    combatData.zone = Frontline.seize
    combatData.onConflict = true

    // 生成“战况”调试数据
    Object.entries(combatData.pointMap).forEach(([key, val]) => {
      if (val.type === 'initial' || val.type === 'static') delete combatData.pointMap[key]
      else val.cancel()
    })
    combatData.prePoints.length = 0
    createInitialPoint('A1', 'S', 160, 30)
    activatePoint('B2', GrandCompany.maelstrom, 'A', 120, 3)
    activatePoint('C3', GrandCompany.twinadder, 'B', 80, 2)
    const pausedKey = 'C3'
    if (combatData.pointMap[pausedKey] && 'pause' in combatData.pointMap[pausedKey]) {
      combatData.pointMap[pausedKey].pause()
    }
    combatData.pointMap['D4'] = {
      type: 'static',
      owner: GrandCompany.immoflame
    }
    combatData.prePoints.push(createPrePoint('A4', 15))

    // 生成“统计”调试数据
    if (!combatData.frontlineLog.length) {
      combatData.frontlineLog.push({
        zone: Frontline.seize,
        job: 42,
        start_time: Date.now(),
        knockouts: [],
        deaths: [],
      })
    }
  }

  return {
    appVar, combatData, insiderData,
    getGcPoint, getGcIncreaseSpeed,
    situationLockMsg,
    pointData,
    knockouts,
    deaths,
    statistics,
    init,
    dispose,
    buildDebugData,
  }
}

export default useCombatParser
