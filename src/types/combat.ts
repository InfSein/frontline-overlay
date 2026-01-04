import type { GrandCompany, PvPBattle } from ".";

export interface PointInfo {
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

export interface StaticPointInfo {
  type: 'static';
  owner?: GrandCompany;
}

export interface InitialPointInfo {
  type: 'initial';
  time?: {
    remain: number;
    total: number;
  };
  ptLv: string;
  ptTotal: number;
  cancel: () => void;
}

export interface PrePointInfo {
  key: string;
  remain: number;
  total: number;
}

export interface LasthitInfo {
  perpetratorName: string;
  victimName: string;
  hitActionName: string;
  hitActionDamage: number;
  hitActionInstantDeath?: boolean;
}

export interface SelfActionLog {
  happenTime: number;
  targetName: string;
  targetJob?: number;
  actionName: string;
  actionDamage: number;
  actionInstantDeath?: boolean;
}

export interface IarLog {
  happenTime: number;
  actionName: string;
  actionTargets: string[];
  totalDamage: number;
  totalHeal: number;
}

export type FrontlineResult = "1st" | "2nd" | "3rd" | "win" | "lose"
export interface FrontlineLog {
  zone: PvPBattle
  job?: number
  result?: FrontlineResult
  start_time: number
  knockouts: DeathInfo[]
  deaths: DeathInfo[]
}

export interface DeathInfo {
  happenTime: number;
  victimName: string;
  perpetratorName: string;
  victimJob?: number;
  perpetratorJob?: number;
  summonedBy?: string;
  lasthitActionName: string;
  lasthitActionDamage: number;
  lasthitActionInstantDeath?: boolean;
}
