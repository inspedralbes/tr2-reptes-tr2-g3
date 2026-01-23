<template>
  <v-main class="bg-grey-lighten-5">
    
    <div v-if="loading" class="d-flex justify-center align-center" style="height: 100vh;">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </div>

    <div v-else>
      <div class="hero-container">
        <v-img
          :src="generarImagen(taller)"
          height="350"
          cover
          class="align-end"
          gradient="to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.8) 100%"
        >
          <v-container style="max-width: 1100px;" class="pb-8">
            <v-row align="end">
              <v-col>
                <v-chip :color="getColor(taller.modalitat)" class="mb-3 font-weight-bold text-white shadow-chip">
                  Modalitat {{ taller.modalitat }}
                </v-chip>
                <h1 class="text-h3 font-weight-black text-white mb-1 shadow-text">{{ taller.nom }}</h1>
                
                <div v-if="taller.info_centre" class="text-white mt-2 shadow-text">
                   <div class="d-flex align-center text-h6 font-weight-bold">
                       <v-icon class="mr-2">mdi-domain</v-icon> {{ taller.info_centre.nom }}
                   </div>
                   <div class="d-flex align-center text-subtitle-2 ml-1 opacity-90 mt-1">
                       <v-icon size="small" class="mr-2">mdi-map-marker</v-icon> 
                       {{ taller.info_centre.adreca }}, {{ taller.info_centre.municipi }}
                   </div>
                </div>
                <div v-else class="text-white mt-2 shadow-text">
                   <div class="d-flex align-center text-h6 font-weight-bold text-orange-lighten-2">
                       <v-icon class="mr-2">mdi-archive-outline</v-icon> Catàleg de Tallers
                   </div>
                   <div class="text-subtitle-2 ml-8 opacity-90">
                       Aquest taller encara no té ubicació. Demana'l pel teu centre!
                   </div>
                </div>
              </v-col>
              <v-col cols="auto">
                <v-btn variant="tonal" color="white" prepend-icon="mdi-arrow-left" @click="$router.back()">Tornar</v-btn>
              </v-col>
            </v-row>
          </v-container>
        </v-img>
      </div>

      <v-container class="mt-n8 position-relative" style="max-width: 1100px; z-index: 2;">
        <v-row>
          <v-col cols="12" md="7">
            <v-card class="rounded-xl pa-8 mb-6" elevation="3">
              <h2 class="text-h5 font-weight-bold mb-4 text-primary-dark">Descripció</h2>
              <p class="text-body-1 text-grey-darken-3 mb-6">{{ taller.descripcio }}</p>
              <v-divider class="mb-6"></v-divider>
              <h3 class="text-h6 font-weight-bold mb-4">Requisits del Taller</h3>
              <div class="d-flex flex-wrap gap-3">
                 <v-chip v-if="taller.detalls_tecnics?.transport" variant="outlined" color="indigo" prepend-icon="mdi-bus">Transport</v-chip>
                 <v-chip v-if="taller.detalls_tecnics?.ordinador" variant="outlined" color="teal" prepend-icon="mdi-laptop">Ordinador</v-chip>
                 <v-chip variant="outlined" color="grey-darken-2" prepend-icon="mdi-clock-outline">3 hores</v-chip>
              </div>
            </v-card>
          </v-col>

          <v-col cols="12" md="5">
            <div class="sticky-sidebar">
              <v-card elevation="6" class="rounded-xl overflow-hidden">
                <v-tabs v-model="tabActiva" bg-color="grey-lighten-4" color="primary" grow>
                  <v-tab value="assistencia" :disabled="!taller.info_centre">
                    <v-icon start>mdi-account-group</v-icon> Inscripció
                  </v-tab>
                  <v-tab value="acollida">
                    <v-icon start>mdi-home-plus</v-icon> Ser Sede
                  </v-tab>
                </v-tabs>

                <v-window v-model="tabActiva">
                  <v-window-item value="assistencia">
                    <div class="bg-white pa-6">
                      <div v-if="taller.info_centre">
                        <div class="d-flex align-center justify-space-between mb-4">
                            <span class="text-h4 font-weight-bold" :class="getColorText(taller.places_disponibles)">
                              {{ taller.places_disponibles }}
                            </span>
                            <span class="text-body-2 text-grey">places disponibles a <br><strong>{{ taller.info_centre.nom }}</strong></span>
                        </div>
                        <v-progress-linear :model-value="calcularPorcentaje(taller)" :color="getColorBarra(taller.places_disponibles)" height="8" rounded></v-progress-linear>
                        
                        <v-alert v-if="faseTaller !== 1" type="warning" variant="tonal" class="mt-6 text-caption" density="compact">
                          El període d'inscripció està tancat. El sistema es troba en la <strong>fase {{ nomFaseTaller }}</strong>.
                        </v-alert>

                        <v-btn block size="x-large" color="primary" :class="faseTaller !== 1 ? 'mt-4' : 'mt-6'" class="font-weight-bold" @click="abrirModal('assistencia')" :disabled="taller.places_disponibles === 0 || faseTaller !== 1">
                           {{ faseTaller !== 1 ? 'Inscripció Tancada' : (taller.places_disponibles > 0 ? 'Reservar Places' : 'Complet') }}
                        </v-btn>
                      </div>
                      <div v-else>
                        <v-alert v-if="faseTaller !== 1" type="warning" variant="tonal" class="mt-6 text-caption" density="compact">
                          El període d'inscripció està tancat. El sistema es troba en la <strong>fase {{ nomFaseTaller }}</strong>.
                        </v-alert>
                        <div v-else class="text-center py-8 text-grey">
                          <v-icon size="40" class="mb-2">mdi-map-marker-off</v-icon>
                          <p>Aquest taller no té ubicació. Pots sol·licitar acollir-lo a la pestanya 'Ser Sede'.</p>
                        </div>
                      </div>
                    </div>
                  </v-window-item>

                  <v-window-item value="acollida">
                    <div class="bg-blue-grey-lighten-5 pa-6">
                      <v-alert v-if="faseTaller !== 1" type="warning" variant="tonal" class="mb-4 text-caption" density="compact">
                          El període de sol·licituds està tancat. El sistema es troba en la <strong>fase {{ nomFaseTaller }}</strong>.
                       </v-alert>

                      <div class="text-subtitle-1 font-weight-bold mb-2 text-blue-grey-darken-3">
                        Vols fer aquest taller al teu centre?
                      </div>
                      <p class="text-body-2 text-blue-grey-darken-1 mb-4">
                        Sol·licita que els formadors vinguin a les teves instal·lacions.
                      </p>
                      <v-btn block size="x-large" color="blue-grey-darken-3" class="text-white font-weight-bold" @click="abrirModal('acollida')" :disabled="faseTaller !== 1">
                        <v-icon start>mdi-hand-wave</v-icon> {{ faseTaller !== 1 ? 'Sol·licitud Tancada' : 'Sol·licitar Ser Sede' }}
                      </v-btn>
                    </div>
                  </v-window-item>
                </v-window>
              </v-card>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </div>

    <v-dialog v-model="dialog" max-width="600" persistent>
      <v-card class="rounded-xl">
        <v-card-item :class="modoFormulario === 'assistencia' ? 'bg-primary' : 'bg-blue-grey-darken-3'" class="text-white py-4 px-6">
          <v-card-title class="text-h6 font-weight-bold">
            <v-icon class="mr-2">{{ modoFormulario === 'assistencia' ? 'mdi-ticket-account' : 'mdi-domain-plus' }}</v-icon>
            {{ modoFormulario === 'assistencia' ? 'Inscripció d\'Alumnes' : 'Sol·licitud per Acollir Taller' }}
          </v-card-title>
          <template v-slot:append>
             <v-btn icon="mdi-close" variant="text" color="white" @click="dialog = false"></v-btn>
          </template>
        </v-card-item>
        
        <v-card-text class="pt-6 px-6">
          <v-form ref="formRef" @submit.prevent="enviarSolicitud">
             
             <label class="text-subtitle-2 font-weight-bold text-grey-darken-1">EL TEU CENTRE (CODI)</label>
             <v-row dense class="mt-1 mb-4">
               <v-col cols="4">
                 <v-text-field 
                    v-model="form.codi_centre"
                    :readonly="isCampBloquejat"
                    :bg-color="isCampBloquejat ? 'grey-lighten-3' : 'white'"
                    density="comfortable"
                    variant="outlined"
                    placeholder="Ex: 080..."
                    maxlength="10"
                    hide-details="auto"
                    :rules="[v => !!v || 'Codi obligatori']"
                    @update:model-value="buscarNomCentre" 
                 ></v-text-field>
               </v-col>
               <v-col cols="8">
                 <v-text-field 
                    :model-value="nomCentreDetectat"
                    readonly
                    variant="filled"
                    bg-color="grey-lighten-4"
                    density="comfortable"
                    hide-details
                    placeholder="El nom apareixerà automàticament..."
                    prepend-inner-icon="mdi-school"
                 ></v-text-field>
               </v-col>
             </v-row>

             <div v-if="modoFormulario === 'assistencia'">
                 <label class="text-subtitle-2 font-weight-bold text-grey-darken-1">ALUMNES A INSCRIURE</label>
                 <v-text-field 
                    v-model.number="form.alumnes_previstos"
                    type="number" 
                    variant="outlined" 
                    density="comfortable"
                    class="mt-1 mb-4"
                    :rules="reglasAlumnos"
                    suffix="alumnes"
                    prepend-inner-icon="mdi-account-group"
                 >
                    <template v-slot:append-inner>
                       <span class="text-caption text-grey">màx {{ taller.places_disponibles }}</span>
                    </template>
                 </v-text-field>
             </div>

             <div v-else class="mb-4 pa-4 bg-grey-lighten-4 rounded border">
                 <div class="d-flex align-center mb-2">
                    <v-icon color="orange-darken-2" class="mr-2">mdi-alert-circle-outline</v-icon>
                    <span class="text-caption font-weight-bold text-grey-darken-3">REQUISITS D'AULA</span>
                 </div>
                 <p class="text-caption mb-3">
                   Per acollir el taller "<strong>{{ taller.nom }}</strong>", has de garantir espai suficient.
                 </p>
                 <label class="text-subtitle-2 font-weight-bold text-grey-darken-1">CAPACITAT MÀXIMA DE LA TEVA AULA</label>
                 <v-text-field 
                    v-model.number="form.capacitat_proposada"
                    type="number" 
                    variant="outlined" 
                    bg-color="white"
                    density="comfortable"
                    class="mt-1"
                    placeholder="Ex: 25 places"
                    prepend-inner-icon="mdi-chair-school"
                    :rules="[v => v > 5 || 'Mínim 5 places per fer viable el taller']"
                 ></v-text-field>
             </div>

             <label class="text-subtitle-2 font-weight-bold text-grey-darken-1">DIA PREFERIT</label>
             <v-chip-group v-model="form.dia_preferit" mandatory class="mb-4">
               <v-chip value="Dimarts" filter variant="outlined">Dimarts</v-chip>
               <v-chip value="Dimecres" filter variant="outlined">Dimecres</v-chip>
               <v-chip value="Dijous" filter variant="outlined">Dijous</v-chip>
             </v-chip-group>

             <label class="text-subtitle-2 font-weight-bold text-grey-darken-1">OBSERVACIONS</label>
             <v-textarea 
                v-model="form.observacions" 
                variant="outlined" 
                rows="3"
                placeholder="Necessitats especials, horaris específics..."
             ></v-textarea>

             <div class="d-flex gap-2 mt-2">
                <v-btn variant="text" @click="dialog = false" class="flex-grow-1">Cancel·lar</v-btn>
                <v-btn 
                    size="large" 
                    :color="modoFormulario === 'assistencia' ? 'primary' : 'blue-grey-darken-3'" 
                    type="submit" 
                    :loading="enviando" 
                    class="flex-grow-1 font-weight-bold"
                >
                Confirmar
                </v-btn>
             </div>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" color="success">Sol·licitud enviada correctament!</v-snackbar>
  </v-main>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router'; 
