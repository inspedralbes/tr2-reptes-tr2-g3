<template>
  <v-main class="bg-grey-lighten-5">
    <v-container fluid class="pa-8">
      
      <div class="d-flex flex-wrap align-center justify-space-between mb-6 gap-4">
        <div>
          <h1 class="text-h4 font-weight-bold text-primary-dark">
            <v-icon class="mr-2 mb-1">mdi-file-document-multiple</v-icon>
            Gestió de Sol·licituds
          </h1>
          <p class="text-subtitle-1 text-grey-darken-1">Administra les peticions dels centres educatius</p>
        </div>
        
        <div class="d-flex align-center gap-4">
          <v-card flat class="d-flex align-center px-4 py-2 rounded-lg border-orange bg-orange-lighten-5">
            <v-avatar color="orange-darken-1" size="small" class="mr-3">
              <v-icon icon="mdi-clock-outline" size="small"></v-icon>
            </v-avatar>
            <div>
              <div class="text-caption text-orange-darken-4 font-weight-bold">PENDENTS</div>
              <div class="text-h6 font-weight-black text-orange-darken-4">{{ countPendientes }}</div>
            </div>
          </v-card>

          <v-btn 
            color="primary" 
            height="50" 
            prepend-icon="mdi-refresh" 
            @click="cargarSolicitudes"
            :loading="loading"
          >
            Actualitzar
          </v-btn>
          <v-btn 
            variant="tonal" 
            color="grey-darken-2" 
            prepend-icon="mdi-arrow-left"
            height="50"
            @click="$router.back()"
          >
            Tornar
          </v-btn>
        </div>
      </div>

      <v-card class="rounded-xl shadow-sm" elevation="3">
        
        <v-toolbar color="white" flat class="px-4 border-bottom pt-2 pb-2">
          <v-text-field
            v-model="search"
            prepend-inner-icon="mdi-magnify"
            label="Cercar (Centre, Taller, Email...)"
            variant="outlined"
            density="compact"
            hide-details
            class="mr-4 custom-search"
            style="max-width: 350px;"
          ></v-text-field>

          <v-spacer></v-spacer>

          <v-chip-group v-model="filtroEstado" selected-class="text-primary" mandatory>
            <v-chip value="TODAS" filter variant="outlined">Totes</v-chip>
            <v-chip value="pendent" filter variant="outlined" color="orange">Pendents</v-chip>
            <v-chip value="assignat" filter variant="outlined" color="success">Assignades</v-chip>
            <v-chip value="rebutjada" filter variant="outlined" color="error">Rebutjades</v-chip>
          </v-chip-group>
        </v-toolbar>

        <v-data-table
          :headers="headers"
          :items="solicitudesFiltradas"
          :loading="loading"
          hover
          class="text-body-2"
        >
          <template v-slot:item.data_solicitud="{ item }">
            <div class="d-flex flex-column">
              <span class="font-weight-medium">{{ formatearFecha(item.data_solicitud).fecha }}</span>
              <span class="text-caption text-grey">{{ formatearFecha(item.data_solicitud).hora }}</span>
            </div>
          </template>

          <template v-slot:item.usuario="{ item }">
            <div class="py-2">
              <div class="font-weight-bold text-body-1 text-primary-dark">
                {{ item.centre_info?.nom_oficial || 'Nom no disponible' }}
              </div>
              
              <div class="d-flex align-center mt-1">
                 <v-chip 
                    v-if="item.centre_info?.codi" 
                    size="x-small" 
                    color="blue-grey-lighten-4" 
                    variant="flat" 
                    class="mr-2 font-weight-bold text-blue-grey-darken-3"
                 >
                    {{ item.centre_info.codi }}
                 </v-chip>
                 
                 <div class="text-caption text-grey-darken-2 d-flex align-center font-weight-medium">
                    <v-icon size="x-small" class="mr-1">mdi-email-outline</v-icon> 
                    {{ item.centre_info?.email || '-' }}
                 </div>
              </div>
            </div>
          </template>

          <template v-slot:item.taller="{ item }">
            <v-chip size="small" variant="tonal" color="primary" class="font-weight-bold">
              {{ item.taller_id?.nom || 'Taller eliminat' }}
            </v-chip>
          </template>

          <template v-slot:item.preferencies.relevancia="{ item }">
            <v-chip 
              :color="getColorPrioridad(item.preferencies?.relevancia)" 
              size="small" 
              variant="flat"
              class="font-weight-bold"
            >
              <v-icon start size="x-small" :icon="getIconPrioridad(item.preferencies?.relevancia)"></v-icon>
              {{ item.preferencies?.relevancia || 'Normal' }}
            </v-chip>
          </template>

          <template v-slot:item.alumnes_previstos="{ item }">
            <div class="font-weight-bold text-h6 text-grey-darken-2">{{ item.alumnes_previstos }}</div>
          </template>

          <template v-slot:item.estat="{ item }">
            <v-chip 
              :color="getColorEstado(item.estat)" 
              size="small" 
              class="font-weight-bold text-uppercase"
              label
            >
              {{ item.estat }}
            </v-chip>
          </template>

          <template v-slot:item.acciones="{ item }">
            <div v-if="item.estat === 'pendent'" class="d-flex justify-end gap-2">
              <v-tooltip text="Acceptar" location="top">
                <template v-slot:activator="{ props }">
                  <v-btn 
                    v-bind="props"
                    icon="mdi-check" 
                    color="success" 
                    variant="flat" 
                    size="small"
                    @click="actualizarEstado(item, 'assignat')" 
                    :loading="loadingId === item._id"
                  ></v-btn>
                </template>
              </v-tooltip>

              <v-tooltip text="Rebutjar" location="top">
                <template v-slot:activator="{ props }">
                  <v-btn 
                    v-bind="props"
                    icon="mdi-close" 
                    color="error" 
                    variant="tonal" 
                    size="small"
                    @click="actualizarEstado(item, 'rebutjada')"
                    :loading="loadingId === item._id"
                  ></v-btn>
                </template>
              </v-tooltip>
            </div>
            <div v-else class="text-caption text-grey text-right font-italic pr-2">
              Gestionada
            </div>
          </template>

          <template v-slot:expanded-row="{ columns, item }">
            <tr>
              <td :colspan="columns.length" class="bg-grey-lighten-5 pa-4">
                <v-row no-gutters>
                   <v-col cols="12" md="6" class="d-flex align-start mb-2 mb-md-0">
                      <v-icon color="primary" class="mr-3 mt-1">mdi-calendar-clock</v-icon>
                      <div>
                        <strong class="text-primary-dark">Dia Preferit:</strong>
                        <span class="ml-2 text-body-2">{{ item.preferencies?.dia_preferit || "No especificat" }}</span>
                      </div>
                   </v-col>
                   <v-col cols="12" md="6" class="d-flex align-start">
                      <v-icon color="primary" class="mr-3 mt-1">mdi-message-text-outline</v-icon>
                      <div>
                        <strong class="text-primary-dark">Observacions de l'institut:</strong>
                        <p class="mb-0 mt-1 text-body-2 text-grey-darken-3">
                          {{ item.preferencies?.observacions || "No hi ha observacions." }}
                        </p>
                      </div>
                   </v-col>
                </v-row>
              </td>
            </tr>
          </template>
        </v-data-table>
      </v-card>
    </v-container>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" location="top" timeout="3000">
      <div class="d-flex align-center">
        <v-icon class="mr-2">{{ snackbar.icon }}</v-icon>
        {{ snackbar.text }}
      </div>
    </v-snackbar>
  </v-main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const loading = ref(true);
