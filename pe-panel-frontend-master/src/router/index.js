import { createRouter, createWebHashHistory } from 'vue-router'
import { h, resolveComponent } from 'vue'

import DefaultLayout from '@/layouts/DefaultLayout'
import { useAxios } from '@/api/ApiClient'

import { toast } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: DefaultLayout,
    redirect: '/dashboard',
    children: [
      {
        path: '/dashboard',
        name: 'Dashboard',
        // route level code-splitting
        // this generates a separate chunk (about.[hash].js) for this route
        // which is lazy-loaded when the route is visited.
        component: () =>
          import(/* webpackChunkName: "dashboard" */ '@/views/Dashboard.vue'),
      },
      {
        path: '/logs',
        name: 'Logs',
        component: {
          render() {
            return h(resolveComponent('router-view'))
          },
        },
        children: [
          {
            path: '/logs/server',
            name: 'ServerLogs',
            component: () => import('@/views/logs/ServerLogs.vue'),
          },
          {
            path: '/logs/panel',
            name: 'PanelLogs',
            component: () => import('@/views/logs/PanelLogs.vue'),
          },
        ],
      },
      {
        path: '/users',
        name: 'Users',
        component: {
          render() {
            return h(resolveComponent('router-view'))
          },
        },
        children: [
          {
            path: '/users',
            name: 'PanelUsers',
            component: () => import('@/views/users/PanelUsers.vue'),
          },
        ],
      },
      {
        path: '/players',
        name: 'Players',
        component: {
          render() {
            return h(resolveComponent('router-view'))
          },
        },
        children: [
          {
            path: '/players/list',
            name: 'Playerss',
            component: () => import('@/views/players/Players.vue'),
          },
          {
            path: '/players/banlist',
            name: 'PlayersBanList',
            component: () => import('@/views/players/BanList.vue'),
          },
        ],
      },
      {
        path: '/compensatecalculator',
        name: 'CompensateCalculator',
        component: () => import('@/views/tools/CompensateCalculator.vue'),
      },
      {
        path: '/roles',
        name: 'Roles',
        component: () => import('@/views/roles/Roles.vue'),
      },
      {
        path: '/server',
        name: 'Server',
        component: () => import('@/views/server/Server.vue'),
      },
    ],
  },
  {
    path: '/login',
    name: 'Login',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import('@/views/pages/Login.vue'),
  },
  {
    path: '/logout',
    name: 'Logout',
    redirect: () => {
      localStorage.clear()
      toast.success('Succesfully logout.')
      return { path: '/login' }
    },
  },
  {
    path: '/ticket-viewer',
    name: 'TicketViewer',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import('@/views/tools/TicketViewer.vue'),
  },
]

const router = createRouter({
  history: createWebHashHistory(process.env.BASE_URL),
  routes,
  scrollBehavior() {
    // always scroll to top
    return { top: 0 }
  },
})

router.beforeEach(async (to, from) => {
  if (from.name !== 'Login' && to.name !== 'Login') {
    try {
      const actions = localStorage.getItem('actions')
      if (!actions) {
        localStorage.clear()
        return { path: 'login' }
      }
      const axios = useAxios()
      await axios.get('auth/me')
      return true
    } catch (error) {
      localStorage.clear()
      return { path: 'login' }
    }
  } else {
    return true
  }
})

export default router
