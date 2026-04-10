<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  SaveFilled,
  WarningRound,
  SettingsApplicationsSharp,
  MonitorHeartFilled,
  FlagFilled,
  AddRound, RemoveRound,
} from '@vicons/material'
import AppInfo from '@/constants/app-info'
import { type AppConfig, type ConfigGroup } from '@/types/config'
import { deepCopy } from '@/tools'
import { useStore } from '@/stores'

const store = useStore()

const groups = computed(() : ConfigGroup[] => {
  return [
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
            '调整此项目后，需要刷新一次悬浮窗才能生效。',
          ],
          type: 'slider-number',
          min: 0.5, max: 2, step: 0.1,
        },
        {
          key: 'auto_collapse_when_launch',
          name: '启动时自动折叠',
          desc: [
            '在悬浮窗初次加载时自动折叠悬浮窗。',
            '※ 启用此项目时，刷新悬浮窗也会自动折叠。'
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
            '在离开对战区域（从PvP区域进入PvE区域）时自动折叠悬浮窗。',
            '※ 「初次加载」和「从一个PvE区域进入另一个PvE区域」的场合不会触发折叠。',
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
            '调整“当前据点”中各个据点卡片的布局样式。',
            '　> 现代：每行展示多个卡片，提高信息密度；',
            '　> 经典：每行展示一个卡片，维持旧版本习惯。',
          ],
          type: 'select',
          options: [
            { label: '现代', value: 'modern' },
            { label: '经典', value: 'classic' },
          ]
        },
        {
          key: 'watched_players',
          name: '关注列表',
          beta: true,
          desc: [
            '关注让你印象深刻的玩家，并为其设置简短的备注。',
            '战斗开始时会自动扫描己方团队，并展示被你关注的玩家和你对他的备注。',
            '玩家名格式为“玩家名”或“玩家名@服务器名”。',
            {
              className: 'text-orange-600',
              content: '※ 不会扫描敌方阵营，也不会扫描中途参战的友方玩家。',
            },
            {
              className: 'text-red-600',
              content: `※ 目前最多只能关注${AppInfo.balanceConstants.watchedPlayersMaxCount}名玩家。`,
            },
          ],
          type: 'watched-players',
          maxCount: AppInfo.balanceConstants.watchedPlayersMaxCount,
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
          name: '仇怨阈值',
          desc: [
            '设置一个10000～99999之间的数字作为阈值。',
            '当你受到超过阈值的伤害时，即使此技能不在“蒙怨”／“结怨”所监控的阻碍技能之列，也仍然会进入统计。',
          ],
          type: 'number',
          min: 10000, max: 99999,
          step: 1000, decimalPlaces: 0,
        },
      ]
    },
  ]
})

const formConfig = ref<AppConfig>(store.appConfig)
const groupCollapsed = ref<Record<string, boolean>>({})

onMounted(() => {
  formConfig.value = deepCopy(store.appConfig)
  groupCollapsed.value = Object.fromEntries(groups.value.map(group => [group.key, false]))
  if (!formConfig.value.watched_players?.length) {
    formConfig.value.watched_players = [{ name: '', note: '' }]
  }
})

const handleAddWatchedPlayer = () => {
  formConfig.value.watched_players.push({ name: '', note: '' })
}
const handleRemoveWatchedPlayer = (index: number) => {
  formConfig.value.watched_players.splice(index, 1)
}

const handleSave = () => {
  if (formConfig.value.watched_players.length) {
    formConfig.value.watched_players = formConfig.value.watched_players.filter(wp => wp.name.trim())
  }
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
          class="flex items-start justify-between px-1 py-2 hover:bg-gray-100 transition-colors"
        >
          <div class="flex flex-col">
            <div class="flex items-center gap-1 text-base font-medium">
              {{ item.name }}
              <n-tooltip v-if="item.beta" :show-arrow="false">
                <template #trigger>
                  <n-icon size="16" color="#F0A020"><WarningRound /></n-icon>
                </template>
                该项目还有待评估，后续版本可能视情况大规模更改甚至删除。
              </n-tooltip>
            </div>
            <div v-if="item.desc">
              <template v-for="(descItem, descIndex) in item.desc" :key="`${item.key}-${descIndex}`">
                <div v-if="typeof descItem === 'string'" class="text-xs text-gray-500">{{ descItem }}</div>
                <div v-else :class="'text-xs text-gray-500 ' + (descItem.className || '')" :style="descItem.style">{{ descItem.content }}</div>
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
            <!-- 关注玩家 -->
            <div v-else-if="item.type === 'watched-players'" class="w-96 ml-1">
              <div
                v-for="(wp, wpIndex) in formConfig.watched_players"
                :key="wpIndex"
                class="flex items-center gap-x-1 mb-1"
              >
                <n-input
                  v-model:value="wp.name"
                  class="flex-1"
                  title="玩家名"
                  placeholder="玩家名"
                />
                <n-input
                  v-model:value="wp.note"
                  class="max-w-44"
                  title="备注(选填)"
                  placeholder="备注(选填)"
                />
                <n-button
                  ghost
                  type="error"
                  title="删除该行"
                  @click="handleRemoveWatchedPlayer(wpIndex)"
                >
                  <template #icon><n-icon><RemoveRound /></n-icon></template>
                </n-button>
              </div>
              <div v-if="formConfig.watched_players.length < item.maxCount" class="flex items-center justify-end w-full">
                <n-button type="primary" class="w-32" @click="handleAddWatchedPlayer">
                  <template #icon><n-icon><AddRound /></n-icon></template>
                  添加关注
                </n-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FoldableCard>
  </div>
</template>

<style scoped>
</style>
