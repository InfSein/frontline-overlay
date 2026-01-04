import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { configure } from 'vue-gtag'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

try {
  configure({
    tagId: 'G-MFVR2W1LKB',
    pageTracker: {
      router,
    }
  })
} catch (e) {
  console.warn('gtag init failed:\n', e)
}

router.isReady().then(() => {
  app.mount('#app')
})
