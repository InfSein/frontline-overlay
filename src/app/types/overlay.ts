/**
 * 事件类型
 * 参考：[HERE](https://overlayplugin.github.io/OverlayPlugin/devs_cn/event_types.html)
 * @val `CombatData` — `战斗数据`
 * @val `LogLine` — `日志行`
 * @val `ImportedLogLines` — `导入日志行`
 * @val `ChangeZone` — `区域变更`
 * @val `ChangePrimaryPlayer` — `当前玩家变更`
 * @val `OnlineStatusChanged` — `在线状态变更`
 * @val `PartyChanged` — `小队变更`
 * @val `BroadcastMessage` — `广播消息`
 */
export type OverlayEvent = "CombatData" | "LogLine" | "ImportedLogLines" | 
  "ChangeZone" | "ChangePrimaryPlayer" | "OnlineStatusChanged" | "PartyChanged" | "BroadcastMessage"

export type ChangeZoneData = {
  type: "ChangeZone"
  zoneID: number
  zoneName: string
}
export type ChangePrimaryPlayerData = {
  type: "ChangePrimaryPlayer"
  charID: number
  charName: string
}
export type LoglineData = {
  type: "LogLine"
  line: string[]
  rawLine: string
}

export interface OverlayCombatant {
    OwnerID: number;
  Type: number;
  MonsterType: number;
  Status: number;
  AggressionStatus: number;
  IsTargetable: boolean;
  Name: string;
  Radius: number;
  BNpcID: number;
  CurrentMP: number;
  IsCasting1: number;
  BNpcNameID: number;
  TransformationId: number;
  WeaponId: number;
  TargetID: number;
  ModelStatus: number;
  ID: number;
  Job: number;
  CurrentHP: number;
  MaxHP: number;
  PosX: number;
  PosY: number;
  PosZ: number;
  Heading: number;
  Distance: string;
  EffectiveDistance: string;
  Effects: {
    BuffID: number;
    Stack: number;
    Timer: number;
    ActorID: number;
    isOwner: boolean;
  }[];
  MaxMP: number;
  Level: number;
  WorldID: number;
  CurrentWorldID: number;
  NPCTargetID: number;
  CurrentGP: number;
  MaxGP: number;
  CurrentCP: number;
  MaxCP: number;
  PCTargetID: number;
  IsCasting2: number;
  CastBuffID: number;
  CastTargetID: number;
  CastGroundTargetX: number;
  CastGroundTargetY: number;
  CastGroundTargetZ: number;
  CastDurationCurrent: number;
  CastDurationMax: number;
  PartyType: number;
  WorldName: string;
}
