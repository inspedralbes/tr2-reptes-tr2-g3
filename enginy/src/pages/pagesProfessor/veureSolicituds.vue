<template>
  <NavBarProfessor />

  <v-main class="bg-grey-lighten-5" style="min-height: 100vh; padding-top: 100px;">
    <v-container style="max-width: 1200px;">
      
      <div class="mb-8">
        <h1 class="text-h3 font-weight-bold text-grey-darken-4 mb-2">
          Les meves Assignacions
        </h1>
        <p class="text-subtitle-1 text-grey-darken-1">
          Gestiona els llistats d'alumnes i l'assistència dels grups assignats.
        </p>
      </div>

      <v-row v-if="loading">
        <v-col cols="12" v-for="n in 2" :key="n">
          <v-skeleton-loader type="article, actions" class="rounded-lg border"></v-skeleton-loader>
        </v-col>
      </v-row>

      <div v-else-if="tallersAssignats.length === 0" class="text-center py-10">
        <v-icon size="64" color="grey-lighten-1">mdi-calendar-blank</v-icon>
        <h3 class="text-h6 text-grey mt-4">No tens assignacions actualment.</h3>
      </div>

      <div v-else>
        <v-card 
          v-for="taller in tallersAssignats" 
          :key="taller._id" 
          class="mb-6 rounded-lg border"
          flat
        >
          <v-card-title class="d-flex align-center py-4 px-6 bg-white border-bottom">
            <v-avatar color="blue-lighten-5" class="mr-4" rounded>
              <v-icon color="blue-darken-2">mdi-school</v-icon>
            </v-avatar>
            <div>
              <div class="text-h6 font-weight-bold text-grey-darken-3">{{ taller.nom }}</div>
              <div class="text-caption text-grey-darken-1">
                <v-icon size="small" class="mr-1">mdi-map-marker</v-icon>
                {{ taller.lloc || 'Ubicació per determinar' }}
              </div>
            </div>
          </v-card-title>

          <v-divider></v-divider>

          <v-card-text class="pa-0">
            <v-table>
              <thead>
                <tr class="bg-grey-lighten-5">
                  <th class="text-left font-weight-bold">Centre Educatiu</th>
                  <th class="text-left font-weight-bold">Data Prevista</th>
                  <th class="text-center font-weight-bold">Estat Llistat</th>
                  <th class="text-end font-weight-bold px-6">Accions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="sol in taller.solicituds" :key="sol._id">
                  <td class="py-3">
                    <div class="font-weight-medium">
                        {{ sol.centre_info?.nom_oficial || sol.nomCentre || 'Centre Desconegut' }}
                    </div>
                    <div class="text-caption text-grey">
                        Codi: {{ sol.centre_info?.codi || sol.codi_centre || '---' }}
                    </div>
                  </td>

                  <td>
                    <v-chip size="small" color="blue-grey" variant="outlined">
                      {{ formatDate(sol.preferencies?.dia_preferit || sol.dia_preferit) }}
                    </v-chip>
                    <div class="text-caption text-grey mt-1">
                        {{ sol.alumnes_previstos }} alumnes
                    </div>
                  </td>

                  <td class="text-center">
                    <v-chip 
                      size="small" 
                      :color="tieneLista(sol) ? 'green-lighten-1' : 'orange-lighten-1'" 
                      variant="flat"
                      class="text-white font-weight-bold"
                    >
                      {{ tieneLista(sol) ? 'Pujat' : 'Pendent' }}
                    </v-chip>
                  </td>

                  <td class="text-end px-4">
                    <div class="d-flex justify-end gap-2">
                        <v-btn 
                          size="small" 
                          variant="tonal" 
                          color="green-darken-1" 
                          prepend-icon="mdi-microsoft-excel"
                          @click="abrirModalExcel(sol, taller.nom)"
                        >
                          Importar
                        </v-btn>

                        <v-btn 
                          size="small" 
                          variant="outlined" 
                          color="blue-grey" 
                          icon="mdi-eye"
                          :disabled="!tieneLista(sol)"
                          @click="veureLlistaAlumnes(sol)"
                        >
                        </v-btn>
                    </div>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </div>
    </v-container>

    <v-dialog v-model="dialogExcel" max-width="600">
      <v-card class="rounded-lg">
        <v-card-title class="d-flex justify-space-between align-center pa-4 bg-primary text-white">
          <span class="text-h6">Importar Alumnes</span>
          <v-btn icon="mdi-close" variant="text" color="white" @click="cerrarModalExcel"></v-btn>
        </v-card-title>
        
        <v-card-text class="pa-6">
          <v-alert type="info" variant="tonal" density="compact" class="mb-4">
            Pujant llistat per a: <strong>{{ obtenerNombreCentro(solicitudSeleccionada) }}</strong>
            <br><span class="text-caption">Activitat: {{ nombreTallerSeleccionado }}</span>
          </v-alert>

          <div class="d-flex justify-end mb-2">
             <v-btn size="x-small" variant="text" color="primary" @click="descargarPlantilla">
               <v-icon start>mdi-download</v-icon> Descarregar Plantilla Buida
             </v-btn>
          </div>

          <v-file-input
            v-model="archivoExcel"
            label="Seleccionar Excel (.xlsx)"
            accept=".xlsx, .xls"
            variant="outlined"
            prepend-icon="mdi-file-excel"
            @update:model-value="procesarExcel"
            :loading="procesando"
            show-size
          ></v-file-input>

          <div v-if="alumnosExtraidos.length > 0" class="mt-4">
             <p class="text-success font-weight-bold mb-2">
               <v-icon color="success" size="small">mdi-check</v-icon> {{ alumnosExtraidos.length }} alumnes detectats
             </p>
             <v-card border flat max-height="200" class="overflow-y-auto bg-grey-lighten-5">
               <v-list density="compact" class="bg-transparent">
                 <v-list-item 
                    v-for="(al, i) in alumnosExtraidos" 
                    :key="i" 
                    :title="al.nombre" 
                    :subtitle="al.centro"
                 >
                   <template v-slot:prepend><v-icon size="small" color="grey">mdi-account</v-icon></template>
                 </v-list-item>
               </v-list>
             </v-card>
          </div>

          <v-alert v-if="errorExcel" type="error" density="compact" class="mt-4">{{ errorExcel }}</v-alert>
        </v-card-text>

        <v-card-actions class="pa-4 pt-0">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="cerrarModalExcel">Cancel·lar</v-btn>
          <v-btn color="primary" variant="flat" :disabled="alumnosExtraidos.length === 0" @click="guardarAlumnos">Confirmar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogVerLista" max-width="500">
      <v-card class="rounded-lg">
        <v-card-title class="pa-4 border-bottom bg-grey-lighten-4 d-flex justify-space-between align-center">
          <span class="text-h6">Llista d'Assistència</span>
          <v-btn icon="mdi-close" variant="text" density="compact" @click="dialogVerLista = false"></v-btn>
        </v-card-title>
        
        <v-card-text class="pa-0" style="max-height: 400px; overflow-y: auto;">
          <v-list lines="one">
            <v-list-item 
              v-for="(alumne, i) in listaVisualizar" 
              :key="i"
              :title="alumne.nombre"
              :subtitle="alumne.centro"
              prepend-icon="mdi-account-check"
            >
               <template v-slot:append>
                  <v-icon color="success" size="small">mdi-check-circle-outline</v-icon>
               </template>
            </v-list-item>
          </v-list>
        </v-card-text>
        <div class="pa-3 text-center text-caption text-grey bg-grey-lighten-5">
          Total: {{ listaVisualizar.length }} alumnes inscrits.
        </div>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" color="success">Dades guardades correctament</v-snackbar>

  </v-main>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import NavBarProfessor from '../../components/NavBarProfessor.vue';
