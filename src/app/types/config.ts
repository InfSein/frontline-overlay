import { assignDefaults } from "../tools"

export interface AppConfig {
  // #region 通用
  auto_collapse_when_launch: boolean
  // #endregion
}

const defaultAppConfig : AppConfig = {
  auto_collapse_when_launch: false,
}

export const fixAppConfig = (appConfig?: AppConfig) => {
  // 处理特定环境下的设置项
  if (!appConfig) {
    appConfig = {} as AppConfig
  }
  
  // 处理其他的设置项
  return assignDefaults(defaultAppConfig, appConfig || {}) as AppConfig
}