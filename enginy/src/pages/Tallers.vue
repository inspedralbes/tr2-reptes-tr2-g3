<template>
  <NavBar />

  <v-main class="bg-grey-lighten-5" style="min-height: 100vh; padding-top: 80px;">
    
    <v-container style="max-width: 1200px;" class="mb-10">
      <v-row align="end">
        <v-col cols="12" md="7">
          <h1 class="text-h3 font-weight-bold text-grey-darken-4 mb-2" style="letter-spacing: -1px;">
            Catàleg Formatiu
          </h1>
          <p class="text-subtitle-1 text-grey-darken-1 font-weight-regular">
            Gestiona la teva inscripció als tallers d'especialització FP.
          </p>
        </v-col>
        
        <v-col cols="12" md="5">
          <v-text-field
            v-model="cerca"
            placeholder="Cercar tallers, modalitat o lloc..."
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="comfortable"
            bg-color="white"
            hide-details
            class="search-field"
            rounded="lg"
          ></v-text-field>
        </v-col>
      </v-row>
      
      <v-divider class="mt-6 border-opacity-75"></v-divider>
    </v-container>


    <v-container style="max-width: 1200px;">
      
      <v-row v-if="carregant">
        <v-col cols="12" md="4" v-for="n in 3" :key="n">
          <v-skeleton-loader class="rounded-lg border" type="image, article" elevation="0"></v-skeleton-loader>
        </v-col>
      </v-row>

      <div v-else>
        <div class="d-flex justify-space-between align-center mb-6">
          <span class="text-overline text-grey-darken-1 font-weight-bold">
            {{ cerca ? 'RESULTATS DE CERCA' : 'TALLERS DISPONIBLES' }}
          </span>
          <span class="text-caption text-grey">
            Mostrant {{ tallersFiltrats.length }} activitats
          </span>
        </div>

        <v-row>
          <v-col cols="12" sm="6" md="4" v-for="taller in tallersFiltrats" :key="taller._id">
            
            <v-card 
              flat 
              border
              class="rounded-lg h-100 d-flex flex-column hover-card bg-white" 
              @click="veureDetall(taller)"
              :disabled="taller.places_disponibles === 0"
            >
              <div class="img-container">
                <v-img 
                  :src="generarImagen(taller.nom)" 
                  height="180" 
                  cover
                  class="align-end"
                >
                  <div class="ma-3">
                    <v-sheet 
                      color="white" 
                      class="d-inline-flex align-center px-2 py-1 rounded text-caption font-weight-bold shadow-sm"
                      style="opacity: 0.95;"
                    >
                      <v-icon size="small" :color="getColorModalitat(taller.modalitat)" class="mr-1">mdi-circle</v-icon>
                      MODALITAT {{ taller.modalitat }}
                    </v-sheet>
                  </div>
                </v-img>
                
                <div v-if="taller.places_disponibles === 0" class="overlay-full d-flex align-center justify-center">
                  <span class="text-white font-weight-bold text-uppercase bg-black px-3 py-1 rounded">Exhaurit</span>
                </div>
              </div>

              <v-card-text class="flex-grow-1 pt-4 pb-2 px-5">
                <div class="mb-3">
                  <h3 class="text-h6 font-weight-bold text-grey-darken-4 mb-1" style="line-height: 1.3;">
                    {{ taller.nom }}
                  </h3>
                  <div class="d-flex align-center text-caption text-grey-darken-1">
                    <v-icon size="14" class="mr-1 text-grey">mdi-map-marker-outline</v-icon>
                    <span class="text-truncate">{{ taller.lloc || 'Ubicació pendent' }}</span>
                  </div>
                </div>

                <div class="d-flex gap-2 flex-wrap mb-4">
                   <div 
                      v-for="(tag, index) in taller.tags" 
                      :key="index"
                      class="technical-tag"
                   >
                     {{ tag }}
                   </div>
                </div>
              </v-card-text>

              <v-divider class="mx-5 border-opacity-50"></v-divider>

              <div class="px-5 py-4 d-flex align-center justify-space-between bg-grey-lighten-5">
                
                <div class="d-flex align-center">
                  <div class="status-dot mr-2" :class="getStatusClass(taller.places_disponibles)"></div>
                  <div>
                    <div class="text-caption font-weight-bold text-grey-darken-3">
                      {{ getTextoPlazas(taller) }}
                    </div>
                    <div class="text-caption text-grey" style="font-size: 0.7rem !important;">
                      {{ taller.places_disponibles }} lliures
                    </div>
                  </div>
                </div>

                <v-icon color="grey-lighten-1" size="small">mdi-arrow-right</v-icon>
              </div>
            </v-card>
          </v-col>

          <v-col cols="12" v-if="!carregant && tallersFiltrats.length === 0" class="py-16 text-center">
            <div class="d-inline-block pa-6 rounded-circle bg-grey-lighten-4 mb-4">
              <v-icon size="40" color="grey">mdi-magnify</v-icon>
            </div>
            <h3 class="text-h6 text-grey-darken-3">Sense resultats</h3>
            <p class="text-body-2 text-grey mb-4">Prova amb altres termes de cerca.</p>
            <v-btn variant="outlined" color="primary" @click="cerca = ''">Veure tot</v-btn>
          </v-col>
        </v-row>
      </div>
    </v-container>
  </v-main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import NavBar from '@/components/NavBar.vue';

