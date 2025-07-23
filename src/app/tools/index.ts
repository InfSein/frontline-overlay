import { Frontline, GrandCompany } from '@/app/types'

export const getGrandCompanyName = (gc: GrandCompany) => {
  switch (gc) {
    case GrandCompany.maelstrom: return '黑涡团'
    case GrandCompany.twinadder: return '双蛇党'
    case GrandCompany.immoflame: return '恒辉队'
  }
}

export const getGrandCompanyColor = (gc: GrandCompany) => {
  switch (gc) {
    case GrandCompany.maelstrom: return '#942110'
    case GrandCompany.twinadder: return '#9F9E44'
    case GrandCompany.immoflame: return '#285FB7'
  }
}

export const getGrandCompanyFlag = (gc: GrandCompany) => {
  return `./image/${gc}.png`
}

/**
 * 获取纷争前线的名称信息
 * @returns [简称, 全称, 类型]
 */
export const getFrontlineNames = (fl: Frontline) => {
  switch (fl) {
    case Frontline.secure: return ['阵地', '周边遗迹群', '阵地战'] as const
    case Frontline.seize: return ['尘封', '尘封秘岩', '争夺战'] as const
    case Frontline.shatter: return ['碎冰', '荣誉野', '碎冰战'] as const
    case Frontline.naadam: return ['草原', '昂萨哈凯尔', '竞争战'] as const
  }
}

/**
 * 从 ACT 网络日志行中获取技能伤害量
 * @returns hit: 是否命中, damage: 伤害量
 */
export const getActionDamageFromLogLine = (logline: string[]) => {
  let hit = false; let damage = 0
  const mightIndex = [8, 10, 12, 14, 16, 18, 20, 22] as const
  mightIndex.forEach(index => {
    if (isDamage(logline[index])) {
      hit = true
      damage = parseDamage(logline[index + 1])
      return
    }
  })
  return { hit, damage }

  function isDamage(logStr: string) {
    return (logStr || '').toString().endsWith('3')
  }
  function parseDamage(damageStr: string) {
    const paddedDamageX16 = (damageStr || '').padStart(8, '0')
    if (paddedDamageX16[4] !== '4') {
      const prefix = paddedDamageX16.slice(0, 4)
      return parseInt(prefix, 16)
    } else {
      const A = paddedDamageX16.slice(0, 2)
      const B = paddedDamageX16.slice(2, 4)
      const D = paddedDamageX16.slice(6, 8)
      const bVal = parseInt(B, 16)
      const dVal = parseInt(D, 16)
      const diff = (bVal - dVal + 256) % 256
      const resultHex = D + A + diff.toString(16).padStart(2, '0').toUpperCase()
      return parseInt(resultHex, 16)
    }
  }
}