import { useAuthStore } from '@/stores/auth'; // Asegúrate de tener Pinia configurado

const route = useRoute();
const authStore = useAuthStore();

// Estados de carga y UI
const loading = ref(true);
const enviando = ref(false);
const dialog = ref(false);
const snackbar = ref(false);
const formRef = ref(null);

// Lógica de Tabs
const tabActiva = ref('assistencia');
const modoFormulario = ref('assistencia');

// Datos del taller y del centro
const taller = ref({});
const nomCentreDetectat = ref(''); 

// Formulario reactivo
const form = reactive({
  codi_centre: '', 
  alumnes_previstos: null,
  capacitat_proposada: null,
  dia_preferit: 'Dimarts',
  relevancia: 'Normal',
  observacions: ''
});

const faseTaller = computed(() => taller.value?.fase || 1);

const nomFaseTaller = computed(() => {
  const mapaFases = {
    2: "de Validació",
    3: "d'Assignació"
  };
  return mapaFases[faseTaller.value] || 'desconeguda';
});

// --- 1. CARGAR DATOS INICIALES (TALLER Y CONFIG) ---
const cargarDatos = async () => {
  loading.value = true;
  try {
    const id = route.params.id;
    const tallerRes = await fetch(`http://localhost:3000/api/tallers/${id}`);

    const data = await tallerRes.json();
    
    // Si no tiene 'info_centre' y la inscripción está abierta, forzamos la pestaña "Acollida"
    const faseDelTaller = data.fase || 1;
    if (!data.info_centre && faseDelTaller === 1) {
        tabActiva.value = 'acollida';
    }
    taller.value = data;
  } catch (error) { 
    console.error(error); 
  } finally { 
    loading.value = false;
  }
};

