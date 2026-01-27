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
          <LogoutButton class="ml-2" />
        </div>
      </v-container>

      <div class="w-100 bg-grey-lighten-4 border-top">
        <v-container class="pa-0 d-flex align-center" style="height: 40px; max-width: 1000px;">
          
          <div class="d-flex h-100 align-center flex-grow-1">

            <v-btn 
              to="/tallerCentre" 
              variant="text" 
              class="text-none font-weight-bold text-blue-darken-4 rounded-0 h-100 menu-btn"
            >
              Catàleg de Tallers
            </v-btn>



            <v-btn 
              to="/assignarProfessors" 
              variant="text" 
              class="text-none font-weight-bold text-blue-darken-4 rounded-0 h-100 menu-btn"
            >
              Assignar Professors
            </v-btn>
          </div>
        </v-container>
      </div>
    </div>
  </v-app-bar>
</template>

<script setup>
  import LogoutButton from '@/components/LogoutButton.vue';
</script>

<style scoped>
.gap-3 { gap: 12px; }
.cursor-pointer { cursor: pointer; }
.hover-blue:hover { color: #004B87 !important; text-decoration: underline; }
img { object-fit: contain; }
.v-container { margin-left: auto; margin-right: auto; }

.menu-btn { transition: all 0.2s ease-in-out; }
.menu-btn:hover { background-color: #004B87 !important; color: white !important; }
.v-btn--active.menu-btn { background-color: #004B87 !important; color: white !important; opacity: 1; }
</style>