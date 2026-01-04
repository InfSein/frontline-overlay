<script setup lang="ts">
import { GrandCompany } from '@/types'
import {
  getGrandCompanyName,
  getGrandCompanyColor,
  getGrandCompanyFlag,
} from '@/tools'

interface GcCardProps {
  /** 大国防联军 */
  gc: GrandCompany
  /** 是否为己方 */
  me: boolean
  /** 点分 */
  floatPoints: number | string
  /** 增长速度 */
  increaseSpeed: number
}
const props = defineProps<GcCardProps>()

const color = computed(() => getGrandCompanyColor(props.gc))
const name = computed(() => getGrandCompanyName(props.gc))
const flag = computed(() => getGrandCompanyFlag(props.gc))
</script>

<template>
  <div class="flex flex-col rounded-lg shadow-lg overflow-hidden bg-center bg-no-repeat bg-contain" :style="{
    backgroundColor: color,
    backgroundImage: `url(${flag})`,
  }">
    <div class="flex items-center p-2 pb-0">
      <div>
        <div class="text-[1.75rem] leading-[1.2] font-medium text-white drop-shadow-[1px_1px_2px_black]">
          {{ name }}
        </div>
        <p class="text-[#cad5e2] m-0 leading-1">{{ me ? '⭐我方' : '　敌方' }}</p>
      </div>
      <div class="ml-auto mr-1 text-[2.625rem] leading-[1.3] font-bold text-white">
        {{ floatPoints }}
      </div>
    </div>
    <n-divider class="!m-0" />
    <div
      class="text-right text-white font-medium leading-1 p-1 pt-0 mr-2"
      :style="{ fontFamily: `'Eurostar Regular'` }"
    >
      +<span class="font-bold">{{ increaseSpeed }}</span>/t
    </div>
  </div>
</template>

<style scoped>
</style>