onMounted(cargarDatos);

// --- 2. LÓGICA DE ABRIR EL MODAL ---
const abrirModal = (modo) => {
  modoFormulario.value = modo;
  
  // Reseteamos campos
  form.observacions = '';
  if (modo === 'assistencia') {
      form.alumnes_previstos = null;
  } else {
      form.capacitat_proposada = 20; 
  }

  // >>> AQUÍ ESTÁ LA MAGIA DEL USUARIO <<<
  // Si el usuario está logueado en Pinia y tiene un código de centro:
  const usuario = authStore.user;
  
  if (usuario && usuario.perfil && usuario.perfil.codi_centre) {
      // 1. Asignamos el código
      form.codi_centre = usuario.perfil.codi_centre;
      // 2. Ejecutamos la búsqueda para que se rellene el nombre visualmente
      buscarNomCentre(form.codi_centre);
  } else {
      // Si es admin o usuario sin centro, lo dejamos vacío
      form.codi_centre = '';
      nomCentreDetectat.value = '';
  }

  dialog.value = true;
};

// --- 3. FUNCIÓN COMPLETA DE BUSCAR CENTRO ---
const buscarNomCentre = async (codi) => {
    // Si borran el código, borramos el nombre
    if (!codi || codi.length < 4) {
        nomCentreDetectat.value = '';
        return;
    }

    // Optimización: Si coincide con el usuario logueado, usamos datos locales (evita fetch)
    if (authStore.user?.perfil?.codi_centre === codi) {
        nomCentreDetectat.value = authStore.user.perfil.nom || authStore.user.perfil.nom_oficial;
        return;
    }

    // Si no, preguntamos al backend
    try {
        const res = await fetch(`http://localhost:3000/api/centres/${codi}`);
        if(res.ok) {
            const data = await res.json();
            // El backend puede devolver 'nom' o 'denominacio_completa'
            nomCentreDetectat.value = data.nom || data.denominacio_completa;
        } else {
            nomCentreDetectat.value = ''; // No encontrado
        }
    } catch(error) {
        console.error("Error fetching centre:", error);
        nomCentreDetectat.value = '';
    }
};

