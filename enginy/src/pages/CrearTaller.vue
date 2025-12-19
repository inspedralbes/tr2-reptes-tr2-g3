<template>
  <v-main class="bg-grey-lighten-5" style="min-height: 100vh; padding-top: 20px;">
    <v-container style="max-width: 1000px;">
      
      <div class="d-flex align-center justify-space-between mb-6">
        <div>
          <h1 class="text-h4 font-weight-bold text-primary-dark">Nou Taller</h1>
          <p class="text-subtitle-1 text-grey-darken-1">Dona d'alta una nova activitat al catàleg FP.</p>
        </div>
        <v-btn 
          variant="tonal" 
          color="grey-darken-2" 
          prepend-icon="mdi-arrow-left"
          @click="$router.back()"
        >
          Tornar
        </v-btn>
      </div>

      <v-form @submit.prevent="guardarTaller" ref="formRef">
        <v-row>
          
          <v-col cols="12" md="8">
            
            <v-card elevation="2" class="rounded-lg mb-4 border-top-primary">
              <v-card-item title="Dades de l'activitat" subtitle="Informació visible per als alumnes">
                <template v-slot:prepend>
                  <v-avatar color="primary-lighten-5" rounded>
                    <v-icon color="primary">mdi-text-box-edit-outline</v-icon>
                  </v-avatar>
                </template>
              </v-card-item>
              
              <v-divider></v-divider>

              <v-card-text class="pt-4">
                <v-row>
                  <v-col cols="12" sm="4">
                    <v-text-field 
                      v-model="form.codi" 
                      label="Codi Intern" 
                      placeholder="Ex: T-24"
                      variant="outlined"
                      density="comfortable"
                      prepend-inner-icon="mdi-barcode"
                      color="primary"
                      :rules="[v => !!v || 'El codi és obligatori']"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" sm="8">
                    <v-text-field 
                      v-model="form.nom" 
                      label="Títol del Taller" 
                      placeholder="Ex: Robòtica Submarina"
                      variant="outlined"
                      density="comfortable"
                      color="primary"
                      :rules="[v => !!v || 'El nom és obligatori']"
                    ></v-text-field>
                  </v-col>
                </v-row>

                <v-textarea 
                  v-model="form.descripcio" 
                  label="Descripció Detallada" 
                  rows="5"
                  variant="outlined"
                  color="primary"
                  class="mt-2"
                  placeholder="Explica què aprendran, metodologia, etc."
                ></v-textarea>

                <v-card variant="outlined" class="mt-4 pa-4 border-dashed" color="grey-lighten-1">
                  <label class="text-caption font-weight-bold text-grey-darken-1">IMATGE DE PORTADA</label>
                  
                  <v-row class="mt-1">
                    <v-col cols="12" sm="8">
                      <v-text-field 
                        v-model="form.imatge" 
                        label="URL de la imatge" 
                        placeholder="https://..."
                        prepend-inner-icon="mdi-link"
                        variant="outlined"
                        density="compact"
                        hide-details
                        color="primary"
                      ></v-text-field>
                      <div class="text-caption text-grey mt-2">
                        Copia i enganxa una URL d'Unsplash, Imgur o Google Images.
                      </div>
                    </v-col>
                    
                    <v-col cols="12" sm="4">
                      <v-img 
                        :src="form.imatge || 'https://via.placeholder.com/300?text=Sense+Imatge'" 
                        height="80" 
                        cover 
                        class="rounded-lg bg-grey-lighten-3 border"
                      ></v-img>
                    </v-col>
                  </v-row>
                </v-card>
                </v-card-text>
            </v-card>
            
            <v-card elevation="2" class="rounded-lg">
              <v-card-item title="Requisits i Detalls Tècnics">
                <template v-slot:prepend>
                  <v-avatar color="orange-lighten-5" rounded>
                    <v-icon color="orange-darken-2">mdi-wrench-outline</v-icon>
                  </v-avatar>
                </template>
              </v-card-item>
              <v-divider></v-divider>
              <v-card-text>
                 <v-row>
                    <v-col cols="12" sm="6">
                       <v-checkbox 
                          v-model="form.detalls.transport" 
                          label="Transport Requerit" 
                          color="primary" 
                          hide-details
                          density="compact"
                       ></v-checkbox>
                       <div class="text-caption text-grey ml-8">Marcar si cal autobús per anar-hi.</div>
                    </v-col>
                    <v-col cols="12" sm="6">
                       <v-checkbox 
                          v-model="form.detalls.ordinador" 
                          label="Portàtil Requerit" 
                          color="primary" 
                          hide-details
                          density="compact"
                       ></v-checkbox>
                       <div class="text-caption text-grey ml-8">L'alumne ha de portar el seu equip.</div>
                    </v-col>
                    <v-col cols="12" sm="6">
                       <v-checkbox 
                          v-model="form.detalls.bata" 
                          label="Roba especial / Bata" 
                          color="primary" 
                          hide-details
                          density="compact"
                       ></v-checkbox>
                    </v-col>
                 </v-row>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="4">
            <v-card elevation="3" class="rounded-lg h-100 border-top-secondary">
              <v-card-item class="bg-grey-lighten-4">
                <v-card-title class="text-subtitle-1 font-weight-bold">Configuració Logística</v-card-title>
              </v-card-item>
              
              <v-card-text class="pt-6">
                
                <label class="text-caption font-weight-bold text-grey-darken-1">MODALITAT</label>
                <v-select
                  v-model="form.modalitat"
                  :items="['A', 'B', 'C']"
                  variant="outlined"
                  density="comfortable"
                  class="mt-1 mb-6"
                  hide-details
                >
                  <template v-slot:selection="{ item }">
                    <v-chip :color="getColor(item.raw)" size="small" class="font-weight-bold" variant="flat">
                      Modalitat {{ item.raw }}
                    </v-chip>
                  </template>
                  <template v-slot:item="{ props, item }">
                    <v-list-item v-bind="props" :title="`Modalitat ${item.raw}`">
                      <template v-slot:prepend>
                        <v-icon :color="getColor(item.raw)">mdi-circle</v-icon>
                      </template>
                    </v-list-item>
                  </template>
                </v-select>

                <label class="text-caption font-weight-bold text-grey-darken-1">CAPACITAT TOTAL</label>
                <v-text-field 
                  v-model.number="form.places_totals" 
                  type="number" 
                  variant="outlined"
                  class="mt-1 mb-2"
                  prepend-inner-icon="mdi-account-group"
                  suffix="alumnes"
                  hide-details
                ></v-text-field>
                <div class="text-caption text-grey mb-6">
                  S'assignaran {{ form.places_totals }} places inicialment.
                </div>

                <v-divider class="mb-6"></v-divider>

                <v-btn 
                  color="primary" 
                  size="x-large" 
                  block 
                  type="submit" 
                  elevation="4"
                  :loading="loading"
                  prepend-icon="mdi-content-save"
                >
                  Publicar Taller
                </v-btn>

              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-form>

      <v-snackbar v-model="snackbar" color="success" timeout="3000">
        <v-icon start>mdi-check-circle</v-icon>
        Taller creat correctament!
      </v-snackbar>

    </v-container>
  </v-main>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const loading = ref(false);
