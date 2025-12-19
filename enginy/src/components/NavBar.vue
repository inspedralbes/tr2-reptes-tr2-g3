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
            <v-icon size="small" class="mr-1">mdi-earth</v-icon>
            <span class="cursor-pointer hover-blue">Idioma</span>
          </div>
          <span class="cursor-pointer hover-blue mr-3">Notícies</span>
          <span class="cursor-pointer hover-blue mr-3">Mapa web</span>
          <span class="cursor-pointer hover-blue mr-3">Contacte</span>

          <v-btn icon size="x-small" color="#004B87" variant="text" class="mr-1"><v-icon>mdi-twitter</v-icon></v-btn>
          <v-btn icon size="x-small" color="#004B87" variant="text" class="mr-1"><v-icon>mdi-facebook</v-icon></v-btn>
          <v-btn icon size="x-small" color="#004B87" variant="text" class="mr-3"><v-icon>mdi-instagram</v-icon></v-btn>

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
              to="/crearSolicitud" 
              variant="text" 
              class="text-none font-weight-bold text-blue-darken-4 rounded-0 h-100 menu-btn"
            >
              Crear Sol·licitud
            </v-btn>
          </div>

          <div class="d-flex align-center" style="width: 250px;">
            <input 
              type="text" 
              placeholder="Text cerca" 
              class="px-2 py-1 bg-white border mr-0" 
              style="outline: none; font-size: 0.9rem; width: 100%; border-color: #ddd;"
            >
            <v-btn 
              icon="mdi-magnify" 
              variant="flat" 
              color="grey-lighten-2" 
              size="small" 
              class="rounded-0"
              style="height: 31px; width: 35px;"
            ></v-btn>
          </div>
        </v-container>
      </div>

    </div>
  </v-app-bar>
</template>

<script setup>
  import { useRouter } from 'vue-router';
  const router = useRouter();

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