<template>
  <v-main class="bg-grey-lighten-5" style="min-height: 100vh; padding-top: 20px;">
    <v-container style="max-width: 1000px;">
      
      <div class="d-flex align-center justify-space-between mb-6">
        <div>
          <h1 class="text-h4 font-weight-bold text-primary-dark">Nou Usuari</h1>
          <p class="text-subtitle-1 text-grey-darken-1">Dona d'alta un nou centre educatiu o un professor.</p>
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

      <v-form @submit.prevent="guardarUsuari" ref="formRef">
        <v-row>
          
          <v-col cols="12" md="8">
            
            <v-card elevation="2" class="rounded-lg mb-4 border-top-primary">
              <v-card-item title="Credencials d'Accés" subtitle="Dades per iniciar sessió a la plataforma">
                <template v-slot:prepend>
                  <v-avatar color="primary-lighten-5" rounded>
                    <v-icon color="primary">mdi-shield-account-outline</v-icon>
                  </v-avatar>
                </template>
              </v-card-item>
              
              <v-divider></v-divider>

              <v-card-text class="pt-4">
                <v-row>
                  <v-col cols="12" sm="6">
                    <v-text-field 
                      v-model="form.email" 
                      label="Correu Electrònic" 
                      placeholder="exemple@xtec.cat"
                      variant="outlined"
                      density="comfortable"
                      prepend-inner-icon="mdi-email-outline"
                      color="primary"
                      type="email"
                      :rules="rules.email"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-text-field 
                      v-model="form.password" 
                      label="Contrasenya Inicial" 
                      type="password"
                      placeholder="********"
                      variant="outlined"
                      density="comfortable"
                      prepend-inner-icon="mdi-lock-outline"
                      color="primary"
                      :rules="rules.required"
                    ></v-text-field>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
            
            <v-window v-model="form.rol">
                
                <v-window-item value="centre">
                    <v-card elevation="2" class="rounded-lg">
                        <v-card-item title="Dades del Centre" subtitle="Informació oficial de l'institut">
                            <template v-slot:prepend>
                                <v-avatar color="orange-lighten-5" rounded>
                                    <v-icon color="orange-darken-2">mdi-domain</v-icon>
                                </v-avatar>
                            </template>
                            <template v-slot:append>
                                <v-chip size="small" color="orange-darken-1" variant="flat">Rol Centre</v-chip>
                            </template>
                        </v-card-item>
                        <v-divider></v-divider>
                        <v-card-text class="pt-4">
                            <v-row>
                                <v-col cols="12" sm="4">
                                    <v-text-field 
                                        v-model="form.centreData.codi_centre" 
                                        label="Codi Oficial" 
                                        placeholder="080..."
                                        variant="outlined"
                                        density="comfortable"
                                        :rules="form.rol === 'centre' ? rules.required : []"
                                        @update:model-value="buscarNomCentre"
                                        :loading="loadingCentre"
                                        prepend-inner-icon="mdi-barcode-scan"
                                        maxlength="10"
                                    ></v-text-field>
                                </v-col>
                                <v-col cols="12" sm="8">
                                    <v-text-field 
                                        v-model="form.centreData.nom_oficial" 
                                        label="Nom de l'Institut" 
                                        placeholder="S'omplirà automàticament..."
                                        variant="solo-filled"
                                        density="comfortable"
                                        :rules="form.rol === 'centre' ? rules.required : []"
                                        readonly
                                        theme="dark"
                                        bg-color="grey-darken-4"
                                        class="input-resaltado"
                                        prepend-inner-icon="mdi-school"
                                        append-inner-icon="mdi-lock"
                                    ></v-text-field>
                                </v-col>
                                <v-col cols="12" sm="6">
                                    <v-text-field 
                                        v-model="form.centreData.municipi" 
                                        label="Municipi" 
                                        variant="outlined"
                                        density="comfortable"
                                    ></v-text-field>
                                </v-col>
                                <v-col cols="12" sm="6">
                                    <v-text-field 
                                        v-model="form.centreData.adreça" 
                                        label="Adreça Postal" 
                                        variant="outlined"
                                        density="comfortable"
                                    ></v-text-field>
                                </v-col>
                            </v-row>
                        </v-card-text>
                    </v-card>
                </v-window-item>

                <v-window-item value="professor">
                    <v-card elevation="2" class="rounded-lg">
                        <v-card-item title="Dades del Professor/a" subtitle="Informació personal del docent">
                            <template v-slot:prepend>
                                <v-avatar color="teal-lighten-5" rounded>
                                    <v-icon color="teal-darken-2">mdi-account-tie</v-icon>
                                </v-avatar>
                            </template>
                            <template v-slot:append>
                                <v-chip size="small" color="teal-darken-1" variant="flat">Rol Professor</v-chip>
                            </template>
                        </v-card-item>
                        <v-divider></v-divider>
                        <v-card-text class="pt-4">
                            <v-row>
                                <v-col cols="12" sm="4">
                                     <v-text-field 
                                        v-model="codiCentreProfesorInput"
                                        label="Codi del Centre" 
                                        placeholder="080..."
                                        variant="outlined"
                                        density="comfortable"
                                        prepend-inner-icon="mdi-magnify"
                                        @update:model-value="buscarCentrePerProfessor"
                                        :loading="loadingCentre"
                                        maxlength="10"
                                        :rules="form.rol === 'professor' ? rules.required : []"
                                    ></v-text-field>
                                </v-col>
                                <v-col cols="12" sm="8">
                                     <v-text-field 
                                        :model-value="nomCentreProfesorDisplay"
                                        label="Centre Educatiu de Pertinença" 
                                        placeholder="S'assignarà automàticament..."
                                        variant="solo-filled"
                                        density="comfortable"
                                        readonly
                                        theme="dark"
                                        bg-color="grey-darken-4"
                                        class="input-resaltado"
                                        prepend-inner-icon="mdi-school"
                                        append-inner-icon="mdi-lock"
                                        :rules="form.rol === 'professor' ? [v => !!form.professorData.centre_id || 'Centre no vàlid'] : []"
                                    ></v-text-field>
                                </v-col>
                                <v-col cols="12">
                                     <div class="text-caption text-grey">El professor quedarà vinculat a aquest centre.</div>
                                </v-col>
                                
                                <v-col cols="12" sm="6">
                                    <v-text-field 
                                        v-model="form.professorData.nom" 
                                        label="Nom i Cognoms" 
                                        variant="outlined"
                                        density="comfortable"
                                        :rules="form.rol === 'professor' ? rules.required : []"
                                    ></v-text-field>
                                </v-col>
                                <v-col cols="12" sm="6">
                                    <v-text-field 
                                        v-model="form.professorData.departament" 
                                        label="Departament" 
                                        placeholder="Ex: Tecnologia / Informàtica"
                                        variant="outlined"
                                        density="comfortable"
                                    ></v-text-field>
                                </v-col>
                            </v-row>
                        </v-card-text>
                    </v-card>
                </v-window-item>

            </v-window>
          </v-col>

          <v-col cols="12" md="4">
            <v-card elevation="3" class="rounded-lg h-100 border-top-secondary">
              <v-card-item class="bg-grey-lighten-4">
                <v-card-title class="text-subtitle-1 font-weight-bold">Tipus d'Usuari</v-card-title>
              </v-card-item>
              
              <v-card-text class="pt-6">
                
                <label class="text-caption font-weight-bold text-grey-darken-1">SELECCIONA EL ROL</label>
                
                <v-btn-toggle
                  v-model="form.rol"
                  color="primary-dark"
                  group
                  mandatory
                  class="d-flex flex-column mt-2 w-100 border rounded"
                  style="height: auto;"
                >
                  <v-btn value="centre" class="w-100 py-4 justify-start" style="height: auto;">
                    <div class="d-flex align-center w-100 text-left">
                        <v-icon start icon="mdi-domain" class="mr-3"></v-icon>
                        <div>
                            <div class="font-weight-bold">Centre Educatiu</div>
                            <div class="text-caption text-grey-darken-1 text-capitalize">Crea una entitat escolar</div>
                        </div>
                    </div>
                  </v-btn>

                  <v-divider></v-divider>

                  <v-btn value="professor" class="w-100 py-4 justify-start" style="height: auto;">
                    <div class="d-flex align-center w-100 text-left">
                        <v-icon start icon="mdi-account-tie" class="mr-3"></v-icon>
                        <div>
                            <div class="font-weight-bold">Professor/a</div>
                            <div class="text-caption text-grey-darken-1 text-capitalize">Vinculat a un centre</div>
                        </div>
                    </div>
                  </v-btn>
                </v-btn-toggle>

                <v-alert
                    v-if="form.rol === 'professor'"
                    type="info"
                    variant="tonal"
                    density="compact"
                    class="mt-4 text-caption"
                >
                    Recorda que el centre ha d'existir abans de crear el professor.
                </v-alert>

                <v-divider class="my-6"></v-divider>

                <v-btn 
                  color="primary" 
                  size="x-large" 
                  block 
                  type="submit" 
                  elevation="4"
                  :loading="loading"
                  prepend-icon="mdi-account-plus"
                >
                  Crear Usuari
                </v-btn>

              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-form>

      <v-snackbar v-model="snackbar" color="success" timeout="3000">
        <v-icon start>mdi-check-circle</v-icon>
        Usuari creat correctament!
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

