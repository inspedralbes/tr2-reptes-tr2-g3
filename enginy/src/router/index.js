/**
 * router/index.ts
 *
 * Automatic routes for `./src/pages/*.vue`
 */

// Composables
import { createRouter, createWebHistory } from 'vue-router'

import paginaPrincipal from '@/pages/paginaPrincipal.vue'
import Tallers from '@/pages/Tallers.vue'
import Login from '@/pages/Login.vue'
import CrearTaller from '@/pages/CrearTaller.vue'
import CrearSolicitud from '@/pages/CrearSolicitud.vue'
import Solicituds  from '@/pages/Solicituds.vue' 
import CrearUsuaris from '@/pages/CrearUsuaris.vue'
import paginaPrincipalProfessor from '@/pages/pagesProfessor/paginaPrincipalProfessor.vue'
import TallersProfessor from '@/pages/pagesProfessor/TallersProfessor.vue'
import NavBarProfessor from '@/components/NavBarProfessor.vue'
import veureSolicituds from '@/pages/pagesProfessor/veureSolicituds.vue'

const routes = [
  {
    path: '/veureSolicituds',
    name: 'veureSolicituds',
    component: veureSolicituds
  },
  {
    path: '/navBarProfessor',
    name: 'NavBarProfessor',
    component: NavBarProfessor
  },
  {
    path: '/tallersProfessor',
    name: 'TallersProfessor',
    component: TallersProfessor
  },
  {
    path: '/paginaPrincipalProfessor',
    name: 'paginaPrincipalProfessor',
    component: paginaPrincipalProfessor
  },
  {
    path: '/tallers',
    name: 'Tallers',
    component: Tallers
  },
  {
    path: '/',
    name: 'paginaPrincipal',
    component: paginaPrincipal
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/crearTaller',
    name: 'CrearTaller',
    component: CrearTaller
  },
  {
    path: '/crearSolicitud/:id',
    name: 'CrearSolicitud',
    component: CrearSolicitud
  },
  {
    path: '/solicituds',
    name: 'Solicituds',
    component: Solicituds
  },
  {
    path: '/crearUsuaris',
    name: 'CrearUsuaris',
    component: CrearUsuaris
  }
]
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// Workaround for https://github.com/vitejs/vite/issues/11804
router.onError((err, to) => {
  if (err?.message?.includes?.('Failed to fetch dynamically imported module')) {
    if (localStorage.getItem('vuetify:dynamic-reload')) {
      console.error('Dynamic import error, reloading page did not fix it', err)
    } else {
      console.log('Reloading page to fix dynamic import error')
      localStorage.setItem('vuetify:dynamic-reload', 'true')
      location.assign(to.fullPath)
    }
  } else {
    console.error(err)
  }
})

router.isReady().then(() => {
  localStorage.removeItem('vuetify:dynamic-reload')
})

export default router
