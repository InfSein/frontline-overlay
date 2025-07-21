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