const router = useRouter();
const cerca = ref('');
const tallers = ref([]);
const carregant = ref(true);

onMounted(async () => {
  try {
    const response = await fetch('http://localhost:3000/api/tallers');
    if (!response.ok) throw new Error('Network error');
    
    const data = await response.json();

    tallers.value = data.map(t => ({
      ...t,
      tags: Object.keys(t.detalls_tecnics || {})
            .filter(key => t.detalls_tecnics[key] === true)
            .map(key => key.charAt(0).toUpperCase() + key.slice(1)), 
      lloc: t.horari || "Institut Milà i Fontanals" 
    }));
  } catch (error) {
    console.error(error);
  } finally {
    carregant.value = false;
  }
});

const tallersFiltrats = computed(() => {
  if (!cerca.value) return tallers.value;
  const q = cerca.value.toLowerCase();
  return tallers.value.filter(t => 
    t.nom.toLowerCase().includes(q) || 
    t.modalitat.toLowerCase().includes(q)
  );
});

// Colores más corporativos
const getColorModalitat = (mod) => {
  const map = { 'A': '#3B82F6', 'B': '#10B981', 'C': '#F59E0B' }; // Azul, Verde, Ambar (Tailwind palette)
  return map[mod] || 'grey';
};

const getStatusClass = (n) => {
  if (n === 0) return 'bg-grey';
  if (n <= 3) return 'bg-red pulse'; // Rojo con animación
  return 'bg-green';
};

const getTextoPlazas = (t) => {
  if (t.places_disponibles === 0) return 'Complet';
  if (t.places_disponibles <= 3) return 'Últimes places';
  return 'Disponible';
};

// En HomeView.vue

const generarImagen = (taller) => {
  // 1. Si el taller tiene una imagen guardada en BDD, úsala:
  if (taller.imatge && taller.imatge.startsWith('http')) {
    return taller.imatge;
  }

  // 2. Si no, usa la lógica automática de Unsplash (Fallback):
  const nom = taller.nom || '';
  const keywords = {
    'Robòtica': 'technology', 'Cuina': 'kitchen', 'Vela': 'ocean', 
    'Impressió': 'lab', 'Mecànica': 'engineering', 'Jardineria': 'nature'
  };
  const key = Object.keys(keywords).find(k => nom.includes(k));
  const word = key ? keywords[key] : 'work';
  return `https://source.unsplash.com/500x300/?${word}`;
};

const veureDetall = (taller) => {
  if (taller.places_disponibles === 0) return; 
  router.push(`/taller/${taller._id}`);
};
</script>

<style scoped>
/* ESTILOS CUSTOM PARA LOOK PROFESIONAL */

.hover-card {
  transition: all 0.2s ease-in-out;
  cursor: pointer;
  border-color: #e0e0e0 !important;
}

.hover-card:hover {
  transform: translateY(-2px);
  border-color: #2196F3 !important; /* Azul primario al hover */
  box-shadow: 0 4px 20px rgba(0,0,0,0.08) !important;
}

.img-container {
  position: relative;
  overflow: hidden;
}

/* Overlay oscuro cuando está lleno */
.overlay-full {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(2px);
  z-index: 2;
}

/* Tags técnicos minimalistas */
.technical-tag {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  color: #546e7a;
  background-color: #eceff1;
  padding: 4px 8px;
  border-radius: 4px;
}

/* Status Dot (El puntito de color) */
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.bg-green { background-color: #10B981; }
.bg-red { background-color: #EF4444; }
.bg-grey { background-color: #9CA3AF; }

/* Animación sutil para urgencia */
@keyframes pulse-animation {
  0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
  70% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
  100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
}
.pulse {
  animation: pulse-animation 2s infinite;
}

/* Buscador custom */
.search-field :deep(.v-field__outline__start),
.search-field :deep(.v-field__outline__end) {
  border-color: #e0e0e0;
}
</style>