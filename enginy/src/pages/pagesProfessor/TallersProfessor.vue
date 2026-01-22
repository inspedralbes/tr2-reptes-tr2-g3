<template>
  <NavBarProfessor />

  <v-main class="bg-grey-lighten-5" style="min-height: 100vh; padding-top: 120px;">
    
    <v-container style="max-width: 1200px;" class="mb-10">
      <v-row align="end">
        <v-col cols="12" md="7">
          <h1 class="text-h3 font-weight-bold text-grey-darken-4 mb-2">
            Els meus Tallers
          </h1>
          <p class="text-subtitle-1 text-grey-darken-1">
            Gestiona l'assistència i puja els llistats d'alumnes.
          </p>
        </v-col>
        <v-col cols="12" md="5">
          <v-text-field
            v-model="cerca"
            placeholder="Cercar..."
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            bg-color="white"
            hide-details
            rounded="lg"
          ></v-text-field>
        </v-col>
      </v-row>
      <v-divider class="mt-6 border-opacity-75"></v-divider>
    </v-container>

    <v-container style="max-width: 1200px;">
      <v-row v-if="carregant">
        <v-col cols="12" md="4" v-for="n in 3" :key="n">
          <v-skeleton-loader class="rounded-lg border" type="image, article"></v-skeleton-loader>
        </v-col>
      </v-row>

      <div v-else>
        <v-row>
          <v-col cols="12" sm="6" md="4" v-for="taller in tallersFiltrats" :key="taller._id">
            <v-card flat border class="rounded-lg h-100 d-flex flex-column hover-card bg-white">
              
              <div class="img-container">
                <v-img :src="generarImagen(taller)" height="180" cover class="align-end">
                   <div class="ma-3">
                     <v-sheet color="white" class="px-2 py-1 rounded text-caption font-weight-bold">
                        {{ taller.nom_institut || 'Taller Assignat' }}
                     </v-sheet>
                   </div>
                </v-img>
              </div>

              <v-card-text class="flex-grow-1 pt-4">
                <h3 class="text-h6 font-weight-bold mb-1">{{ taller.nom }}</h3>
                <div class="text-caption text-grey mb-3">
                   <v-icon size="small">mdi-calendar</v-icon> {{ formataData(taller.data) }}
                </div>
                
                <v-chip size="small" :color="taller.llista_assistencia?.length > 0 ? 'green' : 'orange'" variant="flat">
                   {{ taller.llista_assistencia?.length > 0 ? 'Llistat Pujat' : 'Pendent Alumnes' }}
                </v-chip>
              </v-card-text>

              <v-divider></v-divider>

              <div class="px-4 py-3 d-flex justify-space-between align-center bg-grey-lighten-5">
                <span class="text-caption text-grey">Gestionar Alumnes</span>
                
                <v-btn
                  variant="flat"
                  color="green-darken-1"
                  size="small"
                  prepend-icon="mdi-microsoft-excel"
                  @click="abrirModalExcel(taller)"
                >
                  Importar Excel
                </v-btn>
              </div>
            </v-card>
          </v-col>
        </v-row>
        
        <div v-if="!carregant && tallersFiltrats.length === 0" class="text-center py-10">
           <p>No tens tallers assignats actualment.</p>
        </div>
      </div>
    </v-container>

    <v-dialog v-model="dialogExcel" max-width="700px" persistent transition="dialog-bottom-transition">
      <v-card class="rounded-xl">
        <v-card-title class="bg-primary text-white py-4 px-6 d-flex justify-space-between align-center">
          <span class="text-h6 font-weight-bold">
            <v-icon class="mr-2">mdi-file-upload</v-icon> Importar Alumnes
          </span>
          <v-btn icon="mdi-close" variant="text" color="white" @click="cerrarModalExcel"></v-btn>
        </v-card-title>

        <v-card-text class="pa-6">
          
          <v-alert
            color="info"
            variant="tonal"
            icon="mdi-information"
            class="mb-6 border-s-4"
            border="start"
          >
            <div class="d-flex align-center justify-space-between flex-wrap gap-2">
              <div>
                <strong>No saps quin format utilitzar?</strong>
                <div class="text-caption">Descarrega la plantilla buida, omple-la i puja-la de nou.</div>
              </div>
              <v-btn 
                color="info" 
                variant="flat" 
                size="small" 
                prepend-icon="mdi-download"
                @click="descargarPlantilla"
              >
                Descarregar Plantilla
              </v-btn>
            </div>
          </v-alert>

          <p class="text-subtitle-2 mb-2">Pujar llistat per a: <strong>{{ tallerSeleccionado?.nom }}</strong></p>
          
          <v-file-input
            v-model="archivoExcel"
            label="Arrossega el teu Excel aquí"
            accept=".xlsx, .xls, .csv"
            prepend-inner-icon="mdi-microsoft-excel"
            prepend-icon=""
            variant="outlined"
            density="comfortable"
            @update:model-value="procesarExcel"
            :loading="procesando"
            show-size
            class="mb-4"
            color="green"
          ></v-file-input>

          <div v-if="alumnosExtraidos.length > 0">
            <div class="d-flex justify-space-between align-center mb-2">
              <span class="text-subtitle-2 text-success font-weight-bold">
                <v-icon start size="small">mdi-check-circle</v-icon>
                {{ alumnosExtraidos.length }} alumnes detectats
              </span>
            </div>
            
            <v-card border elevation="0" max-height="300" class="overflow-y-auto bg-grey-lighten-5">
              <v-table density="compact" class="bg-transparent">
                <thead>
                  <tr>
                    <th class="text-left font-weight-bold">Nom Alumne</th>
                    <th class="text-left font-weight-bold">Centre</th>
                    <th class="text-center font-weight-bold">Estat</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(alumno, i) in alumnosExtraidos" :key="i">
                    <td>{{ alumno.nombre }}</td>
                    <td>{{ alumno.centro }}</td>
                    <td class="text-center"><v-icon color="grey-lighten-1" size="small">mdi-clock-outline</v-icon></td>
                  </tr>
                </tbody>
              </v-table>
            </v-card>
          </div>

          <v-alert v-if="errorExcel" type="error" variant="tonal" class="mt-4" density="compact">
            {{ errorExcel }}
          </v-alert>

        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="pa-4 bg-grey-lighten-5">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="cerrarModalExcel">Cancel·lar</v-btn>
          <v-btn 
            color="primary" 
            size="large"
            variant="flat" 
            :disabled="alumnosExtraidos.length === 0"
            :loading="guardando"
            @click="guardarAlumnos"
            prepend-icon="mdi-content-save"
          >
            Guardar Llistat
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="3000">
       {{ snackbarText }}
    </v-snackbar>

  </v-main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth'; // Asegúrate de tener esto
