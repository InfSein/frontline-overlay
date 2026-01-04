/* eslint-disable */
// @ts-nocheck

// 这个文件通过 unplugin-auto-import 生成。
// * 当你对项目引用的 naive-ui 组件进行了增加/减少时，
// * 请执行 build, 然后将生成的 src/components.d.ts 的内容复制到这个文件中。

export {}

/* prettier-ignore */
declare module 'vue' {
  export interface GlobalComponents {
    NButton: typeof import('naive-ui')['NButton']
    NCard: typeof import('naive-ui')['NCard']
    NDivider: typeof import('naive-ui')['NDivider']
    NFloatButton: typeof import('naive-ui')['NFloatButton']
    NIcon: typeof import('naive-ui')['NIcon']
    NInput: typeof import('naive-ui')['NInput']
    NInputNumber: typeof import('naive-ui')['NInputNumber']
    NSelect: typeof import('naive-ui')['NSelect']
    NSlider: typeof import('naive-ui')['NSlider']
    NSwitch: typeof import('naive-ui')['NSwitch']
    NTooltip: typeof import('naive-ui')['NTooltip']
  }
}
