import { AppVersionInfo, CrystalConflict, Frontline, FrontlineResult, GrandCompany, PvPBattle, RivalWings } from '@/app/types'

export const deepCopy = <T>(obj: T): T => {
  try {
    return JSON.parse(JSON.stringify(obj))
  } catch (e) {
    console.warn('Deep copy failed due to', e, '\norigin:', obj)
    return obj
  }
}
export const assignDefaults = (defaultVal: any, currentVal: any) => {
  for (const key in defaultVal) {
    if (Object.prototype.hasOwnProperty.call(defaultVal, key) && key !== '__proto__' && key !== 'constructor') {
      if (typeof defaultVal[key] === 'object' && !Array.isArray(defaultVal[key]) && defaultVal[key] !== null) {
        if (!Object.prototype.hasOwnProperty.call(currentVal, key)) {
          currentVal[key] = {};
        }
        currentVal[key] = assignDefaults(defaultVal[key], currentVal[key]);
      } else {
        currentVal[key] = currentVal[key] !== undefined ? currentVal[key] : defaultVal[key];
      }
    }
  }
  return currentVal;
}

export const checkAppUpdates = async () => {
  let url = document?.location?.origin + document.location.pathname + 'version.json'
  url += `?t=${new Date().getTime()}`
  const response = await fetch(url).then(response => response.json()) as AppVersionInfo
  const needUpdate = response.app !== process.env.APP_VERSION
  return {
    needUpdate,
    latestVersion: response.app,
  }
}

/*
export const captureAndCopy = async (element: HTMLElement) => {
  try {
    const canvas = await html2canvas(element)
    const dataUrl = canvas.toDataURL('image/png')
    console.log('dataUrl:', dataUrl)
    const res  = await copyImageToClipboard(dataUrl)
    console.log('res:', res)
    return ''
  } catch (err: any) {
    console.error('captureAndCopy failed:', err)
    return err.message as string
  }
}
*/

export const copyToClipboard = (text: string) => {
  const textarea = document.createElement('textarea')
  textarea.value = text
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
}
export const copyImageToClipboard = async (src: string) => {
  return new Promise<"OK">((resolve, reject) => {
    const img = document.createElement('img')

    img.onload = () => {
      const div = document.createElement('div')
      div.style.position = 'fixed'
      div.style.left = '-9999px'
      div.appendChild(img)
      document.body.appendChild(div)

      const range = document.createRange()
      range.selectNode(img)
      const selection = window.getSelection()
      if (!selection) {
        reject(new Error('无法获取 selection 对象'))
        return
      }
      selection.removeAllRanges()
      selection.addRange(range)

      const ok = document.execCommand('copy')
      document.body.removeChild(div)
      selection.removeAllRanges()

      if (ok) resolve("OK")
      else reject(new Error('execCommand copy 失败'))
    }

    img.onerror = () => reject(new Error('图片加载失败'))

    img.src = src
  })
}

export const formatTimestamp = (ts: number) => {
  const date = new Date(ts)
  const pad = (n: number) => n.toString().padStart(2, '0')

  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hour = pad(date.getHours())
  const minute = pad(date.getMinutes())
  const second = pad(date.getSeconds())

  return `${year}-${month}-${day} ${hour}:${minute}:${second}`
}

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
export const getGrandCompanySubColor = (gc: GrandCompany) => {
  switch (gc) {
    case GrandCompany.maelstrom: return 'rgba(148,33,16,0.4)'
    case GrandCompany.twinadder: return 'rgba(159,158,68,0.4)'
    case GrandCompany.immoflame: return 'rgba(40,95,183,0.4)'
  }
}

export const getGrandCompanyFlag = (gc: GrandCompany) => {
  return `./image/${gc}.png`
}

export const getJobInfo = (job: number | undefined) => {
  let job_name = '', job_icon = ''
  switch (job) {
    case 19:
      job_name = '骑士'; job_icon = 'paladin'; break
    case 20:
      job_name = '武僧'; job_icon = 'monk'; break
    case 21:
      job_name = '战士'; job_icon = 'warrior'; break
    case 22:
      job_name = '龙骑士'; job_icon = 'dragoon'; break
    case 23:
      job_name = '吟游诗人'; job_icon = 'bard'; break
    case 24:
      job_name = '白魔法师'; job_icon = 'whitemage'; break
    case 25:
      job_name = '黑魔法师'; job_icon = 'blackmage'; break
    case 27:
      job_name = '召唤师'; job_icon = 'summoner'; break
    case 28:
      job_name = '学者'; job_icon = 'scholar'; break
    case 30:
      job_name = '忍者'; job_icon = 'ninja'; break
    case 31:
      job_name = '机工士'; job_icon = 'machinist'; break
    case 32:
      job_name = '暗黑骑士'; job_icon = 'darkknight'; break
    case 33:
      job_name = '占星术士'; job_icon = 'astrologian'; break
    case 34:
      job_name = '武士'; job_icon = 'samurai'; break
    case 35:
      job_name = '赤魔法师'; job_icon = 'redmage'; break
    case 37:
      job_name = '绝枪战士'; job_icon = 'gunbreaker'; break
    case 38:
      job_name = '舞者'; job_icon = 'dancer'; break
    case 39:
      job_name = '钐镰客'; job_icon = 'reaper'; break
    case 40:
      job_name = '贤者'; job_icon = 'sage'; break
    case 41:
      job_name = '蝰蛇剑士'; job_icon = 'viper'; break
    case 42:
      job_name = '绘灵法师'; job_icon = 'pictomancer'; break
    default:
      job_name = '未知'; job_icon = 'none'; break
  }
  return { job_name, job_icon }
}

