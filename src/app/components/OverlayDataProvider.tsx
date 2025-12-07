import { useState, useEffect, useCallback, createContext, useContext, JSX } from 'react';
import { MessagePlugin } from 'tdesign-react/lib/';
import useOverlay from '../tools/overlay';
import { GrandCompany, Frontline, FrontlineLog, DeathInfo, CrystalConflict, FrontlineResult, GameZonesMap, PvPBattle, RivalWings } from '../types';
import { ChangePrimaryPlayerData, ChangeZoneData, LoglineData, OverlayCombatant } from '../types/overlay';
import {
  getGrandCompanyName,
  getGrandCompanyColor,
  getActionDamageFromLogLine,
  getFrontlineNames,
  deepCopy,
  getSecurePointIncrease,
  copyToClipboard,
} from '@/app/tools';
import { AppConfig, fixAppConfig } from '../types/config';
import { loadConfig } from '../tools/config';
import PointCard from './PointCard';

// 定义点结构
interface PointInfo {
  type?: undefined;
  dropSpeed: number;
  remain: number;
  total: number;
  owner: GrandCompany;
  ptLv: string;
  paused: boolean;
  pause: () => void;
  resume: () => void;
  cancel: () => void;
}

interface StaticPointInfo {
  type: 'static';
  owner?: GrandCompany;
}

interface InitialPointInfo {
  type: 'initial';
  time?: {
    remain: number;
    total: number;
  };
  ptLv: string;
  ptTotal: number;
  cancel: () => void;
}

interface PrePointInfo {
  key: string;
  remain: number;
  total: number;
}

interface LasthitInfo {
  perpetratorName: string;
  victimName: string;
  hitActionName: string;
  hitActionDamage: number;
}

interface SelfActionLog {
  happenTime: number;
  perpetratorName: string;
  perpetratorJob?: number;
  actionName: string;
  actionDamage: number;
}

// 全局状态
const gcFp: Record<GrandCompany, number> = {
  [GrandCompany.maelstrom]: 0,
  [GrandCompany.twinadder]: 0,
  [GrandCompany.immoflame]: 0,
};

const pointMap: Record<string, PointInfo | StaticPointInfo | InitialPointInfo> = {};
const prePoints: PrePointInfo[] = [];

// 玩家表 | `key:charID` | `val:charName`
let playerMapName: Record<string, string> = {
  'E0000000': '(场地/dot)',
};
let playerMapJob : Record<string, number> = {};
let playerMapFull: Record<string, OverlayCombatant> = {};

// 召唤物表 | `key:召唤物ID` | `val:召唤者ID`
let summonMap: Record<string, string> = {};

// 上次受击表 | `key:施害者ID+受害者ID`
let playerLasthitMap: Record<string, LasthitInfo> = {};

const deaths: DeathInfo[] = [];
const goodboys: SelfActionLog[] = [];
const badboys: SelfActionLog[] = [];

const reactive = {
  pidIndex: 1,
  currFrontlineResult: undefined as FrontlineResult | undefined,
  currFrontlineStartTime: 0,
};

interface OverlayDataContextType {
  appConfig: AppConfig;
  playerId: string;
  playerName: string;
  onConflict: boolean;
  zone: PvPBattle | "";
  gc: GrandCompany | "";
  ptMax: number;
  dummy: number;
  frontlineLog: FrontlineLog[];
  showDamageInKD: boolean;
  setShowDamageInKD: (show: boolean) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  showToast: (msg: string, type?: "info" | "success" | "warning" | "error" | "question") => void;
  getGcPoint: (gc: GrandCompany) => number | string;
  getGcIncreaseSpeed: (gc: GrandCompany) => number;
  getKnockouts: () => DeathInfo[];
  getDeaths: () => DeathInfo[];
  formatTime: (timestamp: number) => string;
  getPointCards: () => JSX.Element[];
  lockSituationMsg: () => string | boolean;
  handleCopySituation: () => void;
  resolveLog: () => any;
  goodboys: SelfActionLog[];
  badboys: SelfActionLog[];
}

const OverlayDataContext = createContext<OverlayDataContextType | undefined>(undefined);

export const useOverlayData = () => {
  const context = useContext(OverlayDataContext);
  if (!context) {
    throw new Error('useOverlayData must be used within an OverlayDataProvider');
  }
  return context;
};

interface OverlayDataProviderProps {
  children: React.ReactNode;
}

