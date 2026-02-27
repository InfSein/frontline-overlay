<script setup lang="ts">
import JobSpan from './ui/JobSpan.vue'
import {
  formatTimestamp,
  getJobInfo,
  getFrontlineBackground,
  getFrontlineBackgroundColor,
  getFrontlineForeColor,
  getFrontlineNames,
  getFrontlineResultBackgroundColor,
} from '@/tools';
import type { FrontlineLog } from '@/types/combat'

interface FlogCardProps {
  frontlineLog: FrontlineLog
}
defineProps<FlogCardProps>()
</script>

<template>
  <div
    class="relative p-2 gap-1 rounded shadow-xl flex items-center"
    :style="{
      color: getFrontlineForeColor(frontlineLog.zone),
      backgroundColor: getFrontlineBackgroundColor(frontlineLog.zone),
      backgroundImage: `url(${getFrontlineBackground(frontlineLog.zone)})`,
      backgroundSize: '70%',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: '1% center',
    }"
  >
    <JobSpan size="2.5rem" :job="frontlineLog.job" />
    <div>
      <div class="flex items-center text-[1.5rem] leading-[1] font-medium text-white text-shadow">
        {{ getFrontlineNames(frontlineLog.zone)[1] }}
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
      </div>
      <div class="flex items-center gap-1 text-[1.1rem] text-gray-200 leading-[1] m-0 text-shadow">
        {{ formatTimestamp(frontlineLog.start_time) }}
        <n-divider vertical class="!mx-1" />
        {{ getJobInfo(frontlineLog.job).job_name }}
      </div>
    </div>
    <div class="ml-auto mr-4 flex items-center gap-1 text-[1.5rem] font-bold">
      <div class="w-[4.5rem] text-right">{{ frontlineLog.knockouts.length }}</div>
      <div class="w-[4.5rem] text-right">{{ frontlineLog.deaths.length }}</div>
    </div>
  </div>
</template>

<style scoped>
</style>
