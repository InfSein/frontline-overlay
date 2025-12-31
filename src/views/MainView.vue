<script setup lang="ts">
import {
  SettingsRound,
  KeyboardArrowUpRound,
  KeyboardArrowDownRound,
} from '@vicons/material'
import SituationTab from '@/components/tabs/SituationTab.vue'
import ExploitTab from '@/components/tabs/ExploitTab.vue'
import ResentTab from '@/components/tabs/ResentTab.vue'
import IarTab from '@/components/tabs/IarTab.vue'
import StatisticsTab from '@/components/tabs/StatisticsTab.vue'
import CalendarTab from '@/components/tabs/CalendarTab.vue'
import AboutTab from '@/components/tabs/AboutTab.vue'
import useCombatParser from '@/composables/useCombatParser'
import useConfigUpdateHandler from '@/composables/useConfigUpdateHandler'

const {
  appVar,
  init,
  dispose,
} = useCombatParser()
useConfigUpdateHandler()

onMounted(() => {
  init()
})
onUnmounted(() => {
  dispose()
})

const applicationTabs = computed(() => [
  [ 'situation', '战况', SituationTab ],
  [ 'exploit', '战绩', ExploitTab ],
  [ 'resent', '恩怨', ResentTab ],
  [ 'iar', '行迹', IarTab ],
  [ 'statistics', '统计', StatisticsTab ],
  [ 'calendar', '日历', CalendarTab ],
  [ 'about', '关于', AboutTab ],
] as [string, string, Component][])

const activeTab = ref(applicationTabs.value![0]![0])

const handleOpenConfigWindow = () => {
  window.open('./config')
}
</script>

<template>
  <div class="flex flex-col h-full items-center justify-items-center gap-1 p-1 bg-transparent">
    <!-- 顶部操作栏 -->
    <div class="w-full flex justify-between items-center p-1 px-2 rounded" :style="{
      backgroundColor: appVar.collapsed ? 'transparent' : 'rgb(0 0 0 / 0.3)',
    }">
      <div class="flex gap-2">
        <div
          v-for="tab in applicationTabs"
          :key="tab[0]"
          v-show="!appVar.collapsed"
          class="text-[1.25rem] px-2 py-1 border border-transparent rounded text-white cursor-pointer text-shadow
            transition-colors duration-200"
          :class="activeTab === tab[0] ? 'bg-white/30' : 'hover:bg-white/30'"
          @click="activeTab = tab[0]"
        >
          {{ tab[1] }}
        </div>
      </div>
      <div class="flex gap-2">
        <div
          v-if="!appVar.collapsed"
          class="flex items-center justify-center p-2 border border-transparent rounded text-white hover:bg-gray-700 cursor-pointer
            text-shadow transition-colors duration-200"
          title="打开设置窗口"
          @click="handleOpenConfigWindow"
        >
          <n-icon size="1.25rem">
            <SettingsRound />
          </n-icon>
        </div>
        <div
          class="flex items-center justify-center p-2 border border-transparent rounded text-white hover:bg-gray-700 cursor-pointer
            text-shadow transition-colors duration-200"
          :class="appVar.collapsed ? 'bg-white/30' : ''"
          :title="appVar.collapsed ? '展开' : '折叠'"
          @click="appVar.collapsed = !appVar.collapsed"
        >
          <n-icon size="1.25rem">
            <KeyboardArrowDownRound v-if="appVar.collapsed" />
            <KeyboardArrowUpRound v-else />
          </n-icon>
        </div>
      </div>
    </div>

    <!-- 主要内容区 -->
    <div v-if="!appVar.collapsed" class="w-full flex flex-1 flex-col gap-1 items-center rounded overflow-y-auto">
      <component :is="applicationTabs.find(tab => tab[0] === activeTab)![2]" />
    </div>
  </div>
</template>

<style scoped>
</style>
