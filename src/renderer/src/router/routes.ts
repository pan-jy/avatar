import type { RouteRecordRaw } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    component: () => import('@renderer/pages/Home.vue')
  },
  {
    path: '/model',
    component: () => import('@renderer/pages/Model.vue')
  }
]

export default routes