const loadingId = ref(null);
const search = ref('');
const filtroEstado = ref('TODAS');
const solicitudes = ref([]);
const snackbar = ref({ show: false, text: '', color: 'success', icon: 'mdi-check' });

const getPrioridadValue = (prioridad) => {
  const p = prioridad || 'Normal';
  if (p === 'Alta') return 3;
  if (p === 'Normal') return 2;
  if (p === 'Baixa') return 1;
  return 2;
};

const headers = [
  { title: 'Data', key: 'data_solicitud', width: '100px', sortable: false },
  { title: 'Institut / Contacte', key: 'usuario', width: '300px', sortable: false },
  { title: 'Taller', key: 'taller', sortable: false },
  {
    title: 'Prioritat',
    key: 'preferencies.relevancia',
    align: 'center',
    width: '120px',
    sort: (a, b) => {
      const valA = getPrioridadValue(a);
      const valB = getPrioridadValue(b);
      return valA - valB;
    },
  },
  { title: 'Alumnes', key: 'alumnes_previstos', align: 'center' },
  { title: 'Estat', key: 'estat', align: 'center' },
  { title: 'Accions', key: 'acciones', align: 'end', sortable: false },
];

const solicitudesFiltradas = computed(() => {
  let items = solicitudes.value;

  if (filtroEstado.value !== 'TODAS') {
    items = items.filter(s => s.estat === filtroEstado.value);
  }

  if (search.value && search.value.trim() !== '') {
    const searchTerm = search.value.toLowerCase().trim();
    items = items.filter(s => {
      const searchIn = [
        s.centre_info?.nom_oficial,
        s.taller_id?.nom,
        s.centre_info?.email,
      ].join(' ').toLowerCase();

      return searchIn.includes(searchTerm);
    });
  }

  return items;
});

