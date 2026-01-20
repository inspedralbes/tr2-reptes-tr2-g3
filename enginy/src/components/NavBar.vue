<template>
  <v-app-bar color="white" elevation="2" height="auto" class="pa-0">
    
    <div class="d-flex flex-column w-100">

      <v-container class="pa-0 py-3 d-flex align-center justify-space-between" style="max-width: 1000px;">
        <div class="d-flex align-center">
          <img 
            src="/logo/CEB_logo_blau.png" 
            alt="Logo Consorci" 
            height="50"
            class="mr-3" 
          />
        </div>

        <div class="d-none d-md-flex align-center text-caption text-grey-darken-2 gap-3">
          <div class="d-flex align-center mr-4">
          </div>
          <template v-if="!authStore.isAuthenticated">
            <v-btn 
              prepend-icon="mdi-account" 
              variant="outlined" 
              size="small"
              color="#333"
              class="text-none ml-2"
              @click="irALogin"
            >
              Accedeix
            </v-btn>
          </template>
          <LogoutButton v-else class="ml-2" />
        </div>
      </v-container>

      <div class="w-100 bg-grey-lighten-4 border-top">
        <v-container class="pa-0 d-flex align-center" style="height: 40px; max-width: 1000px;">
          
          <div class="d-flex h-100 align-center flex-grow-1">
            <div 
              class="d-flex align-center px-4 h-100 font-weight-bold cursor-pointer" 
              style="background-color: #004B87; color: white;"
              @click="irAInicio"
            >
              Inici
            </div>

            <v-btn 
              to="/tallers" 
              variant="text" 
              class="text-none font-weight-bold text-blue-darken-4 rounded-0 h-100 menu-btn"
            >
              Tallers
            </v-btn>
            <v-btn 
              to="/crearTaller" 
              variant="text" 
              class="text-none font-weight-bold text-blue-darken-4 rounded-0 h-100 menu-btn"
            >
              Crear Taller
            </v-btn>
            <v-btn 
              to="/solicituds" 
              variant="text" 
              class="text-none font-weight-bold text-blue-darken-4 rounded-0 h-100 menu-btn"
            >
              Administrar Sol·licituds
            </v-btn>
            <v-btn 
              to="/crearUsuaris" 
              variant="text" 
              class="text-none font-weight-bold text-blue-darken-4 rounded-0 h-100 menu-btn"
            >
              Crear Usuaris
            </v-btn>
          </div>
        </v-container>
      </div>

    </div>
  </v-app-bar>
</template>

<script setup>
  import { useRouter } from 'vue-router';
  import { useAuthStore } from '@/stores/auth';
  import LogoutButton from '@/components/LogoutButton.vue';

  const router = useRouter();
  const authStore = useAuthStore();

  const irAInicio = () => { router.push('/'); }
  const irALogin = () => { router.push('/login'); }
</script>

<style scoped>
.gap-3 { gap: 12px; }
.cursor-pointer { cursor: pointer; }
.hover-blue:hover { color: #004B87 !important; text-decoration: underline; }
input::placeholder { color: #999; font-style: italic; }
img { object-fit: contain; }
.v-container { margin-left: auto; margin-right: auto; }

/* --- ESTILOS NUEVOS PARA EL MENÚ --- */

/* 1. Transición suave */
.menu-btn {
  transition: all 0.2s ease-in-out;
}

/* 2. Efecto HOVER: Fondo Azul y Texto Blanco */
.menu-btn:hover {
  background-color: #004B87 !important;
  color: white !important;
}

/* 3. Efecto ACTIVO (cuando estás en esa página): Se queda Azul */
.v-btn--active.menu-btn {
  background-color: #004B87 !important;
  color: white !important;
  opacity: 1; /* Evita transparencias de Vuetify */
}
</style>