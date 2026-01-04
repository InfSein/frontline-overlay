<script setup lang="ts">
import IconInfo from '../icons/IconInfo.vue'

interface AlertTitleProps {
  msg: string
}
defineProps<AlertTitleProps>()
</script>

<template>
  <div
    class="w-full flex gap-1 items-center text-[1.25rem] self-baseline text-white px-1 py-0.5 rounded border"
    :style="{
      backgroundColor: 'rgba(56, 137, 197, 0.25)',
      borderColor: 'rgba(56, 137, 197, 0.35)',
    }"
  >
    <IconInfo />
    {{ msg }}
  </div>
</template>

<style scoped>
</style>