// ESTADO PARA LA BÚSQUEDA
const loadingCentre = ref(false);

// ESTADO ESPECÍFICO PARA EL PROFESOR (Visualización)
const codiCentreProfesorInput = ref('');
const nomCentreProfesorDisplay = ref('');

// ESTAT DEL FORMULARI (es manté igual per a la UI)
const form = reactive({
  email: '',
  password: '',
  rol: 'centre', 
  centreData: {
    codi_centre: '',
    nom_oficial: '',
    adreça: '',
    municipi: ''
  },
  professorData: {
    nom: '',
    departament: '',
    centre_id: null,
    disponibilitat: []
  }
});

const rules = {
    required: [v => !!v || 'Aquest camp és obligatori'],
    email: [
        v => !!v || 'El correu és obligatori',
        v => /.+@.+\..+/.test(v) || 'El format del correu no és vàlid'
    ]
};

// --- LÓGICA DE BÚSQUEDA PARA ROL: CENTRE ---
const buscarNomCentre = async (codi) => {
  if (!codi || codi.length < 5) {
      form.centreData.nom_oficial = '';
      return;
  }

  loadingCentre.value = true;
  try {
    const response = await fetch(`http://localhost:3000/api/centres/${codi}`);
    if (response.ok) {
      const data = await response.json();
      form.centreData.nom_oficial = data.nom; 
    } else {
      form.centreData.nom_oficial = ''; 
    }
  } catch (error) {
    console.error("Error API:", error);
  } finally {
    loadingCentre.value = false;
  }
};

