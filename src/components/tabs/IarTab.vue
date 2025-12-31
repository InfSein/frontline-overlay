<script setup lang="ts">
import useCombatParser from '@/composables/useCombatParser'
import { formatTime } from '@/tools'

const {
  combatData,
} = useCombatParser()
</script>

<template>
  <div class="page-panel">
    <div class="w-full flex flex-col gap-0.5 flex-1 overflow-y-auto">
      <div v-if="!combatData.iarLog.length" class="page-title">暂无数据</div>
      <AlertTitle v-else-if="!combatData.zone && !combatData.onConflict" msg="此处展示的是上一场的记录，下次进入对战时会被清除。" />
      <div v-for="(log, logIndex) in combatData.iarLog" :key="`log-${logIndex}`" class="page-title">
        <div>{{ formatTime(log.happenTime) }}　</div>
        <div class="flex flex-wrap flex-1">
          <span>发动了</span>
          <span class="text-orange-700">{{ log.actionName }}</span>
          <span>，命中了</span>
          <span class="text-orange-700">{{ log.actionTargets.length }}</span>
          <span>人，造成了共计</span>
          <span class="text-orange-700">{{ log.totalDamage.toLocaleString() }}</span>
          <span>点伤害，回复了共计</span>
          <span class="text-orange-700">{{ log.totalHeal.toLocaleString() }}</span>
          <span>点体力。</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
