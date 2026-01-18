export type ImportantActionConfig = [
  /**
   * 衡量技能成效的指标，多个指标之间用英文逗号分隔。
   * @指标表 hit | exec | damage | heal
   */
  measures: string,
  maxGapTime?: number
]

export const ImportantActions = {
  // * TANK
  '圣盾阵': [ 'hit,damage', 4500 ],
  '蛮荒崩裂': [ 'hit,damage' ],
  '原初的怒震': [ 'hit,damage' ],
  '原初的怒号': [ 'hit' ],
  '腐秽大地': [ 'hit' ],
  '夜昏': [ 'hit,damage' ],
  '命运之印': [ 'hit' ],
  '连续剑': [ 'hit,damage', 4500 ],
  '终结击': [ 'hit,damage' ],
  // * HEALER
  '坚石肤': [ 'hit' ],
  '涤罪之心': [ 'hit,damage' ],
  '炽天附体': [ 'hit' ],
  '星河漫天': [ 'hit' ],
  '神谕': [ 'hit,damage' ],
  '发炎III': [ 'hit,damage' ],
  // * DPS(MELEE)
  '天穹破碎': [ 'hit,damage' ],
  '星遁天诛': [ 'exec', 30000 ],
  '劫火灭却之术': [ 'hit,damage' ],
  '斩铁剑': [ 'hit,damage' ],
  '暗夜游魂': [ 'hit' ],
  '蛇鳞击': [ 'hit,damage,heal' ],
  '血气蛇鳞击': [ 'hit,damage,heal' ],
  '吞天巨蛇': [ 'hit,damage' ],
  // * DPS(RANGED)
  '英雄的返场余音': [ 'hit,damage' ],
  '行列舞': [ 'hit' ],
  // * DPS(MAGIC)
  '彗星': [ 'hit,damage' ],
  '耀星': [ 'hit,damage' ],
  '霜星': [ 'hit,damage' ],
  '百万核爆': [ 'hit,damage' ],
  '荆棘环绕': [ 'hit,damage' ],
  '南天十字': [ 'hit,damage' ],

  // * SPECIAL
  '交叉光剑': [ 'hit,damage' ],
  '超大型导弹': [ 'hit,damage' ],
  '大火炎放射': [ 'hit,damage' ],
  '巨型光束炮': [ 'hit,damage' ],
} as Record<string, ImportantActionConfig>