import { useAuthStore } from '@/stores/auth';
import * as XLSX from 'xlsx'; // Asegúrate de npm install xlsx

const authStore = useAuthStore();
const tallers = ref([]);
const solicituds = ref([]);
const loading = ref(true);

// Estados para Excel y Modales
const dialogExcel = ref(false);
const dialogVerLista = ref(false);
const archivoExcel = ref(null);
const solicitudSeleccionada = ref(null);
const nombreTallerSeleccionado = ref('');
const alumnosExtraidos = ref([]);
const listaVisualizar = ref([]);
const procesando = ref(false);
const errorExcel = ref('');
const snackbar = ref(false);

onMounted(async () => {
  try {
    // 1. Cargar datos
    const [resTallers, resSolicituds] = await Promise.all([
      fetch('http://localhost:3000/api/tallers'),
      fetch('http://localhost:3000/api/solicituds')
    ]);

    const tallersData = await resTallers.json();
    tallers.value = tallersData.map(t => ({
      ...t,
      lloc: t.nom_institut || 'Institut Públic'
    }));

    solicituds.value = await resSolicituds.json();

  } catch (error) {
    console.error("Error carregant dades:", error);
  } finally {
    loading.value = false;
  }
});

// === COMPUTED: FILTRADO DE ASIGNACIONES ===
const tallersAssignats = computed(() => {
  const userId = authStore.user?._id;
  // Si no hay usuario logueado (modo dev), simulamos ver todo o un ID fijo
  // const userId = "65a1..."; 

  return tallers.value.map(taller => {
    // Filtramos las solicitudes que pertenecen a este taller
    const solsDelTaller = solicituds.value.filter(s => {
      const idSol = s.taller_id && s.taller_id._id ? s.taller_id._id : s.taller_id;
      const esDelTaller = idSol === taller._id;
      
      // Filtramos por asignación al profesor actual (si existe el campo)
      // Si el campo no existe en tu BDD aún, comenta esta línea para ver todas
      const esAssignat = !userId || (s.professors_assignats_ids && s.professors_assignats_ids.includes(userId));
      
      return esDelTaller && esAssignat;
    });
    return { ...taller, solicituds: solsDelTaller };
  }).filter(t => t.solicituds.length > 0);
});