import NavBarProfessor from '../../components/NavBarProfessor.vue';
import * as XLSX from 'xlsx';

const router = useRouter();
const authStore = useAuthStore();
const cerca = ref('');
const tallers = ref([]); // Aquí guardaremos los talleres asignados
const carregant = ref(true);

// Variables Excel
const dialogExcel = ref(false);
const tallerSeleccionado = ref(null);
const archivoExcel = ref(null);
const alumnosExtraidos = ref([]);
const procesando = ref(false);
const guardando = ref(false);
const errorExcel = ref('');

// Feedback
const snackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('success');

// === 1. CARGAR TALLERES ASIGNADOS AL PROFESOR ===
onMounted(async () => {
  try {
    const userId = authStore.user?._id || 'ID_PRUEBA'; // Reemplaza ID_PRUEBA si no usas Pinia aún
    
    // NOTA: Endpoint que deberías crear en el backend (ver respuesta anterior)
    const response = await fetch(`http://localhost:3000/api/app/profesor/${userId}/tallers`);
    
    if (!response.ok) throw new Error('Error al carregar tallers');
    const data = await response.json();
    tallers.value = data;
  } catch (error) {
    console.error(error);
  } finally {
    carregant.value = false;
  }
});

// === 2. DESCARGAR PLANTILLA (NUEVO) ===
const descargarPlantilla = () => {
  // Datos de ejemplo
  const datosEjemplo = [
    { "Nom Alumne": "Joan Garcia Pérez", "Centre Educatiu": "Institut Milà i Fontanals" },
    { "Nom Alumne": "Maria Vila Roig", "Centre Educatiu": "Institut Escola del Treball" },
    { "Nom Alumne": "Pau López Sans", "Centre Educatiu": "Institut Milà i Fontanals" }
  ];

  // Crear hoja de trabajo
  const ws = XLSX.utils.json_to_sheet(datosEjemplo);
  
  // Ajustar ancho de columnas (opcional, para que se vea bonito)
  ws['!cols'] = [{ wch: 30 }, { wch: 30 }];

  // Crear libro
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Plantilla Alumnes");

  // Descargar archivo
  XLSX.writeFile(wb, "Plantilla_Assistència.xlsx");
};

