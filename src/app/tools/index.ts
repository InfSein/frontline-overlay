import { AppVersionInfo, CrystalConflict, Frontline, GrandCompany } from '@/app/types'

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

export const getGrandCompanyFlag = (gc: GrandCompany) => {
  return `./image/${gc}.png`
}

/**
 * 获取纷争前线的名称信息
 * @returns [简称, 全称, 类型]
 */
export const getFrontlineNames = (fl: Frontline | CrystalConflict) => {
  switch (fl) {
    case Frontline.secure: return ['阵地', '周边遗迹群', '阵地战'] as const
    case Frontline.seize: return ['尘封', '尘封秘岩', '争夺战'] as const
    case Frontline.shatter: return ['碎冰', '荣誉野', '碎冰战'] as const
    case Frontline.naadam: return ['草原', '昂萨哈凯尔', '竞争战'] as const
    case CrystalConflict.palaistra: return ['学校', '角力学校', '水晶冲突'] as const
    case CrystalConflict.cloudnine: return ['云端', '九霄云上', '水晶冲突'] as const
    case CrystalConflict.volcanic: return ['火山', '火山之心', '水晶冲突'] as const
    case CrystalConflict.castletown: return ['大殿', '机关大殿', '水晶冲突'] as const
    case CrystalConflict.redsands: return ['沙漠', '赤土红沙', '水晶冲突'] as const
  }
}

export const getFrontlineForeColor = (fl: Frontline | CrystalConflict) => {
  switch (fl) {
    case Frontline.shatter:
    case CrystalConflict.redsands:
      return 'black' as const
    default: return undefined
  }
}
export const getFrontlineBackgroundColor = (fl: Frontline | CrystalConflict) => {
  switch (fl) {
    case Frontline.secure: return '#776154' as const
    case Frontline.seize: return '#44756A' as const
    case Frontline.shatter: return '#F6F9F6' as const
    case Frontline.naadam: return '#616D22' as const
    case CrystalConflict.palaistra: return '#1E3743' as const
    case CrystalConflict.cloudnine: return '#56849B' as const
    case CrystalConflict.volcanic: return '#976E5A' as const
    case CrystalConflict.castletown: return '#211B19' as const
    case CrystalConflict.redsands: return '#EAC38C' as const
  }
}

export const getFrontlineBackground = (fl: Frontline | CrystalConflict) => {
  return `./image/${fl}.webp`
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
    return (logStr || '').toString().endsWith('3') || logStr === '3D' || logStr === '4'
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