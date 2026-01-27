

import { createRouter, createWebHistory } from 'vue-router'


import { useAuthStore } from '@/stores/auth'

import Tallers from '@/pages/Tallers.vue'
import Login from '@/pages/Login.vue'
import CrearTaller from '@/pages/admin/CrearTaller.vue'
import CrearSolicitud from '@/pages/Instituts/CrearSolicitud.vue'
import Solicituds  from '@/pages/admin/Solicituds.vue' 
import CrearUsuaris from '@/pages/admin/CrearUsuaris.vue'
import TallersProfessor from '@/pages/pagesProfessor/TallersProfessor.vue'
import NavBarProfessor from '@/components/NavBarProfessor.vue'
import TallerCentre from '@/pages/Instituts/TallerCentre.vue'
import AssignarProfessors from '@/pages/Instituts/AssignarProfessors.vue'
import Fases from '@/pages/admin/Fases.vue'

const routes = [
  {
    path: '/fases/:id',
    name: 'Fases',
    component: Fases,
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/tallerCentre',
    name: 'TallerCentre',
    component: TallerCentre,
    meta: { requiresAuth: true, role: 'centre' }
  },
  {
    path: '/assignarProfessors',
    name: 'AssignarProfessors',
    component: AssignarProfessors,
    meta: { requiresAuth: true, role: 'centre' }
  },
  {
    path: '/navBarProfessor',
    name: 'NavBarProfessor',
    component: NavBarProfessor,
    meta: { requiresAuth: true, role: 'professor' }
  },
  {
    path: '/tallersProfessor',
    name: 'TallersProfessor',
    component: TallersProfessor,
    meta: { requiresAuth: true, role: 'professor' }
  },
  {
    path: '/',
    name: 'LoginHome',
    component: Login,
    meta: { requiresAuth: false, guestOnly: true }
  },
  {
    path: '/tallers',
    name: 'Tallers',
    component: Tallers,
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresAuth: false, guestOnly: true }
  },

  {
    path: '/crearTaller',
    name: 'CrearTaller',
    component: CrearTaller,
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/crearSolicitud/:id',
    name: 'CrearSolicitud',
    component: CrearSolicitud,
    meta: { requiresAuth: true, roles: ['centre', 'professor'] }
  },
  {
    path: '/solicituds',
    name: 'Solicituds',
    component: Solicituds,
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/crearUsuaris',
    name: 'CrearUsuaris',
    component: CrearUsuaris,
    meta: { requiresAuth: true, role: 'admin' }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})


router.beforeEach(async (to, from, next) => {

  const authStore = useAuthStore()


  const userRole = authStore.user?.rol


  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next('/login')
  }


  if (to.meta.guestOnly && authStore.isAuthenticated) {
    if (userRole === 'professor') return next('/tallersProfessor')
    if (userRole === 'admin') return next('/tallers')
    if (userRole === 'centre') return next('/tallerCentre')
    return next('/tallers')
  }


  const requiredRole = to.meta.role;
  const requiredRoles = to.meta.roles;

  if ((requiredRole || requiredRoles) && authStore.isAuthenticated) {

    if (userRole === 'admin') {
      return next();
    }

    let hasAccess = false;
    if (requiredRole) {
      hasAccess = userRole === requiredRole;
    } else if (requiredRoles) {
      hasAccess = requiredRoles.includes(userRole);
    }

    if (!hasAccess) {

      if (userRole === 'professor') return next('/tallersProfessor');
      if (userRole === 'centre') return next('/tallerCentre');
      return next('/tallers');
    }
  }


  next()
})


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