<script setup lang="ts">
interface ContentBlockProps {
  title: string
  useCustomContentContainer?: boolean
}
defineProps<ContentBlockProps>()
</script>

<template>
  <div class="relative flex flex-col gap-1">
    <div class="cb-title">
      <slot name="title">{{ title }}</slot>
    </div>
    <div :class="{
      'cb-content': !useCustomContentContainer
    }">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.cb-title {
  @apply w-full flex flex-wrap items-center text-[1.25rem] self-baseline text-white px-1 py-0.5
    rounded bg-gray-900/90 border border-black/50 sticky top-1 z-10;
}
.cb-content {
  @apply w-full items-center text-[1.25rem] self-baseline text-black px-3 py-1 rounded
    bg-white/60 border border-white;
}
</style>
