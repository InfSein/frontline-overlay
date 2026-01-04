<script setup lang="ts">
import AlertTitle from '../ui/AlertTitle.vue'
import PieChart from '@/components/ui/PieChart.vue'
import CombatLogCard from '../CombatLogCard.vue'
import useCombatParser from '@/composables/useCombatParser'

const {
  combatData,
  statistics,
} = useCombatParser()

const knockoutChartTabs = computed(() => [
  [ 'skill', '按技能', statistics.value.pieData.knockoutBySkill ],
  [ 'selfJob', '按自身职业', statistics.value.pieData.knockoutBySelfJob ],
  [ 'enemyJob', '按敌方职业', statistics.value.pieData.knockoutByEnemyJob ],
] as [string, string, { label: string; amount: number }[]][])
const activeKnockoutChartTab = ref(knockoutChartTabs.value![0]![0])
const currKnockoutChartData = computed(() =>
  knockoutChartTabs.value.find(tab => tab[0] === activeKnockoutChartTab.value)?.[2] ?? []
)

const deathChartTabs = computed(() => [
  [ 'skill', '按技能', statistics.value.pieData.deathBySkill ],
  [ 'selfJob', '按自身职业', statistics.value.pieData.deathBySelfJob ],
  [ 'enemyJob', '按敌方职业', statistics.value.pieData.deathByEnemyJob ],
] as [string, string, { label: string; amount: number }[]][])
const activeDeathChartTab = ref(deathChartTabs.value![0]![0])
const currDeathChartData = computed(() =>
  deathChartTabs.value.find(tab => tab[0] === activeDeathChartTab.value)?.[2] ?? []
)
</script>

<template>
  <div class="page-panel">
    <AlertTitle v-if="!combatData.frontlineLog.length" msg="暂无记录。请完成至少一场对战后再来查看。" />

    <!-- 参战统计 -->
    <div class="page-title">
      参战统计
      <div class="ml-auto mr-5 flex items-center gap-1">
        <div class="w-[4.5rem] text-right">K</div>
        <div class="w-[4.5rem] text-right">D</div>
      </div>
    </div>
    <div class="page-content" v-if="!combatData.frontlineLog.length">暂无数据</div>
    <CombatLogCard
      v-for="(log, index) in combatData.frontlineLog"
      :key="index"
      :frontline-log="log"
    />

    <!-- K/D统计 -->
    <div class="page-title">K/D统计</div>
    <div class="page-content">
      <div class="w-full grid grid-cols-3">
        <div>参战<span class="text-orange-700">{{ combatData.frontlineLog.length }}</span>场</div>
        <div>击倒数 <span class="text-orange-700">{{ statistics.knockouts.length }}</span></div>
        <div>死亡数 <span class="text-orange-700">{{ statistics.deaths.length }}</span></div>
        <div>K/D <span class="text-orange-700">{{ statistics.kd }}</span></div>
        <div>场均击倒 <span class="text-orange-700">{{ statistics.knockoutEachMatch }}</span></div>
        <div>场均死亡 <span class="text-orange-700">{{ statistics.deathEachMatch }}</span></div>
      </div>
    </div>

    <!-- 击倒统计 -->
    <div class="page-title">击倒统计</div>
    <div class="page-content">
      <div class="flex items-center gap-1">
        <div
          v-for="tab in knockoutChartTabs"
          :key="tab[0]"
          class="text-[1.1rem] px-2 py-1 border border-transparent rounded text-white cursor-pointer text-shadow
            transition-colors duration-200"
          :class="activeKnockoutChartTab === tab[0] ? 'bg-gray-500' : 'hover:bg-gray-500'"
          @click="activeKnockoutChartTab = tab[0]"
        >
          {{ tab[1] }}
        </div>
      </div>
      <n-divider class="!my-1" />
      <div class="h-60">
        <PieChart v-if="currKnockoutChartData.length" :data="currKnockoutChartData" />
        <div v-else class="h-full flex items-center justify-center">暂无数据</div>
      </div>
    </div>

    <!-- 死亡统计 -->
    <div class="page-title">死亡统计</div>
    <div class="page-content">
      <div class="flex items-center gap-1">
        <div
          v-for="tab in deathChartTabs"
          :key="tab[0]"
          class="text-[1.1rem] px-2 py-1 border border-transparent rounded text-white cursor-pointer text-shadow
            transition-colors duration-200"
          :class="activeDeathChartTab === tab[0] ? 'bg-gray-500' : 'hover:bg-gray-500'"
          @click="activeDeathChartTab = tab[0]"
        >
          {{ tab[1] }}
        </div>
      </div>
      <n-divider class="!my-1" />
      <div class="h-60">
        <PieChart v-if="currDeathChartData.length" :data="currDeathChartData" />
        <div v-else class="h-full flex items-center justify-center">暂无数据</div>
      </div>
    </div>



  </div>
</template>

<style scoped>
</style>
