<script setup lang="ts">
import { useMessage } from 'naive-ui'
import {
  EventNoteFilled,
  CopyAllFilled,
} from '@vicons/material'
import IconGithub from '../icons/IconGithub.vue'
import AppInfo from '@/constants/app-info'
import { checkAppUpdates, copyToClipboard } from '@/tools'

const NAIVE_UI_MESSAGE = useMessage()

const appNewVersion = ref('')
const checkingAppUpdate = ref(false)

onMounted(() => {
  checkAppUpdate()
})

const contactData = computed(() => [
  {
    key: 'githubRepo',
    label: 'Github',
    icon: IconGithub,
    data: AppInfo.githubRepo,
    onClick: () => {
      window.open(AppInfo.githubRepo)
    },
    onClickCopyBtn: () => {
      copyToClipboard(AppInfo.githubRepo)
      NAIVE_UI_MESSAGE.success('已复制链接')
    },
  },
  {
    key: 'changelogDoc',
    label: '更新日志',
    icon: EventNoteFilled,
    data: AppInfo.changelogDoc,
    onClick: () => {
      window.open(AppInfo.changelogDoc)
    },
    onClickCopyBtn: () => {
      copyToClipboard(AppInfo.changelogDoc)
      NAIVE_UI_MESSAGE.success('已复制链接')
    },
  }
])

const checkAppUpdate = async () => {
  try {
    checkingAppUpdate.value = true
    const { needUpdate, latestVersion } = await checkAppUpdates()
    if (needUpdate) appNewVersion.value = latestVersion
    else appNewVersion.value = ''
  } catch (e) {
    console.error('检查应用新版本时发生错误：', e)
  } finally {
    checkingAppUpdate.value = false
  }
}
const handleCheckAppUpdate = async () => {
  if (checkingAppUpdate.value) {
    NAIVE_UI_MESSAGE.info('正在检测中，请稍候'); return
  }
  await checkAppUpdate()
  if (appNewVersion.value) {
    NAIVE_UI_MESSAGE.info('检测到新版本')
  } else {
    NAIVE_UI_MESSAGE.info('已是最新版本')
  }
}
const handleUpdateApp = async () => {
  const cacheKeys = await caches.keys()
  for (const name of cacheKeys) {
    await caches.delete(name)
  }
  location.reload()
}
</script>

<template>
  <div class="page-panel">
    <div class="page-title">
      <span>当前版本：</span>
      <span class="text-orange-700 font-bold">{{ AppInfo.version }}</span>
    </div>
    <div class="page-content flex-col items-start pb-[0.375rem]">
      <template v-if="appNewVersion">
        <div>检测到新版本：{{ appNewVersion }}</div>
        <n-button
          size="large"
          type="success"
          class="px-12 text-[1.25rem]"
          :loading="checkingAppUpdate"
          @click="handleUpdateApp"
        >
          点此更新
        </n-button>
        <div class="text-red-600">※当前数据和已记录的场次统计将会丢失。</div>
      </template>
      <template v-else>
        <div>已是最新版本</div>
        <n-button
          size="large"
          type="info"
          class="px-12 text-[1.25rem]"
          :loading="checkingAppUpdate"
          @click="handleCheckAppUpdate"
        >
          检查更新
        </n-button>
      </template>
    </div>
    <div class="page-title">保持联系</div>
    <div class="page-content">
      <div>点击左侧按钮来打开子窗口访问，或是点击右侧按钮复制链接。</div>
      <div class="grid grid-cols-[1fr_auto] gap-1 w-fit">
        <div v-for="contact in contactData" :key="contact.key" class="contents">
          <n-button size="large" type="info" class="px-12 text-[1.25rem]" @click="contact.onClick">
            <template #icon>
              <n-icon>
                <component :is="contact.icon" />
              </n-icon>
            </template>
            {{ contact.label }}
          </n-button>
          <n-button size="large" type="info" @click="contact.onClickCopyBtn">
            <template #icon>
              <n-icon>
                <component :is="CopyAllFilled" />
              </n-icon>
            </template>
          </n-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
