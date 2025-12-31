<script setup lang="ts">
import {
  VisibilityFilled,
  VisibilityOffFilled,
} from '@vicons/material'
import JobSpan from '../ui/JobSpan.vue'
import useCombatParser from '@/composables/useCombatParser'
import { formatTime } from '@/tools'
import type { SelfActionLog } from '@/types/combat'

const NAIVE_UI_MESSAGE = useMessage()
const {
  combatData,
} = useCombatParser()

const hidePlayerName = ref(false)
const insideTabs = computed(() => [
  [ 'goodboys', '受恩', '他人对你发动的关键援护技能', combatData.goodboys ],
  [ 'badboys', '蒙怨', '他人对你发动的关键阻碍技能', combatData.badboys ],
  [ 'mygoods', '施恩', '你对他人发动的关键援护技能', combatData.mygoods ],
  [ 'mybads', '结怨', '你对他人发动的关键阻碍技能', combatData.mybads ],
] as [string, string, string, SelfActionLog[]][])
const activeTab = ref(insideTabs.value![0]![0])

const currTabDescription = computed(() => insideTabs.value!.find(tab => tab[0] === activeTab.value)![2])
const currSelfActionLogs = computed(() => insideTabs.value!.find(tab => tab[0] === activeTab.value)![3])

const switchShowPlayerNameButtonActionText = computed(() => hidePlayerName.value ? '显示' : '隐藏')
const handleSwitchShowPlayerName = () => {
  const act = switchShowPlayerNameButtonActionText.value
  hidePlayerName.value = !hidePlayerName.value
  NAIVE_UI_MESSAGE.info(`已${act}玩家名称`)
}
</script>

<template>
  <div class="page-panel">
    <div class="w-full flex items-center gap-1">
      <div
        v-for="tab in insideTabs"
        :key="tab[0]"
        class="text-[1.2rem] leading-[1] px-2 py-1 border border-transparent rounded text-white cursor-pointer text-shadow
          transition-colors duration-200"
        :class="activeTab === tab[0] ? 'bg-white/30' : 'hover:bg-white/30'"
        @click="activeTab = tab[0]"
      >
        {{ tab[1] }}
      </div>
      <n-divider vertical />
      <div class="text-[1.1rem] text-white text-shadow">{{ currTabDescription }}</div>
    </div>
    <n-divider class="!my-1"></n-divider>
    <div class="w-full flex flex-col gap-0.5 flex-1 overflow-y-auto">
      <div v-if="!currSelfActionLogs.length" class="page-title">暂无数据</div>
      <AlertTitle v-else-if="!combatData.zone && !combatData.onConflict" msg="此处展示的是上一场的记录，下次进入对战时会被清除。" />
      <div
        v-for="(log, logIndex) in currSelfActionLogs"
        :key="`${activeTab}-${logIndex}`"
        class="page-title"
      >
        <div>{{ formatTime(log.happenTime) }}　</div>
        <div class="flex flex-wrap flex-1">
          <template v-if="activeTab === 'goodboys'">
            <div class="flex items-center">
              <JobSpan v-if="log.targetJob" :job="log.targetJob" />
              <span class="text-orange-700" :class="hidePlayerName ? 'blur' : ''">{{ log.targetName }}</span>
            </div>
            <span>对你发动了</span>
            <span class="text-orange-700">{{ log.actionName }}</span>
            <template v-if="log.actionDamage">
              <span>，回复了</span>
              <span class="text-orange-700">{{ log.actionDamage.toLocaleString() }}</span>
              <span>体力</span>
            </template>
          </template>
          <template v-else-if="activeTab === 'mygoods'">
            <span>对</span>
            <div class="flex items-center">
              <JobSpan v-if="log.targetJob" :job="log.targetJob" />
              <span class="text-orange-700" :class="hidePlayerName ? 'blur' : ''">{{ log.targetName }}</span>
            </div>
            <span>发动了</span>
            <span class="text-orange-700">{{ log.actionName }}</span>
            <template v-if="log.actionDamage">
              <span>，回复了</span>
              <span class="text-orange-700">{{ log.actionDamage.toLocaleString() }}</span>
              <span>体力</span>
            </template>
          </template>
          <template v-else-if="activeTab === 'badboys'">
            <div class="flex items-center">
              <JobSpan v-if="log.targetJob" :job="log.targetJob" />
              <span class="text-orange-700" :class="hidePlayerName ? 'blur' : ''">{{ log.targetName }}</span>
            </div>
            <span>对你发动了</span>
            <span class="text-orange-700">{{ log.actionName }}</span>
            <template v-if="log.actionDamage">
              <span>，造成了</span>
              <span class="text-orange-700">{{ log.actionDamage.toLocaleString() }}</span>
              <span>伤害</span>
            </template>
          </template>
          <template v-else-if="activeTab === 'mybads'">
            <span>对</span>
            <div class="flex items-center">
              <JobSpan v-if="log.targetJob" :job="log.targetJob" />
              <span class="text-orange-700" :class="hidePlayerName ? 'blur' : ''">{{ log.targetName }}</span>
            </div>
            <span>发动了</span>
            <span class="text-orange-700">{{ log.actionName }}</span>
            <template v-if="log.actionDamage">
              <span>，造成了</span>
              <span class="text-orange-700">{{ log.actionDamage.toLocaleString() }}</span>
              <span>伤害</span>
            </template>
          </template>
        </div>
      </div>
    </div>

    <n-tooltip trigger="hover" placement="left">
      <template #trigger>
        <n-float-button
          type="primary"
          bottom="1rem" right="1rem"
          @click="handleSwitchShowPlayerName"
        >
          <n-icon>
            <VisibilityFilled v-if="hidePlayerName" />
            <VisibilityOffFilled v-else />
          </n-icon>
        </n-float-button>
      </template>
      <div class="text-[1.2rem]">{{ switchShowPlayerNameButtonActionText }}玩家名称</div>
    </n-tooltip>
  </div>
</template>

<style scoped>
</style>
