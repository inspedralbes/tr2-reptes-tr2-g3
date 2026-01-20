<template>
  <NavBarProfessor />

  <v-main class="bg-grey-lighten-5" style="min-height: 100vh; padding-top: 120px;">
    
    <v-container style="max-width: 1200px;" class="mb-10">
      <v-row align="end">
        <v-col cols="12" md="7">
          <h1 class="text-h3 font-weight-bold text-grey-darken-4 mb-2" style="letter-spacing: -1px;">
            Catàleg Formatiu
          </h1>
          <p class="text-subtitle-1 text-grey-darken-1 font-weight-regular">
            Gestiona els teus tallers assignats.
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
            {{ cerca ? 'RESULTATS DE CERCA' : 'ELS TEUS TALLERS' }}
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
                <v-img :src="generarImagen(taller)" height="180" cover class="align-end">
                  <div class="ma-3">
                    <v-sheet color="white" class="d-inline-flex align-center px-2 py-1 rounded text-caption font-weight-bold shadow-sm" style="opacity: 0.95;">
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
                    <span class="text-truncate font-weight-medium">{{ taller.lloc }}</span>
                  </div>
                </div>

                <div class="d-flex gap-2 flex-wrap mb-4">
                   <div v-for="(tag, index) in taller.tags" :key="index" class="technical-tag">
                     {{ tag }}
                   </div>
                </div>
              </v-card-text>

              <v-divider class="mx-5 border-opacity-50"></v-divider>

              <div class="px-5 py-3 d-flex align-center justify-space-between bg-grey-lighten-5">
                <div class="d-flex align-center">
                   <div class="status-dot mr-2" :class="getStatusClass(taller.places_disponibles)"></div>
                   <div>
                    <div class="text-caption font-weight-bold text-grey-darken-3">{{ getTextoPlazas(taller) }}</div>
                   </div>
                </div>

                <v-tooltip text="Pujar llistat d'alumnes (Excel)" location="top">
                  <template v-slot:activator="{ props }">
                    <v-btn
                      v-bind="props"
                      icon
                      variant="tonal"
                      color="green-darken-1"
                      size="small"
                      @click.stop="abrirModalExcel(taller)"
                      class="ml-2"
                    >
                      <v-icon>mdi-file-excel</v-icon>
                    </v-btn>
                  </template>
                </v-tooltip>
              </div>
            </v-card>
          </v-col>

          <v-col cols="12" v-if="!carregant && tallersFiltrats.length === 0" class="py-16 text-center">
             </v-col>
        </v-row>
      </div>
    </v-container>

    <v-dialog v-model="dialogExcel" max-width="600px" persistent>
      <v-card class="rounded-lg">
        <v-card-title class="d-flex justify-space-between align-center pa-4 bg-grey-lighten-4">
          <span class="text-h6 font-weight-bold text-grey-darken-3">
            Importar Alumnes
          </span>
          <v-btn icon="mdi-close" variant="text" size="small" @click="cerrarModalExcel"></v-btn>
        </v-card-title>

        <v-card-text class="pa-5">
          <p class="text-body-2 text-grey-darken-1 mb-4">
            Pujar un fitxer Excel (.xlsx) pel taller: <strong>{{ tallerSeleccionado?.nom }}</strong>.
            <br>El sistema extraurà automàticament els noms i centres.
          </p>

          <v-file-input
            v-model="archivoExcel"
            label="Seleccionar fitxer Excel"
            accept=".xlsx, .xls, .csv"
            prepend-icon="mdi-microsoft-excel"
            variant="outlined"
            density="comfortable"
            @change="procesarExcel"
            :loading="procesando"
            show-size
          ></v-file-input>

          <div v-if="alumnosExtraidos.length > 0" class="mt-4">
            <div class="d-flex align-center mb-2">
              <v-icon color="success" class="mr-2">mdi-check-circle-outline</v-icon>
              <span class="font-weight-bold">{{ alumnosExtraidos.length }} alumnes detectats</span>
            </div>
            
            <v-card border flat class="overflow-y-auto" max-height="250">
              <v-table density="compact">
                <thead>
                  <tr>
                    <th class="text-left">Nom de l'alumne</th>
                    <th class="text-left">Centre Educatiu</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(alumno, i) in alumnosExtraidos" :key="i">
                    <td>{{ alumno.nombre }}</td>
                    <td>{{ alumno.centro }}</td>
                  </tr>
                </tbody>
              </v-table>
            </v-card>
          </div>

          <v-alert
            v-if="errorExcel"
            type="error"
            variant="tonal"
            class="mt-4"
            icon="mdi-alert-circle"
            density="compact"
          >
            {{ errorExcel }}
          </v-alert>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" color="grey" @click="cerrarModalExcel">Cancel·lar</v-btn>
          <v-btn 
            color="primary" 
            variant="flat" 
            :disabled="alumnosExtraidos.length === 0"
            @click="guardarAlumnos"
          >
            Confirmar Importació
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import NavBarProfessor from '../../components/NavBarProfessor.vue';
// IMPORTANTE: Asegúrate de instalar: npm install xlsx
import * as XLSX from 'xlsx';