// Computed para bloquear el input si el usuario es un centro
const isCampBloquejat = computed(() => {
    return !!(authStore.user?.perfil?.codi_centre);
});

// Validaciones
const reglasAlumnos = [
  v => !!v || "Obligatori",
  v => v > 0 || "Mínim 1 alumne",
  // Solo validamos maximo si estamos en modo asistencia
  v => !taller.value.places_disponibles || v <= taller.value.places_disponibles || "No queden tantes places"
];

// --- 4. ENVIAR SOLICITUD ---
const enviarSolicitud = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid) return;
  
  if (!nomCentreDetectat.value) {
      alert("Codi de centre invàlid. Revisa'l.");
      return;
  }

  enviando.value = true;
  try {
    const payload = {
        taller_id: taller.value._id,
        codi_centre: form.codi_centre,
        tipus: modoFormulario.value, // 'assistencia' o 'acollida'
        dia_preferit: form.dia_preferit,
        observacions: form.observacions,
        userId: authStore.user?._id
    };

    if (modoFormulario.value === 'assistencia') {
        payload.alumnes_previstos = parseInt(form.alumnes_previstos);
    } else {
        payload.capacitat_proposada = parseInt(form.capacitat_proposada);
    }

    const response = await fetch('http://localhost:3000/api/solicituds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Error en la solicitud');
    }

    dialog.value = false;
    snackbar.value = true;
    await cargarDatos(); // Recargar datos para actualizar barras de progreso

  } catch (error) {
    alert(error.message);
  } finally {
    enviando.value = false;
  }
};

// --- Helpers visuales ---
const generarImagen = (t) => t.imatge || `https://source.unsplash.com/1600x900/?education,technology`;
const getColor = (m) => ({ A: 'indigo', B: 'teal', C: 'orange' }[m] || 'grey');
const getColorBarra = (n) => n <= 5 ? 'red' : 'success';
const getColorText = (n) => n <= 5 ? 'text-red' : 'text-success';
const calcularPorcentaje = (t) => t.places_totals ? ((t.places_totals - t.places_disponibles)/t.places_totals)*100 : 0;
</script>

<style scoped>
.shadow-text { text-shadow: 0 2px 10px rgba(0,0,0,0.8); }
.shadow-chip { box-shadow: 0 4px 6px rgba(0,0,0,0.2); }
.text-primary-dark { color: #004B87; }
.sticky-sidebar { position: sticky; top: 120px; z-index: 10; }
</style>