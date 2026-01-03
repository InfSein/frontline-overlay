import { createRouter, createWebHistory } from 'vue-router'
import MainView from '../views/MainView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: MainView,
    },
    {
      path: '/config',
      name: 'config',
      component: () => import('../views/ConfigView.vue'),
    },
    {
      path: '/changelog',
      name: 'changelog',
      component: () => import('../views/ChangelogView.vue'),
    },
  ],
})

export default router
