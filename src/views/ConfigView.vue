<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  SaveFilled,
  WarningRound,
  SettingsApplicationsSharp,
  MonitorHeartFilled,
  FlagFilled,
} from '@vicons/material'
import { type AppConfig, type ConfigGroup } from '@/types/config'
import { deepCopy } from '@/tools'
import { useStore } from '@/stores'

const store = useStore()

const groups: ConfigGroup[] = [
  {
    key: 'general',
    name: '通用',
    icon: SettingsApplicationsSharp,
    items: [
      {
        key: 'app_scale',
        name: '悬浮窗缩放',
        desc: [
          '调整悬浮窗的显示大小倍数。',
          '当你使用了infsein.github.io提供的其他悬浮窗时，请使用此处而非ACT的设置来调整缩放。',
        ],
        type: 'slider-number',
        min: 0.5, max: 2, step: 0.1,
      },
      {
        key: 'auto_collapse_when_launch',
        name: '启动时自动折叠',
        desc: [
          '在悬浮窗初次加载时自动折叠悬浮窗。',
          '这也包括刷新悬浮窗的场合。'
        ],
        type: 'switch',
      },
      {
        key: 'auto_expand_when_enter_battlefield',
        name: '进入对战时自动展开',
        desc: [
          '在对战开始时自动展开悬浮窗。',
        ],
        type: 'switch',
      },
      {
        key: 'auto_collapse_when_leave_battlefield',
        name: '离开对战时自动折叠',
        desc: [
          '在离开对战区域时自动折叠悬浮窗。',
          '初次加载或是在PvE区域内切换地图时不会触发。',
        ],
        type: 'switch',
      },
    ]
  },
  {
    key: 'situation',
    name: '战况',
    icon: FlagFilled,
    items: [
      {
        key: 'situation_pointcard_style',
        name: '“当前据点”布局',
        desc: [
          '设置“当前据点”中各个据点卡片的布局样式。',
          '　> 现代：每行展示多个卡片，提高信息密度；',
          '　> 经典：每行展示一个卡片，维持旧版本风格。',
        ],
        type: 'select',
        options: [
          { label: '现代', value: 'modern' },
          { label: '经典', value: 'classic' },
        ]
      },
    ]
  },
  {
    key: 'monitor',
    name: '监控',
    icon: MonitorHeartFilled,
    items: [
      {
        key: 'badboy_threshold',
        name: '坏人阈值',
        desc: [
          '设置一个10000～99999之间的数字作为阈值。',
          '当你受到超过阈值的伤害时，即使此技能不在坏人监控之列，也仍然会进入坏人统计。',
        ],
        type: 'number',
        min: 10000, max: 99999,
        step: 1000, decimalPlaces: 0,
      },
    ]
  },
]

const formConfig = ref<AppConfig>(store.appConfig)
const groupCollapsed = ref<Record<string, boolean>>({})

onMounted(() => {
  formConfig.value = deepCopy(store.appConfig)
  groupCollapsed.value = Object.fromEntries(groups.map(group => [group.key, false]))
})

const handleSave = () => {
  store.setAppConfig(formConfig.value)
  if (window.opener) {
    window.opener.postMessage(
      { type: "config:update" },
      window.location.origin
    )
  }
  window.close()
}

</script>

<template>
  <div class="p-6 max-w-4xl mx-auto space-y-4">
    <div class="text-2xl font-bold flex items-center">
      设置
      <div class="ml-auto">
        <n-button
          type="success"
          size="large"
          @click="handleSave"
        >
          <template #icon>
            <SaveFilled />
          </template>
          保存
        </n-button>
      </div>
    </div>
    <n-divider class="!my-1" />
    <FoldableCard
      v-for="group in groups"
      :key="group.key"
      :card-key="'config-group-' + group.key"
      show-card-border
    >
      <template #header>
        <div class="flex items-center gap-1.5">
          <n-icon size="24"><component :is="group.icon" /></n-icon>
          <span class="font-semibold">{{ group.name }}</span>
        </div>
      </template>
      <div class="divide-y divide-gray-100">
        <div
          v-for="item in group.items"
          :key="item.key"
          class="flex items-center justify-between px-1 py-2 hover:bg-gray-100 transition-colors"
        >
          <div class="flex flex-col">
            <div class="flex items-center gap-1 text-base font-medium">
              {{ item.name }}
              <n-tooltip v-if="item.beta" :show-arrow="false">
                <template #trigger>
                  <n-icon size="16" color="#F0A020"><WarningRound /></n-icon>
                </template>
                此设置项仅作测试之用，随时可能被更改或删除。
              </n-tooltip>
            </div>
            <div v-if="item.desc">
              <template v-for="(descItem, descIndex) in item.desc" :key="`${item.key}-${descIndex}`">
                <div v-if="typeof descItem === 'string'" class="text-xs text-gray-500">{{ descItem }}</div>
                <div v-else :class="descItem.className" :style="descItem.style">{{ descItem.content }}</div>
              </template>
            </div>
          </div>
          <div>
            <n-switch
              v-if="item.type === 'switch'"
              v-model:value="(formConfig as any)[item.key]"
            />
            <n-input
              v-else-if="item.type === 'string'"
              v-model:value="(formConfig as any)[item.key]"
              class="w-60"
            />
            <n-input-number
              v-else-if="item.type === 'number'"
              v-model:value="(formConfig as any)[item.key]"
              button-placement="both"
              :min="item.min" :max="item.max"
              :step="item.step"
              :precision="item.decimalPlaces"
              class="w-36 text-center"
            />
            <n-slider
              v-else-if="item.type === 'slider-number'"
              v-model:value="(formConfig as any)[item.key]"
              :min="item.min" :max="item.max"
              :step="item.step"
              class="min-w-36"
            />
            <n-select
              v-else-if="item.type === 'select'"
              v-model:value="(formConfig as any)[item.key]"
              :options="item.options"
              class="w-36"
            />
          </div>
        </div>
      </div>
    </FoldableCard>
  </div>
</template>

<style scoped>
</style>
