export interface AppVersionInfo {
  app: string
}

export interface AppTextUi {
  content: string
  className?: string
  style?: React.CSSProperties
}

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

export interface FrontlineLog {
  zone: Frontline | CrystalConflict
  result?: "1st" | "2nd" | "3rd"
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