const router = useRouter();
const cerca = ref('');
const tallers = ref([]);
const carregant = ref(true);

// === NUEVAS VARIABLES PARA EL EXCEL ===
const dialogExcel = ref(false);
const tallerSeleccionado = ref(null);
const archivoExcel = ref(null);
const alumnosExtraidos = ref([]);
const procesando = ref(false);
const errorExcel = ref('');

// === MÉTODOS EXISTENTES ===
onMounted(async () => {
  try {
    const response = await fetch('http://localhost:3000/api/tallers');
    if (!response.ok) throw new Error('Network error');
    const data = await response.json();
    tallers.value = data.map(t => ({
      ...t,
      tags: Object.keys(t.detalls_tecnics || {}).filter(key => t.detalls_tecnics[key] === true).map(k => k.charAt(0).toUpperCase() + k.slice(1)), 
      lloc: t.nom_institut || "Institut Públic" 
    }));
  } catch (error) { console.error(error); } 
  finally { carregant.value = false; }
});

const tallersFiltrats = computed(() => {
  if (!cerca.value) return tallers.value;
  const q = cerca.value.toLowerCase();
  return tallers.value.filter(t => t.nom.toLowerCase().includes(q) || t.modalitat.toLowerCase().includes(q) || t.lloc.toLowerCase().includes(q));
});

const getColorModalitat = (mod) => { const map = { 'A': '#3B82F6', 'B': '#10B981', 'C': '#F59E0B' }; return map[mod] || 'grey'; };
const getStatusClass = (n) => { if (n === 0) return 'bg-grey'; if (n <= 3) return 'bg-red pulse'; return 'bg-green'; };
const getTextoPlazas = (t) => { if (t.places_disponibles === 0) return 'Complet'; if (t.places_disponibles <= 3) return 'Últimes places'; return 'Disponible'; };

const generarImagen = (taller) => {
  if (taller.imatge && taller.imatge.startsWith('http')) return taller.imatge;
  const nom = taller.nom || '';
  const keywords = { 'Robòtica': 'robot', 'Cuina': 'chef', 'Vela': 'sailing', 'Impressió': '3dprinting', 'Mecànica': 'mechanic', 'Jardineria': 'garden', 'Sanitat': 'hospital', 'Imatge': 'camera' };
  const key = Object.keys(keywords).find(k => nom.includes(k));
  return `https://source.unsplash.com/500x300/?${key ? keywords[key] : 'school'}`;
};

const veureDetall = (taller) => {
  if (taller.places_disponibles === 0) return; 
  router.push(`/crearSolicitud/${taller._id}`);
};

// === NUEVA LÓGICA PARA EXCEL ===

