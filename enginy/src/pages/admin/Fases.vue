<template>
  <v-main class="bg-grey-lighten-5" style="min-height: 100vh; padding-top: 20px;">
    <v-container style="max-width: 1200px;">
      
      <div class="d-flex align-center justify-space-between mb-6">
        <div>
          <h1 class="text-h4 font-weight-bold text-primary-dark">Gestió de Fases</h1>
          <p class="text-subtitle-1 text-grey-darken-1">Configuració del calendari i estats del procés.</p>
        </div>
        <v-btn 
          variant="tonal" 
          color="grey-darken-2" 
          prepend-icon="mdi-arrow-left"
          @click="$router.back()"
        >
          Tornar
        </v-btn>
      </div>

      <v-card class="rounded-lg border" flat>
        <v-card-text class="text-center py-16">
          <v-icon size="64" color="grey-lighten-1">mdi-timeline-clock-outline</v-icon>
          <h3 class="text-h6 text-grey mt-4">Pàgina en construcció</h3>
        </v-card-text>
      </v-card>

    </v-container>
  </v-main>
</template>

<script setup>
// Aquí anirà la lògica per gestionar les fases
</script>