/**
 * router/index.ts
 *
 * Automatic routes for `./src/pages/*.vue`
 */

// Composables
import { createRouter, createWebHistory } from 'vue-router'

// Importamos el Store de Pinia
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
    meta: { requiresAuth: true, role: 'centre' } // O 'admin' si también quieres que entren
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
    meta: { requiresAuth: true } // Pública (Catálogo)
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

// --- GUARDIA DE NAVEGACIÓN (Seguridad) ---
router.beforeEach(async (to, from, next) => {
  // Inicializamos el store dentro del guard para evitar errores de inicialización
  const authStore = useAuthStore()

  // Obtenemos el rol del usuario (asumiendo que está en authStore.user.role)
  const userRole = authStore.user?.rol

  // 1. Si la ruta requiere autenticación y NO estamos logueados -> Login
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next('/login')
  }

  // 2. Si la ruta es solo para invitados (Login) y SI estamos logueados -> Redirigir según rol
  if (to.meta.guestOnly && authStore.isAuthenticated) {
    if (userRole === 'professor') return next('/tallersProfessor')
    if (userRole === 'admin') return next('/tallers') // O la home de admin
    if (userRole === 'centre') return next('/tallerCentre')
    return next('/tallers')
  }

  // 3. Control de Acceso por Rol (RBAC)
  const requiredRole = to.meta.role;
  const requiredRoles = to.meta.roles;

  if ((requiredRole || requiredRoles) && authStore.isAuthenticated) {
    // El admin siempre tiene acceso
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
      // Si no tiene acceso, redirigir a su página principal
      if (userRole === 'professor') return next('/tallersProfessor');
      if (userRole === 'centre') return next('/tallerCentre');
      return next('/tallers'); // Fallback
    }
  }

  // 4. Todo correcto, continuar
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