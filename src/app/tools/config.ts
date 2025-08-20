import { _APP_CONFIG_STORAGE_KEY } from "../store/keys"
import { AppConfig, fixAppConfig } from "../types/config"

export const loadConfig = () => {
  try {
    const cache = localStorage.getItem(_APP_CONFIG_STORAGE_KEY)
    if (cache) {
      const cacheObj = JSON.parse(cache) as AppConfig
      return fixAppConfig(cacheObj)
    }
  } catch {}
  return fixAppConfig()
}

export const saveConfig = (appConfig: AppConfig) => {
  const cache = JSON.stringify(appConfig)
  localStorage.setItem(_APP_CONFIG_STORAGE_KEY, cache)
}