/**
 * 获取纷争前线的名称信息
 * @returns [简称, 全称, 类型]
 */
export const getFrontlineNames = (fl: PvPBattle) => {
  switch (fl) {
    case Frontline.secure: return ['阵地', '周边遗迹群', '阵地战'] as const
    case Frontline.seize: return ['尘封', '尘封秘岩', '争夺战'] as const
    case Frontline.shatter: return ['碎冰', '荣誉野', '碎冰战'] as const
    case Frontline.naadam: return ['草原', '昂萨哈凯尔', '竞争战'] as const
    case Frontline.triumph: return ['胜利', '沃刻其特', '演习战'] as const
    case RivalWings.hiddengorge: return ['隐塞', '隐塞', '机动战'] as const
    case CrystalConflict.palaistra: return ['学校', '角力学校', '水晶冲突'] as const
    case CrystalConflict.cloudnine: return ['九霄', '九霄云上', '水晶冲突'] as const
    case CrystalConflict.volcanic: return ['火山', '火山之心', '水晶冲突'] as const
    case CrystalConflict.castletown: return ['大殿', '机关大殿', '水晶冲突'] as const
    case CrystalConflict.redsands: return ['沙漠', '赤土红沙', '水晶冲突'] as const
  }
}

export const getFrontlineForeColor = (fl: PvPBattle) => {
  switch (fl) {
    case Frontline.shatter:
    case CrystalConflict.redsands:
      return 'black' as const
    default: return undefined
  }
}
export const getFrontlineBackgroundColor = (fl: PvPBattle) => {
  switch (fl) {
    case Frontline.secure: return '#776154' as const
    case Frontline.seize: return '#44756A' as const
    case Frontline.shatter: return '#F6F9F6' as const
    case Frontline.naadam: return '#616D22' as const
    case Frontline.triumph: return '#418CBF' as const
    case RivalWings.hiddengorge: return '#946141' as const
    case CrystalConflict.palaistra: return '#1E3743' as const
    case CrystalConflict.cloudnine: return '#56849B' as const
    case CrystalConflict.volcanic: return '#976E5A' as const
    case CrystalConflict.castletown: return '#211B19' as const
    case CrystalConflict.redsands: return '#EAC38C' as const
  }
}

export const getFrontlineResultBackgroundColor = (result: FrontlineResult) => {
  switch (result) {
    case '1st': return '#FFD700'
    case '2nd': return '#C0C0C0'
    case '3rd': return '#CD7F32'
    case 'win': return '#4CAF50'
    case 'lose': return '#F44336'
    default: return '#FFFFFF'
  }
}

export const getFrontlineBackground = (fl: PvPBattle) => {
  return `./image/${fl}.webp`
}

export const getSecurePointIncrease = (ptAmount: number) => [0, 2, 4, 6, 10, 12, 14, 18, 20, 22][ptAmount] ?? 0

/**
 * 从 ACT 网络日志行中获取技能伤害量
 * @returns hit: 是否命中, damage: 伤害量
 */
export const getActionDamageFromLogLine = (logline: string[]) => {
  let hit = false
  let damageType: "damage" | "heal" | "both" | undefined = undefined
  let damage = 0, heal = 0
  const mightIndex = [8, 10, 12, 14, 16, 18, 20, 22] as const
  mightIndex.forEach(index => {
    const logType = logline[index]; const logVal = logline[index + 1]
    if (logType === '0') return

    const { dodgeOrMiss, damaged, healed } = parseLog(logType)
    if (!dodgeOrMiss) {
      hit = true
      if (damaged) {
        if (!damageType) damageType = 'damage'
        else if (damageType === 'heal') damageType = 'both'
        damage += parseDamage(logVal)
      }
      if (healed) {
        if (!damageType) damageType = 'heal'
        else if (damageType === 'damage') damageType = 'both'
        heal += parseDamage(logVal)
      }
    }
  })
  damageType ??= 'damage' as "damage" | "heal" | "both"
  return { hit, damageType, damage, heal }

  function parseLog(logType: string) {
    const effectType = parseInt((logType || '0'), 16)
    return {
      dodgeOrMiss: (effectType & 0xF) === 0x01,
      damaged: (effectType & 0xF) === 0x03,
      healed: (effectType & 0xF) === 0x04,
      damageBlocked: (effectType & 0xF) === 0x05,
      damageParried: (effectType & 0xF) === 0x06,
      instantDead: (effectType & 0xFF) === 0x33,
    }
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