<script setup lang="ts">
import GcCard from '../GcCard.vue'
import PointCards from '../PointCards.vue'
import useCombatParser from '@/composables/useCombatParser'
import { Frontline, GrandCompany } from '@/types'
import { getFrontlineNames } from '@/tools'
import { useStore } from '@/stores'

const store = useStore()
const {
  combatData,
  getGcPoint, getGcIncreaseSpeed,
  situationLockMsg,
  pointData,
} = useCombatParser()
</script>

<template>
  <div class="page-panel">
    <!-- 内容锁定遮罩 -->
    <div v-if="situationLockMsg" class="absolute inset-0 z-20 flex items-center justify-center backdrop-blur-sm bg-black/30">
      <div class="text-center text-white">
        <div class="text-4xl mb-2">⛓️🔒⛓️</div>
        <div class="text-2xl font-semibold">{{ situationLockMsg }}</div>
      </div>
    </div>

    <!-- 剩余点分 -->
    <div class="page-title">剩余点分</div>
    <div class="w-full grid grid-cols-3 gap-2">
      <GcCard
        v-for="company in GrandCompany"
        :key="company"
        :gc="company"
        :me="combatData.gc === company"
        :float-points="getGcPoint(company)"
        :increase-speed="getGcIncreaseSpeed(company)"
      />
    </div>

    <!-- 当前据点 -->
    <div class="page-title">当前据点</div>
    <div
      v-if="combatData.zone === Frontline.shatter"
      class="w-full text-[1.25rem] self-baseline text-white px-1 py-0.5 rounded bg-gray-400/90 border border-black/50"
    >
      暂不支持解析{{ getFrontlineNames(combatData.zone)[1] }}的当前据点数据。
    </div>
    <PointCards
      :points="pointData"
      :card-style="store.appConfig.situation_pointcard_style"
    />


    <!-- 关注玩家 -->
    <template v-if="combatData.matchedWatchedPlayers.length > 0">
      <div class="page-title">关注玩家</div>
      <div
        v-for="(wp, idx) in combatData.matchedWatchedPlayers"
        :key="idx"
        class="page-content flex !items-baseline gap-1 !px-1 !py-0.5"
      >
        <div class="w-60">
          <span class="">⭐ {{ wp.name }}</span>
          <span v-if="wp.worldName" class="text-base text-amber-900"> @{{ wp.worldName }}</span>
        </div>
        <div>／</div>
        <div v-if="wp.note">{{ wp.note }}</div>
      </div>
    </template>
  </div>
</template>

<style scoped>
</style>