// === HELPERS ===
const formatDate = (dateStr) => {
  if (!dateStr) return 'Pendent';
  return new Date(dateStr).toLocaleDateString('ca-ES');
};

const tieneLista = (sol) => {
    return sol.llista_assistencia && sol.llista_assistencia.length > 0;
};

const obtenerNombreCentro = (sol) => {
    if (!sol) return '';
    return sol.centre_info?.nom_oficial || sol.nomCentre || 'Centre Educatiu';
};

// === LÓGICA EXCEL ===

const abrirModalExcel = (solicitud, nomTaller) => {
  solicitudSeleccionada.value = solicitud;
  nombreTallerSeleccionado.value = nomTaller;
  archivoExcel.value = null;
  alumnosExtraidos.value = [];
  errorExcel.value = '';
  dialogExcel.value = true;
};

const cerrarModalExcel = () => {
  dialogExcel.value = false;
};

const descargarPlantilla = () => {
  const ws = XLSX.utils.json_to_sheet([{ "Nom Alumne": "Exemple Nom", "Centre": "Exemple Institut" }]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Plantilla");
  XLSX.writeFile(wb, "Plantilla_Alumnes.xlsx");
};

// ... importaciones ...

const procesarExcel = async (eventValue) => {
  // 1. Obtenemos el valor. Preferimos el argumento del evento si existe, 
  // si no, usamos la variable reactiva.
  const rawFile = eventValue || archivoExcel.value;

  // 2. Si el usuario limpió el input (le dio a la X), rawFile será null o vacío.
  if (!rawFile || (Array.isArray(rawFile) && rawFile.length === 0)) {
    return;
  }

  procesando.value = true;
  errorExcel.value = '';
  alumnosExtraidos.value = [];
  
  try {
    // 3. NORMALIZACIÓN:
    // Si es un array, cogemos la posición 0. Si es un objeto, lo usamos directamente.
    const file = Array.isArray(rawFile) ? rawFile[0] : rawFile;

    // Comprobación final de seguridad
    if (!file) {
        throw new Error("No s'ha pogut llegir el fitxer.");
    }

    const data = await file.arrayBuffer(); // Ahora 'file' es seguro
    const workbook = XLSX.read(data);
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(firstSheet);

    // ... (resto de tu lógica de mapeo igual que antes) ...
    const extracted = jsonData.map(row => {
      const keys = Object.keys(row);
      const nameKey = keys.find(k => k.toLowerCase().includes('nom') || k.toLowerCase().includes('name'));
      const centerKey = keys.find(k => k.toLowerCase().includes('centr')); 
      
      if (nameKey) {
        return {
          nombre: row[nameKey],
          centro: centerKey ? row[centerKey] : obtenerNombreCentro(solicitudSeleccionada.value),
          presente: false
        };
      }
      return null;
    }).filter(i => i !== null);

    if (extracted.length === 0) errorExcel.value = "No s'han trobat noms al fitxer.";
    else alumnosExtraidos.value = extracted;

  } catch (e) {
    errorExcel.value = "Error llegint el fitxer: " + e.message;
    console.error(e);
  } finally {
    procesando.value = false;
  }
};

const guardarAlumnos = async () => {
  if (!solicitudSeleccionada.value) return;

  // 1. Llamada real al backend para guardar
  try {
      const payload = {
        sollicitud_id: solicitudSeleccionada.value._id,
        llista: alumnosExtraidos.value
      };
      
      // Asegúrate de tener este endpoint en server.js o usa uno existente
      const response = await fetch('http://localhost:3000/api/app/assistencia', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
      });
      
      if(!response.ok) throw new Error("Error al guardar");

      // 2. Actualizar estado local para ver el cambio instantáneo
      solicitudSeleccionada.value.llista_assistencia = alumnosExtraidos.value;
      
      snackbar.value = true;
      cerrarModalExcel();

  } catch (e) {
      alert("Error guardant els alumnes: " + e.message);
  }
};

// === VER LISTA ===
const veureLlistaAlumnes = (sol) => {
  // Mostramos la lista real guardada en la solicitud
  listaVisualizar.value = sol.llista_assistencia || [];
  dialogVerLista.value = true;
};
</script>

<style scoped>
.border-bottom { border-bottom: 1px solid #e0e0e0; }
.gap-2 { gap: 8px; }
</style>