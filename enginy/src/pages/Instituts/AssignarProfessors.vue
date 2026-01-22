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
            Assigna els docents responsables (màxim 2) per a les teves sol·licituds aprovades.
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
        <h3 class="text-h6 text-grey mt-4">No tens sol·licituds aprovades pendents d'assignació.</h3>
      </div>

      <div v-else>
        <v-card 
          v-for="sol in solicitudsFiltrades" 
          :key="sol._id" 
          class="mb-4 rounded-lg border"
          elevation="0"
        >
          <v-card-text>
            <v-row align="center">
              <v-col cols="12" md="5">
                <div class="text-h6 font-weight-bold text-grey-darken-3">{{ sol.taller_id.nom }}</div>
              </v-col>

              <v-col cols="12" md="5">
                <v-select
                  v-model="sol.professors_assignats_ids"
                  :items="professorsList"
                  item-title="nom"
                  item-value="_id"
                  label="Professors Assignats"
                  multiple
                  chips
                  closable-chips
                  variant="outlined"
                  density="compact"
                  hide-details
                  :rules="[v => v.length <= 2 || 'Màxim 2 professors']"
                  @update:modelValue="checkLimit(sol)"
                >
                  <template v-slot:selection="{ item, index }">
                    <v-chip v-if="index < 2" size="small">
                      {{ item.title }}
                    </v-chip>
                    <span v-if="index === 2" class="text-grey text-caption align-self-center ml-2">
                      (+{{ sol.professors_assignats_ids.length - 2 }} altres)
                    </span>
                  </template>
                </v-select>
              </v-col>

              <v-col cols="12" md="2" class="text-right">
                <v-btn 
                  color="primary" 
                  variant="tonal" 
                  :loading="saving === sol._id"
                  @click="guardarAssignacio(sol)"
                  :disabled="sol.professors_assignats_ids && sol.professors_assignats_ids.length > 2"
                >
                  Guardar
                </v-btn>
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
import { ref, onMounted, computed } from 'vue';
import NavBar from '@/components/NavBar.vue';
import NavBarCentre from '@/components/NavBarCentre.vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const solicituds = ref([]);
const professorsList = ref([]);
const loading = ref(true);
const saving = ref(null);
const snackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('success');

onMounted(async () => {
  try {
    const [resSols, resProfs] = await Promise.all([
      fetch('http://localhost:3000/api/solicituds'),
      fetch('http://localhost:3000/api/professors')
    ]);

    solicituds.value = await resSols.json();
    professorsList.value = await resProfs.json();
  } catch (error) {
    console.error("Error carregant dades:", error);
  } finally {
    loading.value = false;
  }
});

const solicitudsFiltrades = computed(() => {
  const userEmail = authStore.user?.email;
  if (!userEmail) return [];

  return solicituds.value.filter(sol => {
    // 1. Solo solicitudes APROBADAS ('assignat')
    const esAprovada = sol.estat === 'assignat';
    // 2. Solo solicitudes de ESTE CENTRO
    const esDelCentre = sol.centre_info?.email === userEmail;
    
    return esAprovada && esDelCentre;
  });
});

const checkLimit = (sol) => {
  if (sol.professors_assignats_ids && sol.professors_assignats_ids.length > 2) {
    // Opcional: UX estricta
  }
};

const guardarAssignacio = async (sol) => {
  saving.value = sol._id;
  try {
    const response = await fetch(`http://localhost:3000/api/solicituds/${sol._id}/professors`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ professors: sol.professors_assignats_ids || [] })
    });

    if (!response.ok) throw new Error('Error al guardar');

    snackbarText.value = 'Assignació actualitzada correctament';
    snackbarColor.value = 'success';
    snackbar.value = true;
  } catch (error) {
    snackbarText.value = 'Error al guardar els canvis';
    snackbarColor.value = 'error';
    snackbar.value = true;
  } finally {
    saving.value = null;
  }
};
</script>