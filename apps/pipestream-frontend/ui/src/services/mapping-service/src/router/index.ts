import { createRouter, createWebHistory } from 'vue-router'
import MappingDemoView from '../views/MappingDemoView.vue'

const router = createRouter({
  history: createWebHistory('/mapping-service/'),
  routes: [
    {
      path: '/',
      name: 'home',
      component: MappingDemoView
    },
    {
      path: '/demo',
      name: 'demo',
      component: MappingDemoView
    }
  ]
})

export default router