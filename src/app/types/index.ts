export interface AppVersionInfo {
  app: string
}

export interface AppTextUi {
  content: string
  className?: string
  style?: React.CSSProperties
}

export const AppConstants = {
  githubRepo: 'https://github.com/InfSein/frontline-overlay',
  changelogDoc: 'https://github.com/InfSein/frontline-overlay/blob/master/CHANGELOG.md',
} as const

/**
 * 大国防联军
 */
export enum GrandCompany {
  /** 黑涡团 */
  maelstrom = "maelstrom",
  /** 双蛇党 */
  twinadder = "twinadder",
  /** 恒辉队 */
  immoflame = "immoflame",
}

export type PvPBattle = Frontline | RivalWings | CrystalConflict
export enum Frontline {
  /** 周边遗迹群（阵地战） */
  secure = "secure",
  /** 尘封秘岩（争夺战） */
  seize = "seize",
  /** 荣誉野（碎冰战） */
  shatter = "shatter",
  /** 昂萨哈凯尔（竞争战） */
  naadam = "naadam",
}
export enum RivalWings {
  /** 隐塞（机动战） */
  hiddengorge = "hiddengorge",
}
export enum CrystalConflict {
  /** 角力学校 */
  palaistra = "palaistra",
  /** 九霄云上 */
  cloudnine = "cloudnine",
  /** 火山之心 */
  volcanic = "volcanic",
  /** 机关大殿 */
  castletown = "castletown",
  /** 赤土红沙 */
  redsands = "redsands",
}

const GameZones = {
  frontline: {
    /** 周边遗迹群（阵地战） */
    secure: 1273,
    /** 尘封秘岩（争夺战） */
    seize: 431,
    /** 荣誉野（碎冰战） */
    shatter: 554,
    /** 昂萨哈凯尔（竞争战） */
    naadam: 888,
  },
  rivalWings: {
    /** 隐塞（机动战） */
    hiddengorge: 791,
  },
  crystalConflict: {
    /** 角力学校 */
    palaistra: [1032, 1058],
    /** 九霄云上 */
    cloudnine: [1034, 1060],
    /** 火山之心 */
    volcanic: [1033, 1059],
    /** 机关大殿 */
    castletown: [1116, 1117],
    /** 赤土红沙 */
    redsands: [1138, 1139],
  }
}
export const GameZonesMap = new Map<number, PvPBattle>([
  // frontline
  [GameZones.frontline.secure, Frontline.secure],
  [GameZones.frontline.seize, Frontline.seize],
  [GameZones.frontline.shatter, Frontline.shatter],
  [GameZones.frontline.naadam, Frontline.naadam],

  // rivalWings
  [GameZones.rivalWings.hiddengorge, RivalWings.hiddengorge],

  // crystalConflict
  ...Object.entries(GameZones.crystalConflict).flatMap(([key, ids]) =>
    ids.map(
      (id): [number, CrystalConflict] => [id, CrystalConflict[key as keyof typeof CrystalConflict]]
    )
  ),
])

export type FrontlineResult = "1st" | "2nd" | "3rd" | "win" | "lose"
export interface FrontlineLog {
  zone: PvPBattle
  result?: FrontlineResult
  start_time: number
  knockouts: DeathInfo[]
  deaths: DeathInfo[]
}

export interface DeathInfo {
  happenTime: number;
  victimName: string;
  perpetratorName: string;
  summonedBy?: string;
  lasthitActionName: string;
}