// --- LÓGICA DE BÚSQUEDA PARA ROL: PROFESSOR ---
const buscarCentrePerProfessor = async (codi) => {
  if (!codi || codi.length < 5) {
      nomCentreProfesorDisplay.value = '';
      form.professorData.centre_id = null;
      return;
  }

  loadingCentre.value = true;
  try {
    const response = await fetch(`http://localhost:3000/api/centres/${codi}`);
    if (response.ok) {
      const data = await response.json();
      nomCentreProfesorDisplay.value = data.nom;
      form.professorData.centre_id = data._id; 
    } else {
      nomCentreProfesorDisplay.value = 'Centre no trobat';
      form.professorData.centre_id = null;
    }
  } catch (error) {
    console.error("Error API:", error);
    nomCentreProfesorDisplay.value = 'Error de connexió';
  } finally {
    loadingCentre.value = false;
  }
};

// --- FUNCIÓ PRINCIPAL ACTUALITZADA ---
const guardarUsuari = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  if (form.rol === 'professor' && !form.professorData.centre_id) {
      alert("Has d'introduir un codi de centre vàlid abans de crear el professor.");
      return;
  }

  loading.value = true;
  
  try {
    // 1. Construim el document (Igual que antes)
    const payload = {
        email: form.email,
        password_hash: form.password, 
        rol: form.rol,
        perfil: {}
    };

    if (form.rol === 'centre') {
        payload.perfil = {
            codi_centre: form.centreData.codi_centre,
            nom_oficial: form.centreData.nom_oficial,
            adreça: form.centreData.adreça,
            municipi: form.centreData.municipi
        };
    } else if (form.rol === 'professor') {
        // Asegúrate que centre_id es el ID de Mongo (string de 24 caracteres)
        payload.centre_id = form.professorData.centre_id; 
        payload.perfil = {
            nom: form.professorData.nom,
            departament: form.professorData.departament,
            disponibilitat: form.professorData.disponibilitat || []
        };
    }

    console.log("Enviando...", payload); // Para depurar

    // --- AQUÍ ESTÁ EL CAMBIO IMPORTANTE ---
    // Descomenta y ajusta la URL a la de tu backend real
    const response = await fetch('http://localhost:3000/api/usuaris', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
        // Si el backend devuelve error (ej: 400 o 500)
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al servidor");
    }

    const respuestaServidor = await response.json();
    console.log("Usuario creado:", respuestaServidor);
    // --------------------------------------

    snackbar.value = true;
    
    // Opcional: Redirigir después de crear
    setTimeout(() => {
       // router.push('/admin/usuaris');
    }, 1500);

  } catch (error) {
    console.error("Error completo:", error);
    alert("Error creant l'usuari: " + error.message);
  } finally {
    loading.value = false;
  }
};
</script>
<style scoped>
.text-primary-dark { color: #004B87; }

.border-top-primary {
  border-top: 4px solid #004B87;
}
.border-top-secondary {
  border-top: 4px solid #f59e0b; 
}

/* ESTILO ESPECIAL PARA EL INPUT DE FONDO NEGRO 
   Forzamos la opacidad al 100% para que el blanco brille bien
*/
.input-resaltado :deep(input) {
    color: white !important;
    font-weight: bold;
    letter-spacing: 0.5px;
}
.input-resaltado :deep(.v-field--disabled) {
    opacity: 1 !important;
}

.v-btn-toggle .v-btn {
    opacity: 0.7;
    border-color: #ddd;
}
.v-btn-toggle .v-btn--active {
    opacity: 1;
    background-color: #f0f7ff !important;
    border-color: #004B87 !important;
}
.v-btn-toggle .v-btn--active :deep(.v-icon) {
    color: #004B87;
}
</style>