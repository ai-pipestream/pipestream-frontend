import { createRouter, createWebHistory } from 'vue-router'
import RegistrationView from '../views/RegistrationView.vue'

const router = createRouter({
  history: createWebHistory('/platform-registration/'),
  routes: [
    {
      path: '/',
      name: 'home',
      component: RegistrationView
    },
    {
      path: '/services',
      name: 'services',
      component: RegistrationView
    }
  ]
})

export default router