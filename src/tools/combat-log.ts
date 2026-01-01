import StorageKeys from "@/stores/keys"
import { getItem, removeItem, setItem } from '@/stores/storage'
import { deepCopy, formatDate } from "."
import type { FrontlineLog } from "@/types/combat"

const key = StorageKeys.CombatLog

interface StoragedCombatLog {
  date: string
  logs: FrontlineLog[]
}

export const loadCombatLogs = () => {
  const date = formatDate(Date.now())
  const log = getItem<StoragedCombatLog>(key)
  if (!log || log.date !== date) {
    removeItem(key)
    return []
  }
  return log.logs
}

export const saveCombatLogs = (logs: FrontlineLog[]) => {
  const date = formatDate(Date.now())
  setItem(key, {
    date: date, logs: deepCopy(logs)
  })
}

export const addCombatLog = (log: FrontlineLog) => {
  let currStoraged = getItem<StoragedCombatLog>(key)
  currStoraged ??= {
    date: formatDate(Date.now()),
    logs: []
  }
  currStoraged.logs.push(deepCopy(log))
  setItem(key, currStoraged)
}
