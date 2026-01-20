<template>
  <v-main class="bg-grey-lighten-5">
    
    <div v-if="loading" class="d-flex justify-center align-center" style="height: 100vh;">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </div>

    <div v-else>
      <div class="hero-container">
        <v-img
          :src="generarImagen(taller)"
          height="400"
          cover
          class="align-end"
          gradient="to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.8) 100%"
        >
          <v-container style="max-width: 1100px;" class="pb-10">
            <v-row align="end">
              <v-col>
                <v-chip :color="getColor(taller.modalitat)" class="mb-4 font-weight-bold text-white shadow-chip" size="large">
                  Modalitat {{ taller.modalitat }}
                </v-chip>
                <h1 class="text-h3 font-weight-black text-white mb-2 shadow-text">{{ taller.nom }}</h1>
                <div class="d-flex align-center text-white text-h6 shadow-text">
                   <v-icon class="mr-2" color="white">mdi-map-marker</v-icon> 
                   {{ taller.lloc || 'Institut Milà i Fontanals' }}
                </div>
              </v-col>

              <v-col cols="auto">
                <v-btn 
                  variant="tonal" 
                  color="white" 
                  prepend-icon="mdi-arrow-left"
                  height="50"
                  class="bg-grey-darken-4"
                  @click="$router.back()"
                >
                  Tornar
                </v-btn>
              </v-col>
            </v-row>
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
                  <v-chip v-if="taller.detalls_tecnics?.ordinador" variant="outlined" color="teal" prepend-icon="mdi-laptop">
                    Ordinador Requerit
                  </v-chip>
                  <v-chip v-if="taller.detalls_tecnics?.bata" variant="outlined" color="deep-orange" prepend-icon="mdi-coat-rack">
                    Roba especial / Bata
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

    <v-dialog v-model="dialog" max-width="600" persistent transition="dialog-bottom-transition">
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
             
             <label class="text-subtitle-2 font-weight-bold text-grey-darken-1">CODI DEL CENTRE</label>
             <v-row dense class="mt-1 mb-4">
               <v-col cols="4">
                 <v-text-field 
                    v-model="form.codi_centre"
                    variant="outlined" 
                    density="comfortable"
                    placeholder="Ex: 08000013"
                    :rules="[v => !!v || 'Codi obligatori']"
                    @update:model-value="buscarNomCentre"
                    maxlength="10"
                    hide-details="auto"
                 ></v-text-field>
               </v-col>
               <v-col cols="8">
                 <v-text-field 
                    :model-value="nomCentreDetectat"
                    variant="outlined" 
                    density="comfortable"
                    readonly
                    bg-color="white"
                    placeholder="El nom apareixerà automàticament..."
                    prepend-inner-icon="mdi-school"
                    hide-details
                    class="font-weight-medium"
                    :color="nomCentreDetectat ? 'success' : 'grey'"
                 ></v-text-field>
               </v-col>
             </v-row>

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

             <label class="text-subtitle-2 font-weight-bold text-grey-darken-1">NIVELL D'INTERÈS / PRIORITAT</label>
             <div class="text-caption text-grey mb-2">Indica la importància d'aquest taller per al vostre centre.</div>
             
             <v-chip-group v-model="form.relevancia" mandatory class="mb-4">
               <v-chip 
                 value="Alta" 
                 filter 
                 variant="outlined" 
                 color="red-darken-1"
                 :class="{'bg-red-lighten-5': form.relevancia === 'Alta'}"
               >
                 <v-icon start icon="mdi-fire"></v-icon> Alta
               </v-chip>

               <v-chip 
                 value="Normal" 
                 filter 
                 variant="outlined" 
                 color="blue"
                 :class="{'bg-blue-lighten-5': form.relevancia === 'Normal'}"
               >
                 <v-icon start icon="mdi-check-circle-outline"></v-icon> Normal
               </v-chip>

               <v-chip 
                 value="Baixa" 
                 filter 
                 variant="outlined" 
                 color="grey-darken-1"
                 :class="{'bg-grey-lighten-4': form.relevancia === 'Baixa'}"
               >
                 <v-icon start icon="mdi-chevron-down"></v-icon> Baixa
               </v-chip>
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
import { ref, reactive, onMounted } from 'vue';
import { useRoute } from 'vue-router'; 

const route = useRoute();
const loading = ref(true);
const enviando = ref(false);
const dialog = ref(false);
const snackbar = ref(false);
const formRef = ref(null);

// ESTADO: Datos
const taller = ref({});
const nomCentreDetectat = ref(''); 

// ESTADO: Formulario (ACTUALIZADO CON RELEVANCIA)
const form = reactive({
  codi_centre: '', 
  alumnes_previstos: null,
  dia_preferit: 'Dimarts',
  relevancia: 'Normal', // <--- NUEVO CAMPO POR DEFECTO
  observacions: ''
});

// --- 1. CARGAR TALLER ---
const cargarTaller = async () => {
  try {
    const id = route.params.id;
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

// --- 2. BUSCADOR DE CENTRO ---
const buscarNomCentre = async (codi) => {
  if (!codi || codi.length < 5) {
    nomCentreDetectat.value = '';
    return;
  }
  try {
    const response = await fetch(`http://localhost:3000/api/centres/${codi}`);
    if (response.ok) {
      const data = await response.json();
      nomCentreDetectat.value = data.nom || data.denominacio_completa;
    } else {
      nomCentreDetectat.value = ''; 
    }
  } catch (error) {
    console.error("Error buscant centre", error);
  }
};

// --- 3. VALIDACIÓN ---
const reglasAlumnos = [
  v => !!v || "Has d'indicar quants alumnes vindran.",
  v => v > 0 || "Mínim 1 alumne.",
  v => v <= taller.value.places_disponibles || `Només queden ${taller.value.places_disponibles} places!`
];

const abrirModal = () => {
  form.alumnes_previstos = null;
  form.observacions = '';
  form.relevancia = 'Normal'; // <--- RESETEAR AL ABRIR
  // No reseteamos codi_centre
  dialog.value = true;
};

// --- 4. ENVIAR SOLICITUD ---
const enviarSolicitud = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  if (!nomCentreDetectat.value) {
      alert("Codi de centre invàlid o no trobat.");
      return;
  }

  enviando.value = true;

  try {
    const response = await fetch('http://localhost:3000/api/solicituds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        taller_id: taller.value._id,
        codi_centre: form.codi_centre,
        alumnes_previstos: parseInt(form.alumnes_previstos),
        dia_preferit: form.dia_preferit,
        relevancia: form.relevancia, // <--- ENVIAMOS EL DATO
        observacions: form.observacions
      })
    });

    if (!response.ok) throw new Error('Error al servidor');

    dialog.value = false;
    snackbar.value = true;
    
    await cargarTaller();

  } catch (error) {
    alert("Error creant la sol·licitud.");
    console.error(error);
  } finally {
    enviando.value = false;
  }
};

// --- HELPERS VISUALES ---
const generarImagen = (t) => {
  if (t.imatge && t.imatge.startsWith('http')) return t.imatge;
  
  const nom = t.nom || '';
  const keywords = {'Robòtica': 'robot', 'Cuina': 'chef', 'Vela': 'sea', 'Mecànica': 'bike'};
  const key = Object.keys(keywords).find(k => nom.includes(k)) || 'school';
  const word = keywords[key] || 'education';
  return `https://source.unsplash.com/1600x900/?${word}`;
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