const abrirModalExcel = (taller) => {
  tallerSeleccionado.value = taller;
  archivoExcel.value = null;
  alumnosExtraidos.value = [];
  errorExcel.value = '';
  dialogExcel.value = true;
};

const cerrarModalExcel = () => {
  dialogExcel.value = false;
  setTimeout(() => {
    tallerSeleccionado.value = null;
    alumnosExtraidos.value = [];
  }, 300);
};

const procesarExcel = async () => {
  if (!archivoExcel.value) return;
  
  procesando.value = true;
  errorExcel.value = '';
  alumnosExtraidos.value = [];

  try {
    const file = archivoExcel.value; // En Vuetify 3 a veces es un array, verifica si necesitas [0]
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Leemos la primera hoja
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convertimos a JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // EXTRAEMOS SOLO NOMBRE Y CENTRO
        // Ajusta las claves 'Nombre' y 'Centro' según como venga tu Excel real (p.ej 'nom_alumne', 'Nom', etc)
        const extracted = jsonData.map(row => {
          // Buscamos columnas comunes, ignorando mayúsculas/minúsculas
          const keys = Object.keys(row);
          const nameKey = keys.find(k => k.toLowerCase().includes('nom') || k.toLowerCase().includes('name') || k.toLowerCase().includes('alumno'));
          const centerKey = keys.find(k => k.toLowerCase().includes('centr') || k.toLowerCase().includes('institut') || k.toLowerCase().includes('school'));

          if (nameKey && centerKey) {
            return {
              nombre: row[nameKey],
              centro: row[centerKey]
            };
          }
          return null;
        }).filter(item => item !== null);

        if (extracted.length === 0) {
          errorExcel.value = "No s'han trobat columnes de 'Nom' o 'Centre' al fitxer.";
        } else {
          alumnosExtraidos.value = extracted;
        }
      } catch (err) {
        errorExcel.value = "Error al llegir el format del fitxer.";
        console.error(err);
      } finally {
        procesando.value = false;
      }
    };
    
    // Vuetify file input devuelve un array o un objeto File dependiendo de la configuración
    const blob = Array.isArray(file) ? file[0] : file; 
    reader.readAsArrayBuffer(blob);

  } catch (err) {
    procesando.value = false;
    errorExcel.value = "Error general en la càrrega.";
  }
};

const guardarAlumnos = async () => {
  // AQUÍ VA TU LLAMADA AL BACKEND
  console.log("Enviando al backend para el taller:", tallerSeleccionado.value._id);
  console.log("Datos:", alumnosExtraidos.value);
  
  // Ejemplo:
  // await fetch('api/guardar-alumnos', { method: 'POST', body: ... })
  
  // Simulamos éxito
  alert(`S'han importat ${alumnosExtraidos.value.length} alumnes correctament!`);
  cerrarModalExcel();
};
</script>

<style scoped>
/* Tus estilos anteriores se mantienen igual */
.hover-card { transition: all 0.2s ease-in-out; cursor: pointer; border-color: #e0e0e0 !important; }
.hover-card:hover { transform: translateY(-2px); border-color: #2196F3 !important; box-shadow: 0 4px 20px rgba(0,0,0,0.08) !important; }
.img-container { position: relative; overflow: hidden; }
.overlay-full { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(2px); z-index: 2; }
.technical-tag { font-size: 0.7rem; font-weight: 600; text-transform: uppercase; color: #546e7a; background-color: #eceff1; padding: 4px 8px; border-radius: 4px; }
.status-dot { width: 8px; height: 8px; border-radius: 50%; }
.bg-green { background-color: #10B981; }
.bg-red { background-color: #EF4444; }
.bg-grey { background-color: #9CA3AF; }
@keyframes pulse-animation { 0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); } 70% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); } 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); } }
.pulse { animation: pulse-animation 2s infinite; }
.search-field :deep(.v-field__outline__start), .search-field :deep(.v-field__outline__end) { border-color: #e0e0e0; }
</style>