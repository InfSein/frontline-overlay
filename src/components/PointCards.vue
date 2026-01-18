<script setup lang="ts">
interface PointData {
  cardKey: string
  type: "active" | "neutrality" | "preparing"
  ptLv?: string
  ptName: string
  ptProgress?: number
  ptDescription: string
  specifyColor?: string
}

interface PointCardsProps {
  points: PointData[]
  cardStyle?: "modern" | "classic"
}

withDefaults(defineProps<PointCardsProps>(), {
  cardStyle: 'classic'
})

const getPointColor = (point: PointData) => {
  if (point.specifyColor) return point.specifyColor
  switch (point.type) {
    case 'active': return '#70ACFFFF'
    default: return '#ADADADFF'
  }
}

const getPointProgress = (point: PointData) => point.ptProgress ?? 100
</script>

<template>
  <div
    class="w-full"
    :class="{
      'flex flex-col gap-0.5': cardStyle === 'classic',
      'grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-2': cardStyle === 'modern'
    }"
  >
    <div
      v-for="point in points"
      :key="point.cardKey"
      class="relative flex items-center rounded overflow-hidden bg-transparent transition-all"
      :class="cardStyle === 'modern' ? 'h-full flex-col justify-center text-center p-1' : 'gap-1 p-2'"
      :style="{
        border: `2px solid ${getPointColor(point)}`,
        boxShadow: '0 10px 15px -3px #0000001a, 0 4px 6px -4px #0000001a',
      }"
    >
      <div
        class="absolute left-0 top-0 h-full opacity-30 z-0 transition-all pointer-events-none"
        :style="{ width: `${getPointProgress(point)}%`, backgroundColor: getPointColor(point) }"
      />

      <div
        class="relative z-10 flex w-full text-white leading-[1.1]"
        :class="cardStyle === 'modern' ? 'flex-col items-center justify-center py-1' : 'items-center px-1 text-[1.25rem]'"
      >
        <template v-if="cardStyle === 'classic'">
          <div class="text-[1.375rem]">
            <span class="font-bold">{{ point.ptLv }}</span>
            <span>　{{ point.ptName }}</span>
          </div>
          <div class="ml-auto">
            {{ point.ptDescription }}
          </div>
        </template>
        <template v-else>
          <!-- Modern Style -->
          <div v-show="point.ptLv" class="absolute left-1 top-0 text-base opacity-80 leading-none">
            [{{ point.ptLv }}]
          </div>
          <div class="text-xl font-bold mb-0.5">
            {{ point.ptName }}
          </div>
          <div class="text-base opacity-90 font-medium">
            {{ point.ptDescription }}
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
