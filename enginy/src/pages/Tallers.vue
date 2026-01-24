<template>
  <NavBar />

  <v-main class="bg-grey-lighten-5" style="min-height: 100vh; padding-top: 120px;">
    
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
            >
              <div class="img-container">
                <v-img 
                  :src="generarImagen(taller)" 
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
                <div v-else-if="taller.fase !== 1" class="overlay-full d-flex align-center justify-center" style="background: rgba(0,0,0,0.4)">
                  <span class="text-white font-weight-bold text-uppercase bg-orange-darken-2 px-3 py-1 rounded">Inscripció Tancada</span>
                </div>
              </div>

            <v-card-text class="flex-grow-1 pt-4 pb-2 px-5">
  <div class="mb-3">
    <h3 class="text-h6 font-weight-bold text-grey-darken-4 mb-1" style="line-height: 1.3;">
      {{ taller.nom }}
    </h3>
    
    <div class="d-flex align-start text-caption text-grey-darken-1 mt-2">
      <v-icon size="16" class="mr-1 mt-1 text-primary">mdi-map-marker</v-icon>
      <div>
        <div class="font-weight-bold text-body-2">{{ taller.lloc }}</div>
        <div v-if="taller.adreca_institut" class="text-grey text-caption" style="line-height: 1.1;">
          {{ taller.adreca_institut }}<br>
          {{ taller.municipi_institut }}
        </div>
        <div v-else class="text-orange-darken-2 font-weight-bold text-caption mt-1">
          Disponibilitat sota demanda
        </div>
      </div>
    </div>
  </div>

  <div class="d-flex gap-2 flex-wrap mb-4 mt-3">
     <div v-for="(tag, index) in taller.tags" :key="index" class="technical-tag">
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
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const cerca = ref('');
const tallers = ref([]);
const carregant = ref(true);
const authStore = useAuthStore();

onMounted(async () => {
  try {
    const tallersResponse = await fetch('https://enginygrup3.dam.inspedralbes.cat/api/tallers');

    if (!tallersResponse.ok) throw new Error('Error de xarxa al carregar tallers');
    
    const tallersData = await tallersResponse.json();

    tallers.value = tallersData.map(t => ({
      ...t,
      fase: t.fase || 1, // Assegurem que la fase té un valor per defecte
      // Generamos tags basados en los detalles técnicos
      tags: Object.keys(t.detalls_tecnics || {})
            .filter(key => t.detalls_tecnics[key] === true)
            .map(key => key.charAt(0).toUpperCase() + key.slice(1)), 
      
      lloc: t.nom_institut || "Institut Públic" 
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
  // Añadimos filtro por 'lloc' para poder buscar por nombre de instituto también
  return tallers.value.filter(t => 
    t.nom.toLowerCase().includes(q) || 
    t.modalitat.toLowerCase().includes(q) ||
    t.lloc.toLowerCase().includes(q)
  );
});

// Colores más corporativos
const getColorModalitat = (mod) => {
  const map = { 'A': '#3B82F6', 'B': '#10B981', 'C': '#F59E0B' }; 
  return map[mod] || 'grey';
};

const getStatusClass = (n) => {
  if (n === 0) return 'bg-grey';
  if (n <= 3) return 'bg-red pulse';
  return 'bg-green';
};

const getTextoPlazas = (t) => {
  if (t.places_disponibles === 0) return 'Complet';
  if (t.places_disponibles <= 3) return 'Últimes places';
  return 'Disponible';
};

const generarImagen = (taller) => {
  // 1. Prioridad: Imagen real guardada en BDD (si la pusiste en CrearTaller)
  if (taller.imatge && taller.imatge.startsWith('http')) {
    return taller.imatge;
  }

  // 2. Fallback: Unsplash automático según el nombre
  const nom = taller.nom || '';
  const keywords = {
    'Robòtica': 'robot', 'Cuina': 'chef', 'Vela': 'sailing', 
    'Impressió': '3dprinting', 'Mecànica': 'mechanic', 'Jardineria': 'garden',
    'Sanitat': 'hospital', 'Imatge': 'camera'
  };
  // Busca una palabra clave o usa 'school' por defecto
  const key = Object.keys(keywords).find(k => nom.includes(k));
  const word = key ? keywords[key] : 'school';
  
  return `https://source.unsplash.com/500x300/?${word}`;
};

const veureDetall = (taller) => {
  if (authStore.user?.rol === 'admin') {
    router.push(`/fases/${taller._id}`);
  } else {
    router.push(`/crearSolicitud/${taller._id}`);
  }
};
</script>

<style scoped>
/* ESTILOS (Igual que los tenías) */

.hover-card {
  transition: all 0.2s ease-in-out;
  cursor: pointer;
  border-color: #e0e0e0 !important;
}

.hover-card:hover {
  transform: translateY(-2px);
  border-color: #2196F3 !important;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08) !important;
}

.img-container {
  position: relative;
  overflow: hidden;
}

.overlay-full {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(2px);
  z-index: 2;
}

.technical-tag {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  color: #546e7a;
  background-color: #eceff1;
  padding: 4px 8px;
  border-radius: 4px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.bg-green { background-color: #10B981; }
.bg-red { background-color: #EF4444; }
.bg-grey { background-color: #9CA3AF; }

@keyframes pulse-animation {
  0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
  70% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
  100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
}
.pulse {
  animation: pulse-animation 2s infinite;
}

.search-field :deep(.v-field__outline__start),
.search-field :deep(.v-field__outline__end) {
  border-color: #e0e0e0;
}
</style>