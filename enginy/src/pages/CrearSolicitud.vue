<template>
  <v-main class="bg-grey-lighten-5">
    
    <div v-if="loading" class="d-flex justify-center align-center" style="height: 100vh;">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </div>

    <div v-else>
      <div class="hero-container">
        <v-img
          :src="generarImagen(taller.nom)"
          height="400"
          cover
          class="align-end"
          gradient="to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.8) 100%"
        >
          <v-container style="max-width: 1100px;" class="pb-10">
            <v-chip :color="getColor(taller.modalitat)" class="mb-4 font-weight-bold text-white shadow-chip" size="large">
              Modalitat {{ taller.modalitat }}
            </v-chip>
            <h1 class="text-h3 font-weight-black text-white mb-2 shadow-text">{{ taller.nom }}</h1>
            <div class="d-flex align-center text-white text-h6 shadow-text">
               <v-icon class="mr-2" color="white">mdi-map-marker</v-icon> 
               {{ taller.lloc || 'Lloc per confirmar' }}
            </div>
          </v-container>
        </v-img>
      </div>

      <v-container class="mt-n10 position-relative" style="max-width: 1100px; z-index: 2;">
        <v-row>
          
          <v-col cols="12" md="8">
            <v-card class="rounded-xl pa-8 mb-6" elevation="3">
              <div class="mb-6">
                <h2 class="text-h5 font-weight-bold mb-4 text-primary-dark">Descripció de l'activitat</h2>
                <p class="text-body-1 text-grey-darken-3" style="line-height: 1.8;">
                  {{ taller.descripcio }}
                </p>
              </div>

              <v-divider class="mb-6"></v-divider>

              <div>
                <h3 class="text-h6 font-weight-bold mb-4">Requisits Tècnics</h3>
                <div class="d-flex flex-wrap gap-3">
                  <v-chip v-if="taller.detalls_tecnics?.transport" variant="outlined" color="indigo" prepend-icon="mdi-bus">
                    Transport Requerit
                  </v-chip>
                  <v-chip v-if="taller.detalls_tecnics?.material" variant="outlined" color="teal" prepend-icon="mdi-bag-personal">
                    Material Específic
                  </v-chip>
                  <v-chip variant="outlined" color="grey-darken-2" prepend-icon="mdi-clock-outline">
                    Durada: 3h
                  </v-chip>
                </div>
              </div>
            </v-card>
          </v-col>

          <v-col cols="12" md="4">
            <div class="sticky-sidebar">
              <v-card elevation="6" class="rounded-xl overflow-hidden">
                <v-card-title class="bg-grey-lighten-4 py-5 px-6">
                  <div class="text-overline text-grey-darken-1 mb-1">DISPONIBILITAT</div>
                  <div class="d-flex align-center justify-space-between">
                    <span class="text-h4 font-weight-bold" :class="getColorText(taller.places_disponibles)">
                      {{ taller.places_disponibles }}
                    </span>
                    <span class="text-body-1 text-grey font-weight-medium">places lliures</span>
                  </div>
                </v-card-title>
                
                <v-progress-linear
                   :model-value="calcularPorcentaje(taller)"
                   :color="getColorBarra(taller.places_disponibles)"
                   height="8"
                ></v-progress-linear>

                <v-card-text class="pa-6">
                  <div class="d-flex align-center mb-4 text-body-1">
                     <v-icon color="primary" class="mr-3">mdi-calendar-check</v-icon> 
                     <span>Dies: Dimarts i Dijous</span>
                  </div>

                  <v-btn 
                    block 
                    size="x-large" 
                    color="primary" 
                    class="font-weight-bold rounded-lg mb-4 text-capitalize"
                    elevation="4"
                    @click="abrirModal"
                    :disabled="taller.places_disponibles === 0"
                  >
                    {{ taller.places_disponibles > 0 ? 'Sol·licitar Inscripció' : 'Taller Complet' }}
                  </v-btn>
                  
                  <div class="bg-blue-lighten-5 pa-3 rounded text-caption text-blue-darken-3 text-center">
                     <v-icon size="small" class="mr-1">mdi-information</v-icon>
                     La reserva quedarà pendent de validació pel centre.
                  </div>
                </v-card-text>
              </v-card>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </div>

    <v-dialog v-model="dialog" max-width="550" persistent transition="dialog-bottom-transition">
      <v-card class="rounded-xl">
        <v-card-item class="bg-primary text-white py-5 px-6">
          <v-card-title class="text-h6 font-weight-bold">
            <v-icon class="mr-2">mdi-file-document-edit</v-icon>
            Nova Sol·licitud
          </v-card-title>
          <template v-slot:append>
             <v-btn icon="mdi-close" variant="text" color="white" @click="dialog = false"></v-btn>
          </template>
        </v-card-item>
        
        <v-card-text class="pt-6 px-6">
          <v-form ref="formRef" @submit.prevent="enviarSolicitud">
             
             <label class="text-subtitle-2 font-weight-bold text-grey-darken-1">NOMBRE D'ALUMNES</label>
             <v-text-field 
                v-model.number="form.alumnes_previstos"
                type="number" 
                variant="outlined" 
                density="comfortable"
                class="mt-1 mb-2"
                prepend-inner-icon="mdi-account-group"
                :rules="reglasAlumnos"
                placeholder="Ex: 15"
             >
               <template v-slot:append-inner>
                 <span class="text-caption text-grey">màx {{ taller.places_disponibles }}</span>
               </template>
             </v-text-field>
             
             <label class="text-subtitle-2 font-weight-bold text-grey-darken-1 mt-2">DIA PREFERIT</label>
             <v-chip-group v-model="form.dia_preferit" selected-class="text-primary" mandatory class="mb-4">
               <v-chip value="Dimarts" filter variant="outlined">Dimarts</v-chip>
               <v-chip value="Dimecres" filter variant="outlined">Dimecres</v-chip>
               <v-chip value="Dijous" filter variant="outlined">Dijous</v-chip>
             </v-chip-group>

             <label class="text-subtitle-2 font-weight-bold text-grey-darken-1">OBSERVACIONS</label>
             <v-textarea 
                v-model="form.observacions"
                variant="outlined" 
                rows="3"
                class="mt-1"
                placeholder="Necessitats especials, grup bombolla, etc."
                counter="200"
             ></v-textarea>

             <v-alert type="info" variant="tonal" density="compact" class="mb-4 text-caption">
               En confirmar, es reservaran <strong>{{ form.alumnes_previstos || 0 }} places</strong> provisionalment.
             </v-alert>

             <div class="d-flex gap-3">
               <v-btn variant="text" size="large" @click="dialog = false" class="flex-grow-1">Cancel·lar</v-btn>
               <v-btn 
                 color="primary" 
                 size="large" 
                 type="submit" 
                 class="flex-grow-1 font-weight-bold"
                 :loading="enviando"
                 elevation="2"
               >
                 Confirmar Sol·licitud
               </v-btn>
             </div>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" color="success" timeout="4000" location="top">
      <div class="d-flex align-center">
        <v-icon class="mr-2">mdi-check-circle</v-icon>
        <span>Sol·licitud creada correctament!</span>
      </div>
    </v-snackbar>

  </v-main>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router'; 

