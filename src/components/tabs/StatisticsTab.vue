<script setup lang="ts">
import AlertTitle from '../ui/AlertTitle.vue'
import PieChart from '@/components/ui/PieChart.vue'
import CombatLogCard from '../CombatLogCard.vue'
import useCombatParser from '@/composables/useCombatParser'

const {
  combatData,
  statistics,
} = useCombatParser()

const winRateTabs = computed(() => {
  const tabs: [string, string][] = []
  if (statistics.value.winRateSummary.frontline) {
    tabs.push(['frontline', '纷争前线'])
  }
  if (statistics.value.winRateSummary.rivalWings) {
    tabs.push(['rivalWings', '烈羽争锋'])
  }
  if (statistics.value.winRateSummary.crystalConflict) {
    tabs.push(['crystalConflict', '水晶冲突'])
  }
  return tabs
})
const activeWinRateTab = ref(winRateTabs.value[0]?.[0])
watch(winRateTabs, (newTabs) => {
  if (newTabs.length > 0) {
    if (!newTabs.some(tab => tab[0] === activeWinRateTab.value)) {
      activeWinRateTab.value = newTabs[0]![0]
    }
  } else {
    activeWinRateTab.value = undefined
  }
}, { immediate: true })

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
    <ContentBlock title="参战统计" use-custom-content-container>
      <template #title>
        参战统计
        <div class="ml-auto mr-5 flex items-center gap-1">
          <div class="w-[4.5rem] text-right">K</div>
          <div class="w-[4.5rem] text-right">D</div>
        </div>
      </template>

      <div class="page-content" v-if="!combatData.frontlineLog.length">暂无数据</div>
      <div class="flex flex-col gap-1" v-else>
        <CombatLogCard
          v-for="(log, index) in combatData.frontlineLog"
          :key="index"
          :frontline-log="log"
        />
      </div>
    </ContentBlock>

    <!-- K/D统计 -->
    <ContentBlock title="K/D统计">
      <div class="w-full grid grid-cols-3">
        <div>参战<span class="text-orange-700">{{ combatData.frontlineLog.length }}</span>场</div>
        <div>击倒数 <span class="text-orange-700">{{ statistics.knockouts.length }}</span></div>
        <div>死亡数 <span class="text-orange-700">{{ statistics.deaths.length }}</span></div>
        <div>K/D <span class="text-orange-700">{{ statistics.kd }}</span></div>
        <div>场均击倒 <span class="text-orange-700">{{ statistics.knockoutEachMatch }}</span></div>
        <div>场均死亡 <span class="text-orange-700">{{ statistics.deathEachMatch }}</span></div>
      </div>
    </ContentBlock>

    <!-- 结果统计 -->
    <ContentBlock title="结果统计">
      <template v-if="winRateTabs.length > 0">
        <div class="flex items-center gap-1">
          <div
            v-for="tab in winRateTabs"
            :key="tab[0]"
            class="text-[1.1rem] px-2 py-1 border border-transparent rounded text-white cursor-pointer text-shadow
              transition-colors duration-200"
            :class="activeWinRateTab === tab[0] ? 'bg-gray-500' : 'hover:bg-gray-500'"
            @click="activeWinRateTab = tab[0]"
          >
            {{ tab[1] }}
          </div>
        </div>
        <n-divider class="!my-1" />
        <div class="flex flex-col gap-1">
          <template v-if="activeWinRateTab === 'frontline' && statistics.winRateSummary.frontline">
            <div>
              冠军场次：<span class="text-orange-700">{{ statistics.winRateSummary.frontline.first.count }}</span>
              (<span class="text-orange-700">{{ statistics.winRateSummary.frontline.first.rate }}</span>%)
            </div>
            <div>
              亚军场次：<span class="text-orange-700">{{ statistics.winRateSummary.frontline.second.count }}</span>
              (<span class="text-orange-700">{{ statistics.winRateSummary.frontline.second.rate }}</span>%)
            </div>
            <div>
              季军场次：<span class="text-orange-700">{{ statistics.winRateSummary.frontline.third.count }}</span>
              (<span class="text-orange-700">{{ statistics.winRateSummary.frontline.third.rate }}</span>%)
            </div>
          </template>

          <template v-if="activeWinRateTab === 'rivalWings' && statistics.winRateSummary.rivalWings">
            <div>
              胜利场次：<span class="text-orange-700">{{ statistics.winRateSummary.rivalWings.win.count }}</span>
              (<span class="text-orange-700">{{ statistics.winRateSummary.rivalWings.win.rate }}</span>%)
            </div>
            <div>
              失败场次：<span class="text-orange-700">{{ statistics.winRateSummary.rivalWings.lose.count }}</span>
              (<span class="text-orange-700">{{ statistics.winRateSummary.rivalWings.lose.rate }}</span>%)
            </div>
          </template>

          <template v-if="activeWinRateTab === 'crystalConflict' && statistics.winRateSummary.crystalConflict">
            <div>
              胜利场次：<span class="text-orange-700">{{ statistics.winRateSummary.crystalConflict.win.count }}</span>
              (<span class="text-orange-700">{{ statistics.winRateSummary.crystalConflict.win.rate }}</span>%)
            </div>
            <div>
              失败场次：<span class="text-orange-700">{{ statistics.winRateSummary.crystalConflict.lose.count }}</span>
              (<span class="text-orange-700">{{ statistics.winRateSummary.crystalConflict.lose.rate }}</span>%)
            </div>
          </template>
        </div>
      </template>
      <div v-else class="py-2 flex items-center justify-center">暂无数据</div>
    </ContentBlock>

    <!-- 击倒统计 -->
    <ContentBlock title="击倒统计">
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
    </ContentBlock>

    <!-- 死亡统计 -->
    <ContentBlock title="死亡统计">
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
    </ContentBlock>
  </div>
</template>

<style scoped>
</style>
