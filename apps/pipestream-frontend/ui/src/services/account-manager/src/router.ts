import { createRouter, createWebHistory } from 'vue-router'
import AccountListView from './views/AccountListView.vue'
import AccountCreateView from './views/AccountCreateView.vue'
import AccountEditView from './views/AccountEditView.vue'

const routes = [
  {
    path: '/',
    name: 'AccountList',
    component: AccountListView,
  },
  {
    path: '/create',
    name: 'AccountCreate',
    component: AccountCreateView,
  },
  {
    path: '/edit/:accountId',
    name: 'AccountEdit',
    component: AccountEditView,
    props: true,
  },
]

const router = createRouter({
  history: createWebHistory('/account/'),
  routes,
})

export default router
