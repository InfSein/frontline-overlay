import { assignDefaults } from "../tools"
import { type AppTextUi } from "."
import type { Component } from "vue"

export interface AppConfig {
  // #region 通用
  /** 悬浮窗缩放 */
  app_scale: number
  /** 启动时自动折叠 */
  auto_collapse_when_launch: boolean
  /** 进入对战时自动展开 */
  auto_expand_when_enter_battlefield: boolean
  /** 离开对战时自动折叠 */
  auto_collapse_when_leave_battlefield: boolean
  // #endregion
  // #region 战况
  // #endregion
  // #region 监控
  /** 坏人阈值 */
  badboy_threshold: number
  // #endregion

  // #region 隐藏的设置项
  /** FoldableCard 折叠情况 */
  ui_fold_cache: Record<string, boolean>
  // #endregion
}

export type AppConfigKey = keyof AppConfig;

const defaultAppConfig : AppConfig = {
  app_scale: 1,
  auto_collapse_when_launch: false,
  auto_expand_when_enter_battlefield: false,
  auto_collapse_when_leave_battlefield: false,
  badboy_threshold: 20000,
  ui_fold_cache: {},
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
export type ConfigItem = ConfigItemSwitch | ConfigItemString | ConfigItemNumber | ConfigItemSliderNumber | ConfigItemSelect
interface ConfigItemBase {
  key: AppConfigKey
  name: string
  desc?: (AppTextUi | string)[]
  beta?: boolean
}
interface ConfigItemSwitch extends ConfigItemBase {
  type: "switch"
}
interface ConfigItemString extends ConfigItemBase {
  type: "string"
}
interface ConfigItemNumber extends ConfigItemBase {
  type: "number"
  min?: number
  max?: number
  step?: number
  decimalPlaces?: number
}
interface ConfigItemSliderNumber extends ConfigItemBase {
  type: "slider-number"
  min: number
  max: number
  step: number
}
interface ConfigItemSelect extends ConfigItemBase {
  type: "select"
  options: { label: string; value: string | number }[]
}
