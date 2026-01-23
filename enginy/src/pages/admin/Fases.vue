<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const API_URL = 'http://localhost:3000/api'
const router = useRouter()
const route = useRoute()

const taller = ref(null)
const faseActual = ref(null)
const cargandoFase = ref(false)
const mensaje = ref({ show: false, text: '', color: '' })

const tallerId = route.params.id;

const nomFase = computed(() => {
    const mapa = { 1: "Inscripció", 2: "Validació", 3: "Assignació" };
    return mapa[faseActual.value] || 'Desconeguda';
});

const cargarTaller = async () => {
  try {
    const res = await fetch(`${API_URL}/tallers/${tallerId}`)
    if (res.ok) {
      const data = await res.json()
      taller.value = data;
      faseActual.value = data.fase || 1;
    }
  } catch (e) { console.error("Error al cargar dades del taller", e) }
}

const cambiarFase = async (valorFase) => {
  cargandoFase.value = true
  try {
    const res = await fetch(`${API_URL}/tallers/${tallerId}/fase`, { 
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nuevaFase: valorFase }) 
    })
    if (!res.ok) throw new Error('Error en la respuesta')
    
    mensaje.value = { show: true, text: 'Fase del taller actualitzada correctament', color: 'success' }
  } catch (e) {
    mensaje.value = { show: true, text: 'No s’ha pogut connectar amb el servidor', color: 'error' }
  } finally {
    cargandoFase.value = false
  }
}

onMounted(cargarTaller)
</script>

<template>
  <v-container class="pa-10">
    <v-btn variant="text" prepend-icon="mdi-arrow-left" @click="router.back()" class="mb-5">
      Tornar al Panell
    </v-btn>

    <h1 class="text-h4 font-weight-bold mb-6">Configuració de Fases per a: {{ taller?.nom }}</h1>
    
    <v-card variant="outlined" class="pa-8 border-consorci bg-white">
      <div class="d-flex align-center mb-6 ga-4">
        <v-icon size="40" color="black">mdi-sync</v-icon>
        <div>
          <div class="text-h6 font-weight-bold">Fase Actual: {{ faseActual }} ({{ nomFase }})</div>
          <div class="text-caption text-grey">Selecciona la fase activa per a aquest taller.</div>
        </div>
      </div>

      <v-divider class="mb-8"></v-divider>

      <div class="d-flex flex-column ga-4">
        <v-btn-toggle
          v-model="faseActual"
          mandatory
          color="black"
          variant="flat"
          class="d-flex flex-column ga-4 h-auto bg-transparent"
          @update:model-value="cambiarFase"
        >
          <v-btn :value="1" height="80" class="rounded-lg border justify-start px-8">
            <div class="text-left">
              <div class="font-weight-bold">1. FASE D'INSCRIPCIÓ</div>
              <div class="text-caption text-lowercase">Els centres poden sol·licitar tallers.</div>
            </div>
          </v-btn>

          <v-btn :value="2" height="80" class="rounded-lg border justify-start px-8">
            <div class="text-left">
              <div class="font-weight-bold">2. FASE DE VALIDACIÓ</div>
              <div class="text-caption text-lowercase">Revisió de peticions i documentació.</div>
            </div>
          </v-btn>

          <v-btn :value="3" height="80" class="rounded-lg border justify-start px-8">
            <div class="text-left">
              <div class="font-weight-bold">3. FASE D'ASSIGNACIÓ</div>
              <div class="text-caption text-lowercase">Publicació de resultats i adjudicació final.</div>
            </div>
          </v-btn>
        </v-btn-toggle>
      </div>

      <div v-if="cargandoFase" class="d-flex align-center justify-center mt-6 ga-2">
        <v-progress-circular indeterminate size="20" color="black"></v-progress-circular>
        <span class="text-caption">Actualitzant sistema...</span>
      </div>
    </v-card>

    <v-snackbar v-model="mensaje.show" :color="mensaje.color" timeout="3000">
      {{ mensaje.text }}
    </v-snackbar>
  </v-container>
</template>

<style scoped>
.border-consorci { border: 1px solid #e0e0e0 !important; border-radius: 12px; }
.v-btn-group--vertical { flex-direction: column; }
</style>