const route = useRoute();
const loading = ref(true);
const enviando = ref(false);
const dialog = ref(false);
const snackbar = ref(false);
const formRef = ref(null);

// ESTADO: Datos del Taller
const taller = ref({});

// ESTADO: Formulario (Coincide con createSollicitud backend logic)
const form = reactive({
  alumnes_previstos: null,
  dia_preferit: 'Dimarts',
  observacions: ''
});

// --- 1. CARGAR DATOS ---
const cargarTaller = async () => {
  try {
    const id = route.params.id;
    // Petición real a tu API
    const response = await fetch(`http://localhost:3000/api/tallers/${id}`);
    if (!response.ok) throw new Error('Taller no trobat');
    taller.value = await response.json();
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  cargarTaller();
});

// --- 2. VALIDACIÓN ---
const reglasAlumnos = [
  v => !!v || "Has d'indicar quants alumnes vindran.",
  v => v > 0 || "Mínim 1 alumne.",
  v => v <= taller.value.places_disponibles || `Només queden ${taller.value.places_disponibles} places!`
];

const abrirModal = () => {
  // Reseteamos el formulario al abrir
  form.alumnes_previstos = null;
  form.observacions = '';
  dialog.value = true;
};

// --- 3. ENVIAR SOLICITUD (Conexión Backend) ---
const enviarSolicitud = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  enviando.value = true;

  try {
    // Construimos el body tal cual lo pide tu función createSollicitud(..., ..., data)
    // Tu backend espera: data.alumnes_previstos, data.dia_preferit, data.observacions
    const payload = {
      taller_id: taller.value._id,
      alumnes_previstos: parseInt(form.alumnes_previstos),
      dia_preferit: form.dia_preferit,
      observacions: form.observacions
    };

    const response = await fetch('http://localhost:3000/api/sollicituds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error('Error al servidor');

    // Éxito
    dialog.value = false;
    snackbar.value = true;
    
    // Recargamos el taller para actualizar la barra de disponibilidad visualmente
    await cargarTaller();

  } catch (error) {
    alert("Error creant la sol·licitud. Revisa la consola.");
    console.error(error);
  } finally {
    enviando.value = false;
  }
};

// --- HELPERS VISUALES ---
const generarImagen = (nom) => {
  if(!nom) return '';
  const keywords = {'Robòtica': 'robot', 'Cuina': 'chef', 'Vela': 'sea', 'Mecànica': 'bike'};
  const key = Object.keys(keywords).find(k => nom.includes(k)) || 'school';
  return `https://source.unsplash.com/1600x900/?${keywords[key]}`;
};

const getColor = (m) => ({ A: 'indigo', B: 'teal', C: 'orange-darken-1' }[m] || 'grey');
const getColorBarra = (n) => n <= 3 ? 'deep-orange' : 'success';
const getColorText = (n) => n <= 3 ? 'text-deep-orange' : 'text-success';
const calcularPorcentaje = (t) => {
  if(!t.places_totals) return 0;
  return ((t.places_totals - t.places_disponibles) / t.places_totals) * 100;
};
</script>

<style scoped>
.text-primary-dark { color: #004B87; }
.shadow-text { text-shadow: 0 2px 4px rgba(0,0,0,0.6); }
.shadow-chip { box-shadow: 0 4px 6px rgba(0,0,0,0.2); }
.gap-3 { gap: 12px; }

.sticky-sidebar {
  position: sticky;
  top: 100px;
  z-index: 10;
}
</style>