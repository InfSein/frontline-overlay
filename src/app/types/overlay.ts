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
  charID: string
  charName: string
}
export type LoglineData = {
  type: "LogLine"
  line: string[]
  rawLine: string
}
