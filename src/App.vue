<script setup lang="ts">
import { RouterView } from 'vue-router'
import { NMessageProvider } from 'naive-ui'
import { useStore } from './stores'

const store = useStore()

onMounted(() => {
  const html = document.documentElement
  html.style.fontSize = store.appConfig.app_scale + 'em'
})
</script>

<template>
  <n-message-provider placement="bottom">
    <RouterView />
  </n-message-provider>
</template>

<style scoped>
</style>