const countPendientes = computed(() => 
  solicitudes.value.filter(s => s.estat === 'pendent').length
);

const cargarSolicitudes = async () => {
  loading.value = true;
  try {
    const response = await fetch('http://localhost:3000/api/solicituds'); 
    if (response.ok) {
      solicitudes.value = await response.json();
    } else {
      console.warn("Error backend");
    }
  } catch (error) {
    console.error("Error fetch:", error);
  } finally {
    loading.value = false;
  }
};

const actualizarEstado = async (item, nuevoEstado) => {
  loadingId.value = item._id;
  try {
    const response = await fetch(`http://localhost:3000/api/solicituds/${item._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estat: nuevoEstado })
    });

    if (!response.ok) throw new Error('Error al servidor');

    const index = solicitudes.value.findIndex(s => s._id === item._id);
    if(index !== -1) solicitudes.value[index].estat = nuevoEstado;

    mostrarNotificacion(`Estat canviat a: ${nuevoEstado}`, 'success', 'mdi-check-circle');

  } catch (error) {
    mostrarNotificacion('Error actualitzant estat', 'error', 'mdi-alert');
    console.error(error);
  } finally {
    loadingId.value = null;
  }
};

const formatearFecha = (fechaISO) => {
  if (!fechaISO) return { fecha: '-', hora: '' };
  const d = new Date(fechaISO);
  return {
    fecha: d.toLocaleDateString('ca-ES', { day: '2-digit', month: '2-digit' }),
    hora: d.toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' })
  };
};

const getColorEstado = (estado) => {
  const mapa = {
    'pendent': 'orange',
    'assignat': 'success',
    'rebutjada': 'error',
    'finalitzat': 'grey'
  };
  return mapa[estado] || 'grey';
};

const getColorPrioridad = (p) => {
    if (p === 'Alta') return 'red-lighten-1';
    if (p === 'Baixa') return 'grey-lighten-2';
    return 'blue-lighten-4 text-blue-darken-3'; // Normal
};

const getIconPrioridad = (p) => {
    if (p === 'Alta') return 'mdi-fire';
    if (p === 'Baixa') return 'mdi-chevron-down';
    return 'mdi-minus';
};

const mostrarNotificacion = (text, color, icon) => {
  snackbar.value = { show: true, text, color, icon };
};

onMounted(() => {
  cargarSolicitudes();
});
</script>

<style scoped>
.text-primary-dark { color: #004B87; }
.gap-2 { gap: 8px; }
.gap-4 { gap: 16px; }
.border-bottom { border-bottom: 1px solid #e0e0e0; }
.border-orange { border: 1px solid #ffe0b2; }
/* HE ELIMINADO LA CLASE .info-visible PARA QUITAR EL FONDO */
</style>