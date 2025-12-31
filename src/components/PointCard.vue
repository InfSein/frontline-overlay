<script setup lang="ts">
interface PointCardProps {
  /** 类型 */
  type: "active" | "neutrality" | "preparing"
  /** 指定颜色 */
  specifyColor?: string
  /** 据点等级 */
  ptLv?: string
  /** 据点名称 */
  ptName: string
  /** 据点进度 */
  ptProgress?: number
  /** 据点描述 */
  ptDescription: string
}
const props = defineProps<PointCardProps>()

const color = computed(() => {
  let color = ''
  switch (props.type) {
    case 'active':
      color = '#70ACFFFF'; break
    default:
      color = '#ADADADFF'; break
  }
  if (props.specifyColor) color = props.specifyColor
  return color
})
const progress = computed(() => props.ptProgress ?? 100)
</script>

<template>
  <div class="relative flex items-center gap-1 p-2 rounded overflow-hidden bg-transparent" :style="{
    border: `2px solid ${color}`,
    boxShadow: '0 10px 15px -3px #0000001a, 0 4px 6px -4px #0000001a',
  }">
    <div
      class="absolute left-0 top-0 h-full opacity-30 z-0 transition-all pointer-events-none"
      :style="{ width: `${progress}%`, backgroundColor: color }"
    />
    <div class="relative z-10 px-1 flex items-center w-full text-[1.25rem] text-white leading-[1.1]">
      <div class="text-[1.375rem]">
        <span class="font-bold">{{ ptLv }}</span>
        <span>　{{ ptName }}</span>
      </div>
      <div class="ml-auto">
        {{ ptDescription }}
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