const OverlayDataProvider: React.FC<OverlayDataProviderProps> = ({ children }) => {
  const { initialize, addOverlayListener, removeOverlayListener, startOverlayEvents, getCombatants } = useOverlay();

  const [appConfig, setAppConfig] = useState<AppConfig>(fixAppConfig());
  const [playerId, setPlayerId] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>('');
  const [onConflict, setOnConflict] = useState<boolean>(false);
  const [zone, setZone] = useState<PvPBattle | "">('');
  const [gc, setGc] = useState<GrandCompany | "">('');
  const [ptMax, setPtMax] = useState<number>(0);
  const [dummy, setDummy] = useState(0); // 手动刷新
  const [frontlineLog, setFrontlineLog] = useState<FrontlineLog[]>([]);
  const [showDamageInKD, setShowDamageInKD] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('situation');

  const showToast = (
    msg: string,
    type: "info" | "success" | "warning" | "error" | "question" = 'info'
  ) => {
    MessagePlugin[type]({
      content: msg,
      duration: 1500,
      placement: 'bottom',
      className: 'text text-[1.375rem]',
    });
  };

  const addSelfActionLog = (list: SelfActionLog[], log: SelfActionLog) => {
    const recentLogs = list.slice(-5);

    const duplicateIndex = recentLogs.findIndex(lastLog =>
      lastLog.perpetratorName === log.perpetratorName &&
      lastLog.actionName === log.actionName &&
      Math.abs(lastLog.happenTime - log.happenTime) <= 4000
    );

    if (duplicateIndex !== -1) {
      const actualIndex = list.length - recentLogs.length + duplicateIndex;
      list.splice(actualIndex, 1);
    }

    list.push(log);
  };

  const parseGc = (gc_name: string) => {
    if (gc_name === '黑涡团') return GrandCompany.maelstrom;
    else if (gc_name === '双蛇党') return GrandCompany.twinadder;
    else if (gc_name === '恒辉队') return GrandCompany.immoflame;
    throw new Error('parseGc: unknown gc:' + gc_name);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toTimeString().slice(0, 8);
  };

  const getCurrPointCount = () => {
    return prePoints.length + Object.keys(pointMap).length;
  };

  const activatePoint = (key: string, owner: GrandCompany, ptLv: string, total: number, drop: number) => {
    if (pointMap[key] && pointMap[key].type !== 'static' && pointMap[key].type !== 'initial') {
      pointMap[key].owner = owner;
      pointMap[key].resume();
      setDummy(d => d + 1);
      return;
    }
    if (pointMap[key] && pointMap[key].type !== 'static') {
      pointMap[key].cancel();
    }

    let remain = total;
    let timer: NodeJS.Timeout | null = null;
    let paused = false;

    const tick = () => {
      if (paused) return;
      remain -= drop;
      if (remain <= 0) {
        remain = 0; cleanup();
      }
      setDummy(d => d + 1);
    };
    const cleanup = () => {
      if (timer) clearInterval(timer);
      delete pointMap[key];
      setDummy(d => d + 1);
    };
    const startTimer = () => {
      if (!timer) {
        timer = setInterval(tick, 3000);
      }
    };

    pointMap[key] = {
      dropSpeed: drop,
      get remain() {
        return remain;
      },
      total: total,
      owner: owner,
      ptLv: ptLv,
      get paused() {
        return paused;
      },
      pause() {
        paused = true;
      },
      resume() {
        if (!paused) return;
        paused = false;
      },
      cancel() {
        cleanup();
      }
    };

    startTimer();
  };

  const createInitialPoint = (key: string, ptLv: string, total: number, countdown?: number) => {
    if (pointMap[key] && pointMap[key].type !== 'static') {
      pointMap[key].cancel();
    }

    let remain = countdown || 0;
    let timer: NodeJS.Timeout | null = null;

    const tick = () => {
      if (!countdown) return;
      remain -= 1;
      if (remain <= 0) {
        remain = 0; cleanup();
      }
      setDummy(d => d + 1);
    };
    const cleanup = () => {
      if (timer) clearInterval(timer);
      delete pointMap[key];
      setDummy(d => d + 1);
    };
    const startTimer = () => {
      if (!timer) {
        timer = setInterval(tick, 1000);
      }
    };

    pointMap[key] = {
      type: 'initial',
      time: countdown ? {
        get remain() {
          return remain;
        },
        total: countdown,
      } : undefined,
      ptLv: ptLv,
      ptTotal: total,
      cancel() {
        cleanup();
      }
    };

    startTimer();
  };

  const createPrePoint = (key: string, total: number) => {
    let remain = total;
    let timer: NodeJS.Timeout | null = null;

    const tick = () => {
      remain -= 1;
      if (remain <= 0) {
        remain = 0; cleanup();
      }
      setDummy(d => d + 1);
    };
    const cleanup = () => {
      if (timer) clearInterval(timer);
      const index = prePoints.findIndex(item => item.key === key);
      if (index !== -1) {
        prePoints.splice(index, 1);
      }
    };
    const startTimer = () => {
      if (!timer) {
        timer = setInterval(tick, 1000);
      }
    };

    const val: PrePointInfo = {
      key: key,
      get remain() {
        return remain;
      },
      total: total,
    };

    startTimer();
    return val;
  };

  const getGcPoint = (gc: GrandCompany) => {
    if (zone === Frontline.seize || zone === Frontline.naadam) {
      const arr = Object.values(pointMap)
        .filter(val => val.type !== 'static' && val.type !== 'initial' && !val.paused && val.owner === gc)
        .map(val => (val as PointInfo).remain);
      if (!arr.length) return 0;
      return arr.reduce((prev, cur) => prev + cur);
    } else if (zone === Frontline.secure) {
      return '-';
    } else {
      return gcFp[gc];
    }
  };

  const getGcIncreaseSpeed = (gc: GrandCompany) => {
    if (zone === Frontline.seize || zone === Frontline.naadam) {
      const arr = Object.values(pointMap)
        .filter(val => val.type !== 'static' && val.type !== 'initial' && val.owner === gc)
        .map(val => (val as PointInfo).dropSpeed);
      if (!arr.length) return 0;
      return arr.reduce((prev, cur) => prev + cur);
    } else if (zone === Frontline.secure) {
      const arr = Object.values(pointMap)
        .filter(val => val.type === 'static' && val.owner === gc);
      return getSecurePointIncrease(arr.length);
    } else {
      return 0;
    }
  };

  const getKnockouts = useCallback(() => {
    return deaths.filter(death => death.perpetratorName === playerName || death.summonedBy === playerName);
  }, [playerName]);

  const getDeaths = useCallback(() => {
    return deaths.filter(death => death.victimName === playerName);
  }, [playerName]);

  const getPlayerJob = useCallback(async () => {
    if (playerMapJob[playerId]) {
      return playerMapJob[playerId];
    }
    const combatants = await getCombatants();
    const player = combatants.find(combatant => combatant.ID.toString(16).toUpperCase() === playerId);
    if (!player) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          'No player was found in given combatants.',
          '\ncombatants:', combatants,
          '\nplayer:', JSON.stringify({ id: playerId, name: playerName })
        );
      }
      return;
    }
    return player.Job;
  }, [
    getCombatants,
    playerId,
    playerName
  ]);

  const zoneChangeCallback = useCallback((data: ChangeZoneData) => {
    const conflictZone = GameZonesMap.get(data.zoneID);
    if (conflictZone) {
      setZone(conflictZone);
    } else {
      if (zone) {
        let result = undefined;
        if (
          reactive.currFrontlineResult
          && (
            Object.values(CrystalConflict).includes(zone as CrystalConflict)
            || zone === RivalWings.hiddengorge
          )
        ) {
          result = reactive.currFrontlineResult;
          reactive.currFrontlineResult = undefined;
        }
        getPlayerJob().then(job => {
          const log = deepCopy<FrontlineLog>({
            zone: zone,
            job,
            result,
            start_time: reactive.currFrontlineStartTime,
            knockouts: getKnockouts(),
            deaths: getDeaths()
          });
          setFrontlineLog(prev => [...prev, log]);
        });
        if (process.env.NODE_ENV === 'development') {
          console.log(JSON.stringify(playerMapFull))
        }
        if (appConfig.auto_collapse_when_leave_battlefield) {
          setCollapsed(true);
        }
      }
      setOnConflict(false); setZone(''); setGc('');
      gcFp.maelstrom = 0; gcFp.twinadder = 0; gcFp.immoflame = 0;
      Object.entries(pointMap).forEach(([key, val]) => {
        if (val.type === 'initial' || val.type === 'static') delete pointMap[key];
        else val.cancel();
      });
      prePoints.length = 0;
      playerMapName = {
        'E0000000': '(场地/dot)',
      };
      playerMapJob = {};
      playerMapFull = {};
      summonMap = {}; playerLasthitMap = {};
      setDummy(0);
      if (process.env.NODE_ENV === 'development') {
        console.log('[Zone] ', data.zoneID, ' / ', data.zoneName);
        if (data.zoneID === 250) { // 狼狱
          setOnConflict(true);
        }
      }
    }
  }, [
    zone, getKnockouts, getDeaths, getPlayerJob,
    appConfig.auto_collapse_when_leave_battlefield,
  ]);

  const primaryPlayerChangeCallback = useCallback((data: ChangePrimaryPlayerData) => {
    setPlayerId(data.charID.toString(16).toUpperCase());
    setPlayerName(data.charName);
  }, [
    setPlayerId, setPlayerName
  ]);

  const loglineCallback = useCallback((data: LoglineData) => {
    const msgType = data.line[0]; // "00"
    const msgChannel = data.line[2]; // "0839"
    const msg = data.line[4]; // "冰封的石文A1启动了，冰块变得脆弱了！"

    // 处理战斗日志
    if (onConflict || zone) { // * 为了减轻负载，仅在纷争前线期间解析战斗
      if (msgType === '03') { // 添加战斗成员
        // 03|2025-07-21T19:50:15.3580000+08:00|100F9FCA|西风|18|64|0000|415|MoDuNa|0|0|54000|55500|10000|10000|||241.34|135.04|-7.08|-2.09|af51ebeec28c5c27
        const charId = data.line[2];
        const charName = data.line[3];
        playerMapName[charId] = charName;
      } else if ((msgType === '21' || msgType === '22')) { // 发动技能
        // https://github.com/OverlayPlugin/cactbot/blob/main/docs/LogGuide.md#line-21-0x15-networkability
        // 22|2025-07-21T20:15:49.3900000+08:00|1058F1D5|浮|72DC|霰弹枪|40000002|木人|720003|17700000|0|0|0|0|0|0|0|0|0|0|0|0|0|0|75000|75000|10000|10000|||104.12|-4.71|2.31|3.14|57000|57000|10000|10000|||94.94|-13.42|2.31|-2.71|0007B835|1|2|00||01|72DC|72DC|0.100|0000|69f2e27a0f10b758
        const perpetratorId = data.line[2];
        const perpetratorName = data.line[3] || '???';
        const hitActionId = data.line[4];
        const hitActionName = data.line[5] || '???';
        const victimId = data.line[6];
        const victimName = data.line[7] || '???';

        const perpetratorJob = playerMapJob[perpetratorId];

        let isValidAction = data.line[8] !== '0';
        if (hitActionId === '72D3'/*默者的夜曲*/) {
          isValidAction = data.line[10] !== '0';
        }

        if (isValidAction && perpetratorId && victimId) {
          const { hit, damageType, damage, heal } = getActionDamageFromLogLine(data.line);

          if (
            process.env.NODE_ENV === 'development'
            && (perpetratorId === playerId || victimId === playerId)
          ) {
            console.log(
              `[Action] ${perpetratorName}(${perpetratorId}) -> ${victimName}(${victimId}): ${hitActionName}(${hitActionId})`,
              '\nhit:', hit,
              '\tdamageType:', damageType,
              '\ndamage:', damage,
              '\nheal:', heal,
              '\ndetail:', data.rawLine,
            );
          }

          // 记录上次伤害表
          if (hit && (damageType === 'damage' || damageType === 'both')) {
            const specialActions = [
              '星遁天诛', '完人',
              '献身', '全力挥打', '绝空拳', '爆破箭', '胖胖之墙'
            ]; // 可能不造成伤害就击杀的技能

            if (specialActions.includes(hitActionName) || damage > 0) {
              const key = `${perpetratorId}-${victimId}`;
              playerLasthitMap[key] = {
                perpetratorName: perpetratorName,
                victimName: victimName,
                hitActionName: hitActionName,
                hitActionDamage: damage,
              };
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
            ];
            if (goodActions.includes(hitActionId) || goodActions.includes(hitActionName)) {
              addSelfActionLog(goodboys, {
                happenTime: Date.now(),
                perpetratorName: perpetratorName,
                perpetratorJob: perpetratorJob,
                actionName: hitActionName,
                actionDamage: heal,
              });
            }
            // 记录坏人
            const badActions = [
              'A8ED'/*全力挥打*/, '7199'/*献身*/, '732D'/*陨石冲击*/,
              '72E7'/*魔弹射手*/, '72DF'/*空气锚*/,
              '72D3'/*默者的夜曲*/, 'A1FB'/*英雄的返场余音*/, '72D2'/*爆破箭*/,
              '72F8'/*行列舞*/
              // 'A226'/*昏沉*/,
            ];
            if (
              badActions.includes(hitActionId) || badActions.includes(hitActionName)
              || damage >= appConfig.badboy_threshold
            ) {
              addSelfActionLog(badboys, {
                happenTime: Date.now(),
                perpetratorName: perpetratorName,
                perpetratorJob: perpetratorJob,
                actionName: hitActionName,
                actionDamage: damage,
              });
            }
          }
        }
      } else if (msgType === '25') { // Death
        // 25|2025-07-21T20:04:08.8860000+08:00|10582BA7|卷饼|1058F1D5|浮|d94e2430f7a262f2
        const victimId = data.line[2];
        const victimName = data.line[3] || '???';
        const perpetratorId = data.line[4];
        let perpetratorName = data.line[5];
        if (victimId && !victimId.startsWith('40')) { // 忽略场景物体被打倒的信息
          if (perpetratorId) {
            let summoner: string | undefined;
            if (summonMap[perpetratorId]) {
              const summonerId = summonMap[perpetratorId];
              if (playerMapName[summonerId]) {
                summoner = playerMapName[summonerId];
              } else if (summonerId === playerId) {
                summoner = playerName;
              }
            }
            if (!perpetratorName) {
              perpetratorName = playerMapName[perpetratorId] || '???';
            }
            deaths.push({
              happenTime: Date.now(),
              victimName: victimName,
              perpetratorName: perpetratorName,
              victimJob: playerMapJob[victimId],
              perpetratorJob: playerMapJob[summoner || perpetratorId],
              summonedBy: summoner,
              lasthitActionName: playerLasthitMap[`${perpetratorId}-${victimId}`]?.hitActionName || '???',
              lasthitActionDamage: playerLasthitMap[`${perpetratorId}-${victimId}`]?.hitActionDamage || 0,
            });
            setDummy(d => d + 1);
          }
        }
      } else if (msgType === '261' && data.line[2] === 'Add') { // Summon
        // 261|2025-07-21T20:19:36.6860000+08:00|Add|40007109|BNpcID|3951|BNpcNameID|E53|CastTargetID|E0000000|CurrentMP|10000|CurrentWorldID|65535|Heading|1.6445|Level|100|MaxHP|57000|MaxMP|10000|ModelStatus|3072|Name|象式浮空炮塔|NPCTargetID|E0000000|OwnerID|1058F1D5|PosX|95.1405|PosY|-7.4485|PosZ|2.3552|Radius|1.0000|Type|2|WorldID|65535|0ed50912a51e73d8
        const summonedId = data.line[3];
        const ownerId = data.line[29];
        if (summonedId && ownerId) {
          summonMap[summonedId] = ownerId;
        }
      }
    }

    // 过滤无关频道
    const validChannels = ['0039', '0839', '0840', '083E'];
    if (msgType !== '00' || !validChannels.includes(msgChannel)) return;
    if (!msg) return;

    // 处理战斗开始信息
    const matchGc = msg.match(/以(黑涡团|双蛇党|恒辉队)的身份参加了纷争前线！/);
    if (
      matchGc
      || msg === '战斗即将开始！'
      || (zone === RivalWings.hiddengorge && msg === "进入了对战区域。 当前职业为可以进行对战的特职时， 状态参数和热键栏会被切换为对战专用版。")
    ) {
      if (matchGc && matchGc[1]) {
        const _gc = parseGc(matchGc[1]);
        setGc(_gc);
      }
      setOnConflict(true);
      Object.keys(playerLasthitMap).forEach(key => delete playerLasthitMap[key]);
      deaths.length = 0;
      goodboys.length = 0;
      badboys.length = 0;

      if (zone === Frontline.seize) setPtMax(4);
      else if (zone === Frontline.naadam) setPtMax(6);
      else setPtMax(0);

      reactive.currFrontlineStartTime = Date.now();
      if (appConfig.auto_expand_when_enter_battlefield) {
        setCollapsed(false);
      }
      return;
    }
    
    if (!onConflict && !zone) return;

    // 处理刷点信息
    if (zone === Frontline.seize) {
      const getFp = (ptLv: string) => {
        if (ptLv === 'S') return [160, 4];
        else if (ptLv === 'A') return [120, 3];
        else if (ptLv === 'B') return [80, 2];
        throw new Error('[gcFp] wtf point is? ' + ptLv);
      };

      const matchNeutral = msg.match(/(S|A|B)级的亚拉戈石文(.*?)开始活动了！/);
      if (matchNeutral && matchNeutral[2]) {
        const ptLv = matchNeutral[1];
        const pt = matchNeutral[2];
        const [total] = getFp(ptLv);
        createInitialPoint(pt, ptLv, total);
        setDummy(d => d + 1);
        return;
      }

      const matchConquer = msg.match(/(黑涡团|双蛇党|恒辉队)占领了(S|A|B)级的亚拉戈石文(.*?)！/);
      if (matchConquer) {
        const pt = matchConquer[3];
        const ptLv = matchConquer[2];
        const owner = parseGc(matchConquer[1]);
        const [total, drop] = getFp(ptLv);
        activatePoint(pt, owner, ptLv, total, drop);
        setDummy(d => d + 1);
        return;
      }

      const matchPause = msg.match(/(S|A|B)级的亚拉戈石文(.*?)变为中立状态！/);
      if (matchPause) {
        const pt = matchPause[2];
        if (pointMap[pt] && pointMap[pt].type !== 'static' && pointMap[pt].type !== 'initial') {
          pointMap[pt].pause();
        }
        setDummy(d => d + 1);
        return;
      }

      const matchClean = msg.match(/(S|A|B)级的亚拉戈石文(.*?)的情报已枯竭！/);
      if (matchClean) {
        const pt = matchClean[2];
        if (pointMap[pt] && pointMap[pt].type !== 'static' && pointMap[pt].type !== 'initial') {
          pointMap[pt].cancel();
        }
        while (prePoints.length && getCurrPointCount() > ptMax) prePoints.pop();
        if (prePoints.length < ptMax) {
          const key = `seize-${Date.now()}-${dummy}`;
          prePoints.push(createPrePoint(key, 15));
        }
        setDummy(d => d + 1);
        return;
      }

      if (msg === '距离"尘封秘岩（争夺战）"结束还有10分钟。') {
        setPtMax(3);
        while (prePoints.length && getCurrPointCount() > 3) prePoints.pop();
        setDummy(d => d + 1);
      }
    }
    else if (zone === Frontline.shatter) {
      /*
      const getFp = (ptLv: string) => {
        if (ptLv === 'A') return 200;
        else if (ptLv === 'B') return 50;
        throw new Error('[gcFp] wtf point is? ' + ptLv);
      };
      const judgeBelong = (pt: string) => {
        const immoflame = ['A4', 'B3', 'B4', 'B5', 'B6'];
        const twinadder = ['A3', 'B7', 'B8', 'B9', 'B10'];
        const maelstrom = ['A2', 'B1', 'B2', 'B11', 'B12'];

        if (immoflame.includes(pt)) return GrandCompany.immoflame;
        if (twinadder.includes(pt)) return GrandCompany.twinadder;
        if (maelstrom.includes(pt)) return GrandCompany.maelstrom;
        return undefined;
      };

      const matchPtActive = msg.match(/冰封的石文(A|B)(\d{1,2})启动了，冰块变得脆弱了！/);
      if (matchPtActive && matchPtActive[1] && matchPtActive[2]) {
        const fp = getFp(matchPtActive[1]);
        const pt = matchPtActive[1] + matchPtActive[2];
        const _gc = judgeBelong(pt);
        if (_gc) gcFp[_gc] += fp;
        setDummy(d => d + 1);
      }

      const matchPtDestroy = msg.match(/冰封的石文(A|B)(\d{1,2})被破坏了！/);
      if (matchPtDestroy && matchPtDestroy[1] && matchPtDestroy[2]) {
        const fp = getFp(matchPtDestroy[1]);
        const pt = matchPtDestroy[1] + matchPtDestroy[2];
        const _gc = judgeBelong(pt);
        if (_gc) gcFp[_gc] -= fp;
        setDummy(d => d + 1);
      }
      */
    }
    else if (zone === Frontline.naadam) {
      const getFp = (ptLv: string) => {
        if (ptLv === 'S') return [200, 20];
        else if (ptLv === 'A') return [100, 10];
        else if (ptLv === 'B') return [50, 5];
        throw new Error('[gcFp] wtf point is? ' + ptLv);
      };

      const matchInitial = msg.match(/30秒后(S|A|B)级无垢的大地(.*?)即将进入可契约状态。/);
      if (matchInitial && matchInitial[2]) {
        const ptLv = matchInitial[1];
        const pt = matchInitial[2];
        const [total] = getFp(ptLv);
        createInitialPoint(pt, ptLv, total, 30);
        setDummy(d => d + 1);
        return;
      }

      const matchNeutral = msg.match(/(S|A|B)级无垢的大地(.*?)进入了可契约状态！/);
      if (matchNeutral && matchNeutral[2]) {
        const ptLv = matchNeutral[1];
        const pt = matchNeutral[2];
        const [total] = getFp(ptLv);
        createInitialPoint(pt, ptLv, total);
        setDummy(d => d + 1);
        return;
      }

      const matchConquer = msg.match(/(黑涡团|双蛇党|恒辉队)与(S|A|B)级无垢的大地(.*?)签订了契约。/);
      if (matchConquer) {
        const pt = matchConquer[3];
        const ptLv = matchConquer[2];
        const owner = parseGc(matchConquer[1]);
        const [total, drop] = getFp(ptLv);
        activatePoint(pt, owner, ptLv, total, drop);
        setDummy(d => d + 1);
        return;
      }

      const matchClean = msg.match(/无垢的大地(.*?)已失效。/);
      if (matchClean) {
        const pt = matchClean[1];
        if (pointMap[pt] && pointMap[pt].type !== 'static' && pointMap[pt].type !== 'initial') {
          pointMap[pt].cancel();
        }
        setDummy(d => d + 1);
        return;
      }

      if (msg === '距离战斗开始已经过5分钟，无垢的大地的同时出现数量减少了！') {
        setPtMax(4);
        setDummy(d => d + 1);
      }
      if (msg === '距离战斗开始已经过10分钟，无垢的大地的同时出现数量减少了！') {
        setPtMax(3);
        setDummy(d => d + 1);
      }
      if (msg === '距离战斗开始已经过15分钟，无垢的大地的同时出现数量减少了！') {
        setPtMax(2);
        setDummy(d => d + 1);
      }
    }
    else if (zone === Frontline.secure) {
      const matchConquer = msg.match(/(黑涡团|双蛇党|恒辉队)占领了(.*?)！/);
      if (matchConquer) {
        const pt = matchConquer[2];
        const owner = parseGc(matchConquer[1]);
        pointMap[pt] = {
          type: 'static',
          owner,
        };
        setDummy(d => d + 1);
        return;
      }

      const matchPause = msg.match(/(.*?)恢复成了中立状态！/);
      if (matchPause) {
        const pt = matchPause[1];
        pointMap[pt] = {
          type: 'static',
        };
        setDummy(d => d + 1);
        return;
      }
    }

    // 处理结算信息，尝试获取比赛结果
    if (Object.values(Frontline).includes(zone as Frontline)) {

    }
    else if (zone === RivalWings.hiddengorge) {
      // 隐塞
      const matchRewardSeriesExp = msg.match(/获得了([\d,]+)点系列赛经验值。/);
      if (matchRewardSeriesExp && matchRewardSeriesExp[1]) {
        if (matchRewardSeriesExp[1] === '1,250') {
          reactive.currFrontlineResult = 'win';
        } else if (matchRewardSeriesExp[1] === '750') {
          reactive.currFrontlineResult = 'lose';
        }
      }
    }
    else {
      // 55
      const matchRewardSeriesExp = msg.match(/获得了(\d+)点系列赛经验值。/);
      if (matchRewardSeriesExp && matchRewardSeriesExp[1]) {
        if (matchRewardSeriesExp[1] === '900') {
          reactive.currFrontlineResult = 'win';
        } else if (matchRewardSeriesExp[1] === '700') {
          reactive.currFrontlineResult = 'lose';
        }
      }
    }
  }, [
    onConflict, zone, ptMax, dummy, playerId, playerName,
    appConfig.auto_expand_when_enter_battlefield,
    appConfig.badboy_threshold,
  ]);

  const getPointCards = () => {
    const result: {
      key: string,
      type: "active" | "neutrality" | "preparing"
      specifyColor?: string
      ptLv?: string
      ptName: string
      ptProgress?: number
      ptDescription: string
    }[] = Object.entries(pointMap).map(([key, val]) => {
      let ptName = '';
      if (zone === Frontline.seize) ptName = '亚拉戈石文';
      else if (zone === Frontline.shatter) ptName = '冰封的石文';
      else if (zone === Frontline.naadam) ptName = '无垢的大地';
      ptName += key;
      if (val.type === 'initial') {
        return {
          key: `pointMap-${key}`,
          type: 'neutrality',
          ptLv: val.ptLv,
          ptName: ptName,
          ptDescription: '中立' + (val.time ? ('／还需 ' + val.time.remain.toString() + 's') : ('／剩余 ' + val.ptTotal.toString())),
        };
      } else if (val.type === 'static') {
        return {
          key: `pointMap-${key}`,
          type: !val.owner ? 'neutrality' : 'active',
          specifyColor: val.owner ? getGrandCompanyColor(val.owner) : '',
          ptName: ptName,
          ptDescription: val.owner ? getGrandCompanyName(val.owner) : '中立',
        };
      } else {
        return {
          key: `pointMap-${key}`,
          type: val.paused ? 'neutrality' : 'active',
          specifyColor: val.paused ? '' : getGrandCompanyColor(val.owner),
          ptLv: val.ptLv,
          ptName: ptName,
          ptProgress: val.remain / val.total * 100,
          ptDescription: (val.paused ? '中立': getGrandCompanyName(val.owner)) + '／剩余 ' + val.remain.toString(),
        };
      }
    });
    prePoints.forEach(val => {
      result.push({
        key: `prePoints-${val.key}`,
        type: 'preparing',
        ptLv: '?',
        ptName: '即将刷新',
        ptProgress: val.remain / val.total * 100,
        ptDescription: '还需 ' + val.remain.toString() + 's',
      });
    });
    return result.map(val => {
      const cardFlow = reactive.pidIndex++;
      const cardKey = val.key + '-' + cardFlow;
      return (
        <PointCard
          key={cardKey}
          type={val.type}
          ptLv={val.ptLv}
          ptName={val.ptName}
          ptProgress={val.ptProgress}
          ptDescription={val.ptDescription}
          specifyColor={val.specifyColor}
        />
      );
    });
  };

  const lockSituationMsg = () => {
    if (!onConflict && !zone){
      return '还未进入对战';
    } else if (!onConflict) {
      return '正在等待战斗开始';
    } else if (zone === Frontline.shatter) {
      return '暂不支持解析 ' + getFrontlineNames(zone)[1] + ' 的战况数据';
    } else if (zone === RivalWings.hiddengorge) {
      return '暂不支持解析 烈羽争锋 的战况数据';
    } else if (Object.values(CrystalConflict).includes(zone as CrystalConflict)) {
      return '暂不支持解析 水晶冲突 的战况数据';
    }
    return false;
  };

  const handleCopySituation = () => {
    const situation = {
      hw: getGcPoint(GrandCompany.maelstrom),
      ss: getGcPoint(GrandCompany.twinadder),
      hh: getGcPoint(GrandCompany.immoflame),
    };
    const situationText = `【剩余点分】黑涡${situation.hw} / 双蛇${situation.ss} / 恒辉${situation.hh}`;
    copyToClipboard(situationText);
    showToast('已复制！');
  };

  const resolveLog = useCallback(() => {
    const knockouts = frontlineLog.map(log => log.knockouts).flat();
    const deaths = frontlineLog.map(log => log.deaths).flat();
    const kd = Math.floor(knockouts.length / (deaths.length || 1) * 100) / 100;
    const knockoutEachMatch = frontlineLog.length ? Math.floor(knockouts.length / frontlineLog.length * 100) / 100 : 0;
    const deathEachMatch = frontlineLog.length ? Math.floor(deaths.length / frontlineLog.length * 100) / 100 : 0;

    const knockoutSkillMap : Record<string, number> = {};
    knockouts.forEach(knockout => {
      if (!knockoutSkillMap[knockout.lasthitActionName]) knockoutSkillMap[knockout.lasthitActionName] = 0;
      knockoutSkillMap[knockout.lasthitActionName]++;
    });
    const knockoutDataForPie = Object.entries(knockoutSkillMap).map(([skill, count]) => {
      return { amount: count, label: skill };
    });
    const deathSkillMap : Record<string, number> = {};
    deaths.forEach(death => {
      if (!deathSkillMap[death.lasthitActionName]) deathSkillMap[death.lasthitActionName] = 0;
      deathSkillMap[death.lasthitActionName]++;
    });
    const deathDataForPie = Object.entries(deathSkillMap).map(([skill, count]) => {
      return { amount: count, label: skill };
    });

    return {
      knockouts, deaths, kd,
      knockoutEachMatch, deathEachMatch,
      knockoutDataForPie, deathDataForPie,
    };
  },[frontlineLog]);

  // 读取和监听应用设置变更
  useEffect(() => {
    const config = loadConfig();
    setAppConfig(config);

    if (config.auto_collapse_when_launch) {
      setCollapsed(true);
    }

    const handler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data.type === "config:update") {
        console.log('update config');
        setAppConfig(loadConfig());
      }
    };
    window.addEventListener('message', handler);
    return () => {
      window.removeEventListener('message', handler);
    };
  }, []);

  // 注册 overlay 事件监听器
  useEffect(() => {
    if (typeof window === 'undefined') return;
    initialize(window);

    addOverlayListener('ChangeZone', zoneChangeCallback);
    addOverlayListener('ChangePrimaryPlayer', primaryPlayerChangeCallback);
    addOverlayListener('LogLine', loglineCallback);

    startOverlayEvents();


    return () => {
      removeOverlayListener('ChangeZone', zoneChangeCallback);
      removeOverlayListener('ChangePrimaryPlayer', primaryPlayerChangeCallback);
      removeOverlayListener('LogLine', loglineCallback);
    };
  }, [
    zoneChangeCallback, loglineCallback, primaryPlayerChangeCallback,
    initialize, addOverlayListener, removeOverlayListener, startOverlayEvents,
  ]);

  // 注册战斗成员监听器
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const watchCombatants = setInterval(async () => {
      if (!onConflict && !zone) return;
      const combatants = await getCombatants();
      combatants?.forEach(combatant => {
        const playerId = combatant.ID.toString(16).toUpperCase()
        playerMapJob[playerId] = combatant.Job
        playerMapFull[playerId] = combatant
      })
    }, 1500);

    return () => {
      clearInterval(watchCombatants);
    }
  }, [
    getCombatants, onConflict, zone,
  ])

  const value = {
    appConfig,
    playerId,
    playerName,
    onConflict,
    zone,
    gc,
    ptMax,
    dummy,
    frontlineLog,
    showDamageInKD,
    setShowDamageInKD,
    collapsed,
    setCollapsed,
    activeTab,
    setActiveTab,
    showToast,
    getGcPoint,
    getGcIncreaseSpeed,
    getKnockouts,
    getDeaths,
    formatTime,
    getPointCards,
    lockSituationMsg,
    handleCopySituation,
    resolveLog,
    goodboys,
    badboys
  };

  return (
    <OverlayDataContext.Provider value={value}>
      {children}
    </OverlayDataContext.Provider>
  );
};

export default OverlayDataProvider;