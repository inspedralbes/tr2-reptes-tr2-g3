<template>
  <NavBarProfessor />

  <v-main class="bg-grey-lighten-5" style="min-height: 100vh; padding-top: 100px;">
    <v-container style="max-width: 1200px;">
      
      <div class="mb-8">
        <h1 class="text-h3 font-weight-bold text-grey-darken-4 mb-2">
          Les meves Assignacions
        </h1>
        <p class="text-subtitle-1 text-grey-darken-1">
          Consulta els tallers on has estat assignat i els grups d'alumnes inscrits.
        </p>
      </div>

      <!-- Loading State -->
      <v-row v-if="loading">
        <v-col cols="12" v-for="n in 2" :key="n">
          <v-skeleton-loader type="article, actions" class="rounded-lg border"></v-skeleton-loader>
        </v-col>
      </v-row>

      <!-- Empty State -->
      <div v-else-if="tallersAssignats.length === 0" class="text-center py-10">
        <v-icon size="64" color="grey-lighten-1">mdi-calendar-blank</v-icon>
        <h3 class="text-h6 text-grey mt-4">No tens assignacions actualment.</h3>
      </div>

      <!-- Content -->
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
                  <th class="text-left font-weight-bold">Data Sol·licitada</th>
                  <th class="text-center font-weight-bold">Alumnes</th>
                  <th class="text-center font-weight-bold">Accions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="sol in taller.solicituds" :key="sol._id">
                  <td class="py-3">
                    <div class="font-weight-medium">{{ sol.centre_info?.nom_oficial || sol.nomCentre || 'Centre Desconegut' }}</div>
                    <div class="text-caption text-grey">Codi: {{ sol.centre_info?.codi || sol.codi_centre || '---' }}</div>
                  </td>
                  <td>
                    <v-chip size="small" color="blue-grey" variant="outlined">
                      {{ formatDate(sol.preferencies?.dia_preferit || sol.dia_preferit) }}
                    </v-chip>
                  </td>
                  <td class="text-center">
                    <v-badge color="blue" :content="sol.alumnes_previstos" inline></v-badge>
                  </td>
                  <td class="text-center">
                    <v-btn 
                      size="small" 
                      variant="tonal" 
                      color="primary" 
                      prepend-icon="mdi-account-group"
                      @click="veureLlistaAlumnes(sol)"
                    >
                      Veure Llista
                    </v-btn>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </div>

    </v-container>

    <!-- Dialog Llista Alumnes -->
    <v-dialog v-model="dialogAlumnes" max-width="500">
      <v-card class="rounded-lg">
        <v-card-title class="d-flex justify-space-between align-center pa-4 border-bottom">
          <span class="text-h6">Llista d'Alumnes</span>
          <v-btn icon="mdi-close" variant="text" @click="dialogAlumnes = false"></v-btn>
        </v-card-title>
        
        <v-card-text class="pa-0" style="max-height: 400px; overflow-y: auto;">
          <v-list lines="one">
            <v-list-item 
              v-for="alumne in alumnesSimulats" 
              :key="alumne.id"
              :title="alumne.nom"
              prepend-icon="mdi-account-circle-outline"
            >
              <template v-slot:append>
                <v-icon color="success" size="small">mdi-check-circle</v-icon>
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>

        <v-divider></v-divider>
        
        <div class="pa-4 bg-grey-lighten-5 text-caption text-center text-grey">
          Total: {{ alumnesSimulats.length }} alumnes assignats a aquest grup.
        </div>
      </v-card>
    </v-dialog>

  </v-main>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import NavBarProfessor from '../../components/NavBarProfessor.vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const tallers = ref([]);
const solicituds = ref([]);
const loading = ref(true);
const dialogAlumnes = ref(false);
const alumnesSimulats = ref([]);

onMounted(async () => {
  try {
    // 1. Cargar Talleres y Solicitudes
    const [resTallers, resSolicituds] = await Promise.all([
      fetch('http://localhost:3000/api/tallers'),
      fetch('http://localhost:3000/api/solicituds')
    ]);

    const tallersData = await resTallers.json();
    // Mapegem el lloc (institut) que ve del backend per mostrar-lo a la targeta
    tallers.value = tallersData.map(t => ({
      ...t,
      lloc: t.nom_institut || 'Institut Públic'
    }));

    solicituds.value = await resSolicituds.json();

    // --- DADES D'EXEMPLE (Si no hi ha dades a la BDD) ---
    if (tallers.value.length === 0) {
      tallers.value = [
        { _id: 'demo1', nom: 'Introducció a la Robòtica', lloc: 'Laboratori 3' },
        { _id: 'demo2', nom: 'Disseny i Impressió 3D', lloc: 'Aula Tècnica B' }
      ];
      solicituds.value = [
        { _id: 's1', taller_id: 'demo1', nomCentre: 'Institut Joan Brossa', codi_centre: '08013275', dia_preferit: '2024-03-15', alumnes_previstos: 24 },
        { _id: 's2', taller_id: 'demo1', nomCentre: 'Institut Verdaguer', codi_centre: '08004778', dia_preferit: '2024-03-22', alumnes_previstos: 18 },
        { _id: 's3', taller_id: 'demo2', nomCentre: 'Institut Salvador Espriu', codi_centre: '08034567', dia_preferit: '2024-04-10', alumnes_previstos: 30 }
      ];
    }

  } catch (error) {
    console.error("Error carregant dades:", error);
  } finally {
    loading.value = false;
  }
});

// Agrupa las solicitudes dentro de sus talleres correspondientes
const tallersAssignats = computed(() => {
  const userId = authStore.user?._id;

  return tallers.value.map(taller => {
    // Filtramos las solicitudes que pertenecen a este taller
    const solsDelTaller = solicituds.value.filter(s => {
      // El backend retorna l'objecte sencer a s.taller_id, però les dades demo usen string
      const idSol = s.taller_id && s.taller_id._id ? s.taller_id._id : s.taller_id;
      const esDelTaller = idSol === taller._id;
      
      // Filtrem per assignació al professor actual
      const esAssignat = s.professors_assignats_ids && s.professors_assignats_ids.includes(userId);
      
      return esDelTaller && esAssignat;
    });
    return { ...taller, solicituds: solsDelTaller };
  }).filter(t => t.solicituds.length > 0); // Solo mostramos talleres con actividad
});

const formatDate = (dateStr) => {
  if (!dateStr) return 'Data pendent';
  return new Date(dateStr).toLocaleDateString('ca-ES');
};

const veureLlistaAlumnes = (solicitud) => {
  // Simulamos la lista de nombres basada en el número 'alumnes_previstos'
  const count = parseInt(solicitud.alumnes_previstos) || 0;
  alumnesSimulats.value = Array.from({ length: count }, (_, i) => ({
    id: i,
    nom: `Alumne ${i + 1} - ${solicitud.nomCentre || 'Centre'}`
  }));
  dialogAlumnes.value = true;
};
</script>