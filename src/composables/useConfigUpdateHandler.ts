import { useStore } from '@/stores'

const useConfigUpdateHandler = () => {
  const store = useStore()

  const configUpdateHandler = (event: MessageEvent) => {
    if (event.origin !== window.location.origin) return
    if (event.data.type === "config:update") {
      console.log('update config')
      store.reloadAppConfig()
    }
  }

  onMounted(() => {
    window.addEventListener('message', configUpdateHandler)
  })
  onUnmounted(() => {
    window.removeEventListener('message', configUpdateHandler)
  })
}

export default useConfigUpdateHandler
