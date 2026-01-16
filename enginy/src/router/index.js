/**
 * router/index.ts
 *
 * Automatic routes for `./src/pages/*.vue`
 */

// Composables
import { createRouter, createWebHistory } from 'vue-router'

// Importamos el Store de Pinia
import { useAuthStore } from '@/stores/auth'

import paginaPrincipal from '@/pages/paginaPrincipal.vue'
import Tallers from '@/pages/Tallers.vue'
import Login from '@/pages/Login.vue'
import CrearTaller from '@/pages/admin/CrearTaller.vue'
import CrearSolicitud from '@/pages/Instituts/CrearSolicitud.vue'
import Solicituds  from '@/pages/admin/Solicituds.vue' 
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
    component: paginaPrincipal,
    meta: { requiresAuth: false } // Pública
  },
  {
    path: '/tallers',
    name: 'Tallers',
    component: Tallers,
    meta: { requiresAuth: false } // Pública (Catálogo)
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresAuth: false, guestOnly: true } // Solo para no logueados
  },
  // --- RUTAS PROTEGIDAS (Requieren Login) ---
  {
    path: '/crearTaller',
    name: 'CrearTaller',
    component: CrearTaller,
    meta: { requiresAuth: true }
  },
  {
    path: '/crearSolicitud/:id',
    name: 'CrearSolicitud',
    component: CrearSolicitud,
    meta: { requiresAuth: true }
  },
  {
    path: '/solicituds',
    name: 'Solicituds',
    component: Solicituds,
    meta: { requiresAuth: true }
  },
  {
    path: '/crearUsuaris',
    name: 'CrearUsuaris',
    component: CrearUsuaris,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// --- GUARDIA DE NAVEGACIÓN (Seguridad) ---
router.beforeEach(async (to, from, next) => {
  // Inicializamos el store dentro del guard para evitar errores de inicialización
  const authStore = useAuthStore()

  // 1. Si la ruta requiere autenticación y NO estamos logueados -> Login
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next('/login')
  }

  // 2. Si la ruta es solo para invitados (Login) y SI estamos logueados -> Home
  // (Para que no puedan volver al login si ya están dentro)
  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return next('/')
  }

  // 3. Todo correcto, continuar
  next()
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