const snackbar = ref(false);
const formRef = ref(null);

// ESTADO DEL FORMULARIO
const form = reactive({
  codi: '',
  nom: '',
  imatge: '', // CAMPO NUEVO
  modalitat: 'A',
  places_totals: 15,
  descripcio: '',
  detalls: {
    transport: false,
    ordinador: false,
    bata: false
  }
});

// Colores para los chips de modalidad
const getColor = (m) => ({ A: 'indigo', B: 'teal', C: 'orange-darken-1' }[m] || 'grey');

// LÓGICA DE ENVÍO
const guardarTaller = async () => {
  // 1. Validar formulario (si usas reglas de Vuetify)
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  loading.value = true;
  
  try {
    // 2. Llamada al Backend
    const response = await fetch('http://localhost:3000/api/tallers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });

    if (!response.ok) throw new Error('Error al guardar');

    // 3. Éxito
    snackbar.value = true;
    
    // Opcional: Redirigir o limpiar formulario después de 1 segundo
    setTimeout(() => {
      // Limpiar formulario
      form.nom = '';
      form.codi = '';
      form.descripcio = '';
      form.imatge = ''; // Limpiar imagen también
    }, 1500);

  } catch (error) {
    console.error(error);
    alert('Hi ha hagut un error connectant amb el servidor.');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.text-primary-dark { color: #004B87; }

/* Bordes superiores de colores para distinguir tarjetas */
.border-top-primary {
  border-top: 4px solid #004B87;
}
.border-top-secondary {
  border-top: 4px solid #f59e0b; /* Color acento */
}

/* Borde punteado para la zona de imagen */
.border-dashed {
  border-style: dashed !important;
}
</style>