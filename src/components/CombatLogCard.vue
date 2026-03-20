<script setup lang="ts">
import JobSpan from './ui/JobSpan.vue'
import {
  formatTimestamp,
  formatTime,
  getJobInfo,
  getFrontlineBackground,
  getFrontlineBackgroundColor,
  getFrontlineForeColor,
  getFrontlineNames,
  getFrontlineResultBackgroundColor,
} from '@/tools';
import type { FrontlineLog, DeathInfo } from '@/types/combat'

interface FlogCardProps {
  frontlineLog: FrontlineLog
}
const props = defineProps<FlogCardProps>()

const expanded = ref(false)

const hasDetails = computed(() =>
  props.frontlineLog.knockouts.length > 0 || props.frontlineLog.deaths.length > 0
)

const frontlineName = computed(() => getFrontlineNames(props.frontlineLog.zone)[1])
const frontlineResult = computed(() => {
  switch (props.frontlineLog.result) {
    case 'win':
      return '胜'
    case 'lose':
      return '负'
    case '1st':
      return '冠'
    case '2nd':
      return '亚'
    case '3rd':
      return '季'
    default:
      return props.frontlineLog.result
  }
})

const toggleExpand = () => {
  expanded.value = !expanded.value
}

const getDeathDamage = (death: DeathInfo) => {
  if (death.lasthitActionInstantDeath) {
    return '即死'
  }
  return death.lasthitActionDamage.toLocaleString()
}

const detailBgColor = computed(() => {
  const base = getFrontlineBackgroundColor(props.frontlineLog.zone)
  if (!base) return 'rgba(0,0,0,0.25)'
  // Parse hex color and create a lighter, more transparent version
  const hex = base.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  // Blend with white to lighten, then apply transparency
  const lighten = (c: number) => Math.min(255, Math.round(c + (255 - c) * 0.35))
  return `rgba(${lighten(r)}, ${lighten(g)}, ${lighten(b)}, 0.55)`
})
</script>

<template>
  <div class="rounded-md overflow-hidden">
    <!-- 卡片头部 -->
    <div
      class="relative flex items-center p-2 gap-1 shadow-xl transition-[filter] duration-200
        ease-in-out cursor-pointer hover:brightness-110"
      :style="{
        color: getFrontlineForeColor(frontlineLog.zone),
        backgroundColor: getFrontlineBackgroundColor(frontlineLog.zone),
        backgroundImage: `url(${getFrontlineBackground(frontlineLog.zone)})`,
        backgroundSize: '70%',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: '1% center',
      }"
      @click="toggleExpand"
    >
      <JobSpan size="2.5rem" :job="frontlineLog.job" />
      <div>
        <div class="flex items-center gap-1.5 text-[1.5rem] leading-[1] font-medium text-white text-shadow">
          <!-- 战斗名称 -->
          <div>{{ frontlineName }}</div>
          <!-- 结果 -->
          <div
            v-if="frontlineLog.result"
            class="text-[1rem] leading-[1] font-normal p-1 text-white rounded"
            :style="{
              backgroundColor: getFrontlineResultBackgroundColor(frontlineLog.result)
            }"
          >
            {{ frontlineResult }}
          </div>
          <!-- 展开/折叠指示器 -->
          <div
            v-if="hasDetails"
            class="inline-block text-[0.75rem] text-white transition-transform duration-300
              ease-in-out pointer-events-none"
            :class="{ 'rotate-180': expanded }"
          >
            ▼
          </div>
        </div>
        <div class="flex items-center gap-1 text-[1.1rem] text-gray-200 leading-[1] m-0 text-shadow">
          <!-- 开始时间 -->
          {{ formatTimestamp(frontlineLog.start_time) }}
          <n-divider vertical class="!mx-1" />
          <!-- 职业名 -->
          {{ getJobInfo(frontlineLog.job).job_name }}
        </div>
      </div>
      <!-- 击倒/阵亡数 -->
      <div class="ml-auto mr-4 flex items-center gap-1 text-[1.5rem] font-bold">
        <div class="w-[4.5rem] text-right">{{ frontlineLog.knockouts.length }}</div>
        <div class="w-[4.5rem] text-right">{{ frontlineLog.deaths.length }}</div>
      </div>
    </div>

    <!-- 展开的详细信息区域 -->
    <div
      class="grid transition-[grid-template-rows] duration-350 ease-in-out"
      :class="expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
    >
      <div
        class="overflow-hidden rounded-b-md"
        :style="{ backgroundColor: detailBgColor }"
      >
        <!-- 击倒记录 -->
        <div class="p-2 text-[1.15rem] font-semibold text-white/90 border-b border-white/15 text-shadow">
          — KNOCKOUTS —
        </div>
        <div v-if="!frontlineLog.knockouts.length" class="flex flex-wrap items-center text-[1.1rem] text-white/85 py-1 px-2">无</div>
        <div
          v-for="(death, i) in frontlineLog.knockouts"
          :key="`ko-${i}`"
          class="flex flex-wrap items-center text-[1.1rem] text-white/85 py-1 px-2 border-b border-white/10 last:border-b-0"
        >
          <div class="mr-2">{{ formatTime(death.happenTime) }}</div>
          <div class="flex flex-wrap flex-1 gap-x-1">
            <span>使用</span>
            <template v-if="death.summonedBy">
              <span class="text-orange-300">{{ death.perpetratorName }}</span>
              <span>发动的</span>
            </template>
            <span class="text-orange-300">{{ death.lasthitActionName }}</span>
            <span>造成了</span>
            <span class="text-orange-300">{{ getDeathDamage(death) }}</span>
            <span>伤害，击倒了</span>
            <div class="flex items-center">
              <JobSpan v-if="death.victimJob" :job="death.victimJob" />
              <span class="text-orange-300">{{ death.victimName }}</span>
            </div>
          </div>
        </div>

        <!-- 阵亡记录 -->
        <div class="p-2 pt-1 text-[1.15rem] font-semibold text-white/90 border-b border-white/15 text-shadow">
          — DEATHS —
        </div>
        <div v-if="!frontlineLog.deaths.length" class="flex flex-wrap items-center text-[1.1rem] text-white/85 py-1 px-2">无</div>
        <div
          v-for="(death, i) in frontlineLog.deaths"
          :key="`death-${i}`"
          class="flex flex-wrap items-center text-[1.1rem] text-white/85 py-1 px-2 border-b border-white/10 last:border-b-0"
        >
          <div class="mr-2">{{ formatTime(death.happenTime) }}</div>
          <div class="flex flex-wrap flex-1 gap-x-1">
            <span>被</span>
            <div class="flex items-center">
              <JobSpan v-if="death.perpetratorJob" :job="death.perpetratorJob" />
              <span class="text-orange-300">
                {{ death.summonedBy || death.perpetratorName }}
              </span>
            </div>
            <template v-if="death.summonedBy">
              <span>召唤的</span>
              <span class="text-orange-300">{{ death.perpetratorName }}</span>
            </template>
            <span>用</span>
            <span class="text-orange-300">{{ death.lasthitActionName }}</span>
            <span>造成了</span>
            <span class="text-orange-300">{{ getDeathDamage(death) }}</span>
            <span>伤害，因此阵亡</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
