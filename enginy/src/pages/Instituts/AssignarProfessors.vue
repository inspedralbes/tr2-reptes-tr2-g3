<template>
  <NavBarCentre />

  <v-main class="bg-grey-lighten-5" style="min-height: 100vh; padding-top: 100px;">
    <v-container style="max-width: 1200px;">
      
      <div class="mb-8 d-flex justify-space-between align-end">
        <div class="mt-4">
          <h1 class="text-h3 font-weight-bold text-grey-darken-4 mb-2">
            Gestió de Professors
          </h1>
          <p class="text-subtitle-1 text-grey-darken-1">
            Assigna els docents y especifica els dies/hores exactes.
          </p>
        </div>
      </div>

      <v-row v-if="loading">
        <v-col cols="12" v-for="n in 3" :key="n">
          <v-skeleton-loader type="article" class="rounded-lg border"></v-skeleton-loader>
        </v-col>
      </v-row>

      <div v-else-if="solicitudsFiltrades.length === 0" class="text-center py-10">
        <v-icon size="64" color="grey-lighten-1">mdi-clipboard-text-off-outline</v-icon>
        <h3 class="text-h6 text-grey mt-4">No tens sol·licituds aprovades pendents.</h3>
      </div>

      <div v-else>
        <v-card 
          v-for="sol in solicitudsFiltrades" 
          :key="sol._id" 
          class="mb-4 rounded-lg border"
          elevation="0"
        >
          <v-card-text>
            <v-row align="start">
              
              <v-col cols="12" md="4">
                <div class="text-h6 font-weight-bold text-grey-darken-3 mb-1">{{ sol.taller_id.nom }}</div>
                
                <v-chip 
                    color="blue-darken-1" 
                    variant="flat" 
                    size="small" 
                    class="font-weight-bold mb-2"
                >
                    <v-icon start icon="mdi-calendar"></v-icon>
                    {{ formatearFecha(sol.preferencies?.dia_preferit) }}
                </v-chip>

                <div class="text-caption text-grey-darken-1">
                   <v-icon size="small" icon="mdi-school" class="mr-1"></v-icon>
                   {{ sol.centre_info?.nom_oficial || 'Centre desconegut' }}
                </div>
              </v-col>

              <v-col cols="12" md="4">
                <v-select
                  v-model="sol.professors_assignats_ids"
                  :items="professorsList"
                  item-title="nom"
                  item-value="_id"
                  label="Seleccionar Professors"
                  multiple
                  chips
                  closable-chips
                  variant="outlined"
                  density="compact"
                  hide-details
                  class="mt-1"
                ></v-select>
              </v-col>

              <v-col cols="12" md="4">
                  <v-textarea
                      v-model="sol.assignacio_info"
                      label="Dies Assignats / Detalls"
                      placeholder="Ex: Dilluns 15/05 -> Joan, Dimarts 16/05 -> Maria"
                      rows="2"
                      auto-grow
                      variant="outlined"
                      bg-color="white"
                      density="compact"
                      hide-details
                      class="mb-2"
                  ></v-textarea>

                  <div class="text-right">
                      <v-btn 
                        color="primary" 
                        variant="tonal" 
                        size="small"
                        prepend-icon="mdi-content-save"
                        :loading="saving === sol._id"
                        @click="guardarAssignacio(sol)"
                      >
                        Guardar Assignació
                      </v-btn>
                  </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </div>

      <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="3000">
        {{ snackbarText }}
      </v-snackbar>

    </v-container>
  </v-main>
</template>

<script setup>
// ... (El script que pusiste parece correcto, mantenlo igual)
import { ref, onMounted, computed } from 'vue';
import NavBarCentre from '@/components/NavBarCentre.vue'; // Asegúrate que la ruta sea correcta
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const solicituds = ref([]);
const professorsList = ref([]);
const loading = ref(true);
const saving = ref(null);
const snackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('success');

const formatearFecha = (fechaRaw) => {
    if (!fechaRaw) return 'Data per determinar';
    const fecha = new Date(fechaRaw);
    if (!isNaN(fecha.getTime()) && fechaRaw.includes('-')) {
        return fecha.toLocaleDateString('ca-ES', { 
            weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' 
        });
    }
    return fechaRaw;
};

onMounted(async () => {
  try {
    // Asegúrate de que estas URLs sean correctas para tu entorno
    const centreCodi = authStore.user?.perfil?.codi_centre;
    const professorsUrl = centreCodi ? `https://enginygrup3.dam.inspedralbes.cat/api/professors?codi=${encodeURIComponent(centreCodi)}` : 'https://enginygrup3.dam.inspedralbes.cat/api/professors';

    const [resSols, resProfs] = await Promise.all([
      fetch('https://enginygrup3.dam.inspedralbes.cat/api/solicituds'),
      fetch(professorsUrl)
    ]);

    let dataSols = await resSols.json();
    professorsList.value = await resProfs.json();

    solicituds.value = dataSols.map(s => ({
        ...s,
        assignacio_info: s.assignacio_info || ''
    }));

  } catch (error) {
    console.error("Error carregant dades:", error);
  } finally {
    loading.value = false;
  }
});

const solicitudsFiltrades = computed(() => {
  const userEmail = authStore.user?.email;
  if (!userEmail) return [];

  const centreCodi = authStore.user?.perfil?.codi_centre;

  return solicituds.value.filter(sol => {
    const esAprovada = sol.estat === 'assignat';
    if (!esAprovada) return false;

    // Preferimos cotejar por codi_centre si existe
    if (centreCodi && sol.codi_centre) {
      return String(sol.codi_centre) === String(centreCodi);
    }

    // Fallback: comparar por email del centre si está disponible
    if (sol.centre_info?.email) {
      return sol.centre_info.email === userEmail;
    }

    return false;
  });
});

const guardarAssignacio = async (sol) => {
  saving.value = sol._id;
  try {
    const response = await fetch(`https://enginygrup3.dam.inspedralbes.cat/api/solicituds/${sol._id}/professors`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
          professors: sol.professors_assignats_ids || [],
          info: sol.assignacio_info || "" 
      })
    });

    if (!response.ok) throw new Error('Error al guardar');

    snackbarText.value = 'Assignació guardada correctament';
    snackbarColor.value = 'success';
    snackbar.value = true;
  } catch (error) {
    console.error(error);
    snackbarText.value = 'Error al guardar els canvis';
    snackbarColor.value = 'error';
    snackbar.value = true;
  } finally {
    saving.value = null;
  }
};
</script>