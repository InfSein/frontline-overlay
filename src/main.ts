import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { configure } from 'vue-gtag'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')

configure({
  tagId: 'G-MFVR2W1LKB',
  pageTracker: {
    router,
  }
})
