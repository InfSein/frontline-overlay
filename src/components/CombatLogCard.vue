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

const toggleExpand = () => {
  if (hasDetails.value) {
    expanded.value = !expanded.value
  }
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
  <div class="combat-log-card">
    <!-- 卡片头部 -->
    <div
      class="card-header relative p-2 gap-1 rounded shadow-xl flex items-center"
      :class="{ 'cursor-pointer': hasDetails }"
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
        <div class="flex items-center text-[1.5rem] leading-[1] font-medium text-white text-shadow">
          <!-- 战斗名称 -->
          {{ getFrontlineNames(frontlineLog.zone)[1] }}
          <!-- 结果 -->
          <span
            v-if="frontlineLog.result"
            :data-color="frontlineLog.result === 'win' ? 'green' : 'red'"
            class="text-[1rem] leading-[1] font-normal p-1 text-white ml-1 rounded"
            :style="{
              backgroundColor: getFrontlineResultBackgroundColor(frontlineLog.result)
            }"
          >
            {{ frontlineLog.result === 'win' ? '胜' : frontlineLog.result === 'lose' ? '负' : frontlineLog.result }}
          </span>
          <!-- 展开/折叠指示器 -->
          <span
            v-if="hasDetails"
            class="expand-indicator"
            :class="{ 'expanded': expanded }"
          >
            ▼
          </span>
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
      class="detail-panel"
      :class="{ 'detail-panel--open': expanded }"
    >
      <div
        class="detail-panel-inner"
        :style="{ backgroundColor: detailBgColor }"
      >
        <!-- 击倒记录 -->
        <div class="detail-section-title text-shadow">
          — KNOCKOUTS —
        </div>
        <div v-if="!frontlineLog.knockouts.length" class="detail-row">无</div>
        <div
          v-for="(death, i) in frontlineLog.knockouts"
          :key="`ko-${i}`"
          class="detail-row"
        >
          <div>{{ formatTime(death.happenTime) }}　</div>
          <div class="flex flex-wrap flex-1">
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
        <div class="detail-section-title text-shadow">
          — DEATHS —
        </div>
        <div v-if="!frontlineLog.deaths.length" class="detail-row">无</div>
        <div
          v-for="(death, i) in frontlineLog.deaths"
          :key="`death-${i}`"
          class="detail-row"
        >
          <div>{{ formatTime(death.happenTime) }}　</div>
          <div class="flex flex-wrap flex-1">
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
.combat-log-card {
  border-radius: 0.375rem;
  overflow: hidden;
}
.card-header {
  position: relative;
  transition: filter 0.2s ease;
}
.card-header.cursor-pointer:hover {
  filter: brightness(1.1);
}

/* 展开/折叠指示器 */
.expand-indicator {
  display: inline-block;
  margin-left: 0.4rem;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
  transition: transform 0.3s ease;
  pointer-events: none;
}
.expand-indicator.expanded {
  transform: rotate(180deg);
}

/* 详细信息面板动画 */
.detail-panel {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.35s ease;
}
.detail-panel--open {
  grid-template-rows: 1fr;
}
.detail-panel-inner {
  overflow: hidden;
  border-radius: 0 0 0.375rem 0.375rem;
}

/* 详情区域标题 */
.detail-section-title {
  padding: 0.35rem 0.5rem;
  font-size: 1.15rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
}

/* 记录行 */
.detail-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.85);
  padding: 0.25rem 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.detail-row:last-child {
  border-bottom: none;
}
</style>
