<script setup lang="ts">
import { getJobInfo } from '@/tools'

interface JobSpanProps {
  job?: number
  showJobName?: boolean
  size?: string
}
const props = defineProps<JobSpanProps>()

const jobInfo = computed(() => getJobInfo(props.job))
const size = computed(() => props.size || '1.25rem')

const imgSrc = computed(() => `./icon/game-job/${jobInfo.value.job_icon}.png`)
const imgClasses = 'inline-block vertical-align:middle'
const imgStyles = computed(() => ({
  width: size.value,
  height: size.value,
}))
</script>

<template>
  <div v-if="showJobName" class="flex items-center gap-1 text-[1.1rem] text-gray-200 leading-1 m-0 text-shadow">
    <img :src="imgSrc" :class="imgClasses" :style="imgStyles" />
    {{ jobInfo.job_name }}
  </div>
  <img v-else :src="imgSrc" :class="imgClasses" :style="imgStyles" />
</template>

<style scoped>
</style>
