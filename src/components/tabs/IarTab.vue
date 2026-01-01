<script setup lang="ts">
import useCombatParser from '@/composables/useCombatParser'
import { ImportantActions } from '@/constants'
import { formatTime } from '@/tools'

const {
  combatData,
} = useCombatParser()

const parsedIarLog = computed(() => {
  return combatData.iarLog.map(log => {
    const [measures] = ImportantActions[log.actionName]!
    return {
      ...log,
      formatedHappenTime: formatTime(log.happenTime),
      showHits: measures.includes('hit'),
      showDamage: measures.includes('damage'),
      showHeal: measures.includes('heal'),
    }
  })
})
</script>

<template>
  <div class="page-panel">
    <div class="w-full flex flex-col gap-0.5 flex-1 overflow-y-auto">
      <div v-if="!combatData.iarLog.length" class="page-title">暂无数据</div>
      <AlertTitle v-else-if="!combatData.zone && !combatData.onConflict" msg="此处展示的是上一场的记录，下次进入对战时会被清除。" />
      <div v-for="(log, logIndex) in parsedIarLog" :key="`log-${logIndex}`" class="page-title">
        <div>{{ log.formatedHappenTime }}　</div>
        <div class="flex-1">
          <span>发动</span>
          <span class="text-orange-700">{{ log.actionName }}</span>
          <template v-if="log.showHits">
            <span>命中</span>
            <span class="text-orange-700">{{ log.actionTargets.length }}</span>
            <span>人</span>
          </template>
          <template v-if="log.showDamage">
            <span>，造成共计</span>
            <span class="text-orange-700">{{ log.totalDamage.toLocaleString() }}</span>
            <span>伤害</span>
          </template>
          <template v-if="log.showHeal">
            <span>，回复共计</span>
            <span class="text-orange-700">{{ log.totalHeal.toLocaleString() }}</span>
            <span>体力</span>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
