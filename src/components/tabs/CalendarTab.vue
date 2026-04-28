<script setup lang="ts">
import { getFrontlineBackground, getFrontlineBackgroundColor, getFrontlineForeColor, getFrontlineNames } from '@/tools'
import { Frontline } from '@/types'

/*
 * 轮换算法参考了 https://github.com/NekoWoods/what-zc-today/blob/main/sketch.js
 */

const startDate = new Date('2026-04-27T15:00:00Z') // 此时间节点是轮换起点
const showFuture = [0, 1, 2, 3, 4, 5, 6] as const

const now = ref(new Date())
const days = ref(daysBetween(startDate, new Date()))
const remainder = ref(calRemainder(days.value))
const timer = ref(0)

onMounted(() => {
  timer.value = setInterval(() => {
    const current = new Date()
    now.value = current

    const dayCount = daysBetween(startDate, current)
    days.value = dayCount
    remainder.value = calRemainder(dayCount)
  }, 1000)
})
onUnmounted(() => {
  clearInterval(timer.value)
})

const currentFrontline = computed(() => {
  return getFrontline(remainder.value)
})

const futureData = computed(() => showFuture.map(val => {
  const rm = calRemainder(days.value + val + 1)
  return {
    val: val,
    rm: rm,
    ...getFrontline(rm),
  }
}))

function daysBetween(from: Date, to: Date) {
  let diffMs = getDtVal(to) - getDtVal(from)
  if (diffMs < 0) diffMs = -1 * diffMs
  return Math.floor(diffMs / (1000 * 3600 * 24))

  function getDtVal(date: Date) {
    return date.getTime() + date.getTimezoneOffset() * 1000 * 60
  }
}
function calRemainder(day: number) {
  return day % 8
}

const getFrontline = (index: number) => {
  let frontline: Frontline
  switch (index) {
    case 0: frontline = Frontline.seize; break;
    case 1: frontline = Frontline.secure; break;
    case 2: frontline = Frontline.naadam; break;
    case 3: frontline = Frontline.triumph; break;
    case 4: frontline = Frontline.seize; break;
    case 5: frontline = Frontline.shatter; break;
    case 6: frontline = Frontline.naadam; break;
    case 7: frontline = Frontline.triumph; break;
    default: throw new Error('Invalid remainder value: ' + index)
  }
  return {
    names: getFrontlineNames(frontline),
    foreColor: getFrontlineForeColor(frontline),
    backgroundColor: getFrontlineBackgroundColor(frontline),
    backgroundImage: getFrontlineBackground(frontline),
  }
}

const getNext23 = (now: Date, addDay?: number) => {
  const next23 = new Date(now)
  next23.setHours(23, 0, 0, 0)
  // 如果已经过了今天23:00，则目标是明天的23:00
  if (now.getTime() >= next23.getTime()) {
    next23.setDate(next23.getDate() + 1)
  }
  if (addDay) {
    next23.setDate(next23.getDate() + addDay)
  }
  return next23
}
const timeUntilNext23 = (now: Date, addDay?: number) => {
  const next23 = getNext23(now, addDay)
  const diffMs = next23.getTime() - now.getTime()

  const hours = Math.floor(diffMs / (1000 * 60 * 60)).toString().padStart(2, '0')
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0')
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000).toString().padStart(2, '0')

  return `${hours}小时${minutes}分${seconds}秒`
}
const formatDate = (date: Date) => {
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).replace(/\//g, '/').replace(',', '');
}

</script>

<template>
  <div class="page-panel">
    <!-- 当前战场 -->
    <div class="page-title">
      <div class="flex w-full items-center">
        <div>当前战场</div>
        <div class="ml-auto">{{ `(还剩${timeUntilNext23(now)})` }}</div>
      </div>
    </div>
    <div
      class="relative p-2 gap-1 rounded shadow-xl flex items-center"
      :style="{
        color: currentFrontline.foreColor,
        backgroundColor: currentFrontline.backgroundColor,
        backgroundImage: `url(${currentFrontline.backgroundImage})`,
        backgroundSize: '70%',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: '1% center',
      }"
    >
      <div class="ml-auto">
        <div class="text-[1.75rem] leading-[1.5] font-medium text-white text-shadow">
          {{ currentFrontline.names[1] }}
        </div>
        <p class="text-[#cad5e2] m-0 mr-1 text-right">
          {{ currentFrontline.names[2] }}
        </p>
      </div>
    </div>
    <!-- 未来战场 -->
    <div class="page-title">未来战场</div>
    <div class="flex flex-col gap-0.5 text-[1.125rem]">
      <div
        v-for="future in futureData"
        :key="future.val"
        class="flex items-center border border-black/50 rounded px-1 py-0.5 pr-2"
        :style="{
          color: future.foreColor,
          backgroundColor: future.backgroundColor,
        }"
      >
        <div>
          <span class="mx-[0.3em] ml-[0.5em]"> · </span>
          <span>{{ future.names[1] }}</span>
        </div>
        <div class="ml-auto">
          {{ `${formatDate(getNext23(now, future.val))}／${timeUntilNext23(now, future.val)}后` }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
