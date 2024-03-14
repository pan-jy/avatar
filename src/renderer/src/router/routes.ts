import type { RouteRecordRaw } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    component: () => import('@renderer/components/layout/MainLayout.vue'),
    redirect: '/model-library',
    children: [
      {
        path: '/model-library',
        component: () => import('@renderer/pages/ModelLibrary.vue')
      },
      {
        path: '/action-capture',
        component: () => import('@renderer/pages/ActionCapture.vue')
      },
      {
        path: '/settings',
        component: () => import('@renderer/pages/Settings.vue')
      }
    ]
  },
  {
    path: '/model',
    component: () => import('@renderer/pages/Model.vue')
  }
]

export default routes
