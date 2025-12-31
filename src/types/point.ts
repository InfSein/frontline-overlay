export type PointTextRegexMatch = {
  /** 匹配的正则 */
  match: RegExp,
  /**
   * 匹配的索引
   * @固定顺序 [pt，ptLv, owner]
   * @pt 据点名
   * @ptLv 据点等级
   * @owner 占领的阵营
   */
  indexes: number[],
}
export type PointConfigSeize = {
  mode: "seize"
  neutralMatch: PointTextRegexMatch
  conquerMatch: PointTextRegexMatch
  pauseMatch: PointTextRegexMatch
  cleanMatch: PointTextRegexMatch
  getFp: (ptLv: string) => [number, number]
  ptMax: {
    initial: number,
    changeEvents?: { msg: string; changeTo: number; }[]
  }
}
export type PointConfigNaadam = {
  mode: "naadam"
  initialMatch: PointTextRegexMatch
  neutralMatch: PointTextRegexMatch
  conquerMatch: PointTextRegexMatch
  cleanMatch: PointTextRegexMatch
  getFp: (ptLv: string) => [number, number]
}
export type PointConfigSecure = {
  mode: "secure"
  conquerMatch: PointTextRegexMatch
  pauseMatch: PointTextRegexMatch
}
