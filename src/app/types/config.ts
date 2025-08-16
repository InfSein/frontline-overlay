import { Component } from "react"
import { assignDefaults } from "../tools"
import { AppTextUi } from "."

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

export interface ConfigGroup {
  key: string
  name: string
  icon: Component
  items: ConfigItem[]
}
export interface ConfigItem {
  key: keyof AppConfig
  name: string
  desc: (AppTextUi | string)[]
}