// === 3. PROCESAR EXCEL (CON LOGICA DE NOMBRES) ===
const procesarExcel = async (eventValue) => {
  // eventValue viene desde @update:model-value; si no, usamos el ref archivoExcel
  const incoming = typeof eventValue !== 'undefined' ? eventValue : archivoExcel.value;

  // Normalizamos a un único file: puede ser File o Array
  if (!incoming) return;

  let file;
  if (Array.isArray(incoming)) {
    if (incoming.length === 0) return;
    file = incoming[0];
  } else {
    file = incoming;
  }

  // Validar que realmente es un Blob/File antes de usar FileReader
  const isBlobLike = file && (typeof File !== 'undefined' && file instanceof File || typeof Blob !== 'undefined' && file instanceof Blob);
  if (!isBlobLike) {
    // Puede ocurrir que Vuetify entregue un objeto diferente; mostramos mensaje útil
    errorExcel.value = 'Fitxer no vàlid: selecciona un fitxer Excel (.xlsx/.xls/.csv).';
    alumnosExtraidos.value = [];
    procesando.value = false;
    return;
  }

  procesando.value = true;
  errorExcel.value = '';
  alumnosExtraidos.value = [];

  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);

      // Mapeo flexible de columnas
      const extracted = jsonData.map(row => {
        // Normalizamos las claves a minúsculas para buscar "nom" o "name"
        const keys = Object.keys(row);

        const keyNombre = keys.find(k => k.toLowerCase().includes('nom') || k.toLowerCase().includes('name') || k.toLowerCase().includes('alum'));
        const keyCentro = keys.find(k => k.toLowerCase().includes('centr') || k.toLowerCase().includes('institut'));

        if (keyNombre) {
          return {
            nombre: row[keyNombre],
            centro: keyCentro ? row[keyCentro] : (tallerSeleccionado.value?.nom_institut || 'Desconegut'), // Si no hay columna centro, usamos el del taller
            presente: false // Para la App móvil luego
          };
        }
        return null;
      }).filter(item => item !== null);

      if (extracted.length === 0) {
        errorExcel.value = "No s'ha trobat la columna 'Nom Alumne' al fitxer.";
      } else {
        alumnosExtraidos.value = extracted;
      }
    } catch (err) {
      console.error(err);
      errorExcel.value = "El fitxer no té un format vàlid.";
    } finally {
      procesando.value = false;
    }
  };

  try {
    reader.readAsArrayBuffer(file);
  } catch (err) {
    console.error('Error leyendo fichero:', err);
    errorExcel.value = 'No s’ha pogut llegir el fitxer seleccionat.';
    procesando.value = false;
  }
};

// === 4. GUARDAR EN BACKEND ===
const guardarAlumnos = async () => {
  guardando.value = true;
  try {
    const payload = {
      sollicitud_id: tallerSeleccionado.value._id, // ID de la solicitud/taller asignado
      llista: alumnosExtraidos.value
    };

    const response = await fetch('http://localhost:3000/api/app/assistencia', { // Reutilizamos el endpoint de la APP o creamos uno nuevo
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if(!response.ok) throw new Error("Error al guardar");

    snackbarText.value = "Llistat importat correctament!";
    snackbarColor.value = "success";
    snackbar.value = true;
    
    // Actualizar lista local para que salga la etiqueta verde
    const index = tallers.value.findIndex(t => t._id === tallerSeleccionado.value._id);
    if(index !== -1) {
        tallers.value[index].llista_assistencia = alumnosExtraidos.value;
    }

    cerrarModalExcel();

  } catch (e) {
    snackbarText.value = "Error al guardar el llistat.";
    snackbarColor.value = "error";
    snackbar.value = true;
  } finally {
    guardando.value = false;
  }
};

// Helpers
const abrirModalExcel = (taller) => {
  tallerSeleccionado.value = taller;
  archivoExcel.value = null;
  alumnosExtraidos.value = [];
  dialogExcel.value = true;
};
const cerrarModalExcel = () => { dialogExcel.value = false; };
const tallersFiltrats = computed(() => tallers.value.filter(t => t.nom_taller?.toLowerCase().includes(cerca.value.toLowerCase()) || !cerca.value)); // Ajustado a la estructura que definimos antes
const generarImagen = (t) => `https://source.unsplash.com/500x300/?education`;
const formataData = (d) => d ? new Date(d).toLocaleDateString() : 'Data pendent';

</script>

<style scoped>
.hover-card { transition: all 0.2s; cursor: pointer; border-color: #eee; }
.hover-card:hover { transform: translateY(-3px); border-color: #4CAF50 !important; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
.gap-2 { gap: 8px; }
.border-s-4 { border-left-width: 4px !important; }
</style>