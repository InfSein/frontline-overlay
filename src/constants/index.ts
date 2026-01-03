export type ImportantActionConfig = [
  /**
   * 衡量技能成效的指标，多个指标之间用英文逗号分隔。
   * @指标表 hit | damage | heal
   */
  measures: string,
  maxGapTime?: number
]

export const ImportantActions = {
  '圣盾阵': [ 'hit,damage' ],
  '蛮荒崩裂': [ 'hit,damage' ],
  // '尽毁': [ 'hit,damage' ],
  // '混沌旋风': [ 'hit,damage' ],
  '原初的怒震': [ 'hit,damage' ],
  '原初的怒号': [ 'hit' ],
  '腐秽大地': [ 'hit' ],
  // '腐秽黑暗': [ 'hit' ],
  '夜昏': [ 'hit,damage' ],
  // '命运之环': [ 'hit,damage' ],
  '命运之印': [ 'hit' ],
  '终结击': [ 'hit,damage' ],
  '涤罪之心': [ 'hit,damage' ],
  '神谕': [ 'hit,damage' ],
  '发炎III': [ 'hit,damage' ],
  '天穹破碎': [ 'hit,damage' ],
  '劫火灭却之术': [ 'hit,damage' ],
  '斩铁剑': [ 'hit,damage' ],
  '暗夜游魂': [ 'hit' ],
  '蛇鳞击': [ 'hit,damage,heal' ],
  '血气蛇鳞击': [ 'hit,damage,heal' ],
  '吞天巨蛇': [ 'hit,damage' ],
  '英雄的返场余音': [ 'hit,damage' ],
  '行列舞': [ 'hit' ],
  // '刃舞·终': [ 'hit,damage' ],
  '耀星': [ 'hit,damage' ],
  '霜星': [ 'hit,damage' ],
  '百万核爆': [ 'hit,damage' ],
  '荆棘环绕': [ 'hit,damage' ],
  '南天十字': [ 'hit,damage' ],
} as Record<string, ImportantActionConfig>
