import { assignDefaults } from "../tools"
import { AppTextUi } from "."

export interface AppConfig {
  // #region 通用
  /** 启动时自动折叠 */
  auto_collapse_when_launch: boolean
  /** 进入对战时自动展开 */
  auto_expand_when_enter_battlefield: boolean
  /** 离开对战时自动折叠 */
  auto_collapse_when_leave_battlefield: boolean
  // #endregion
  // #region 战况
  /** 隐藏复制点分按钮 */
  hide_situation_copy_btn: boolean
  // #endregion
}

const defaultAppConfig : AppConfig = {
  auto_collapse_when_launch: false,
  auto_expand_when_enter_battlefield: false,
  auto_collapse_when_leave_battlefield: false,
  hide_situation_copy_btn: false,
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
  icon: string
  items: ConfigItem[]
}
export type ConfigItem = ConfigItemSwitch | ConfigItemString | ConfigItemNumber | ConfigItemSelect
interface ConfigItemBase {
  key: keyof AppConfig
  name: string
  desc?: (AppTextUi | string)[]
}
interface ConfigItemSwitch extends ConfigItemBase {
  type: "switch"
}
interface ConfigItemString extends ConfigItemBase {
  type: "string"
}
interface ConfigItemNumber extends ConfigItemBase {
  type: "number"
}
interface ConfigItemSelect extends ConfigItemBase {
  type: "select"
  options: { label: string; value: string | number }[]
}
