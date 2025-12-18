<template>
  <v-row no-gutters class="fill-height overflow-hidden">
    
    <v-col cols="12" md="6" class="d-flex align-center justify-center bg-white position-relative">
      
      <div class="position-absolute top-0 left-0 w-100 h-100 pattern-grid"></div>

      <v-card 
        width="100%" 
        max-width="480" 
        elevation="0" 
        color="#f6f6f6"
        class="rounded-xl pa-8 pa-md-12 z-index-2 border"
        style="border-color: #eeeeee !important;"
      >
        
        <div class="mb-8 text-center text-md-left">
          <div class="d-flex align-center justify-center justify-md-start mb-2">
            <v-avatar color="#004B87" size="12" class="mr-3"></v-avatar>
            <h1 class="text-h4 font-weight-black" style="color: #004B87; letter-spacing: -1px;">ENGINY</h1>
          </div>
          <h2 class="text-h5 font-weight-bold mb-2 text-grey-darken-4">Benvingut de nou</h2>
          <p class="text-body-2 text-grey-darken-1">
            Si us plau, introdueix les teves dades.
          </p>
        </div>

        <v-form @submit.prevent="handleLogin">
          
          <div class="mb-5">
            <div class="text-caption font-weight-bold text-grey-darken-2 mb-1 ml-1">Identificador</div>
            <v-text-field
              v-model="username"
              placeholder="Ex: usuari@exemple.com"
              prepend-inner-icon="mdi-account-circle-outline"
              variant="outlined"
              density="comfortable"
              color="#004B87"
              bg-color="white"
              class="rounded-lg custom-input"
              hide-details="auto"
            ></v-text-field>
          </div>

          <div class="mb-2">
            <div class="text-caption font-weight-bold text-grey-darken-2 mb-1 ml-1">Contrasenya</div>
            <v-text-field
              v-model="password"
              :type="visible ? 'text' : 'password'"
              placeholder="••••••••"
              prepend-inner-icon="mdi-lock-outline"
              :append-inner-icon="visible ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
              variant="outlined"
              density="comfortable"
              color="#004B87"
              bg-color="white"
              class="rounded-lg custom-input"
              hide-details="auto"
              @click:append-inner="visible = !visible"
            ></v-text-field>
          </div>

          <div class="d-flex align-center justify-space-between mb-8 flex-wrap">
            <v-checkbox
              v-model="rememberMe"
              label="Recorda'm"
              hide-details
              color="#004B87"
              density="compact"
              class="text-body-2 mt-2"
            ></v-checkbox>
          </div>

          <v-btn
            type="submit"
            block
            height="56"
            color="#004B87"
            class="text-none text-subtitle-1 font-weight-bold rounded-lg elevation-2 btn-hover-effect"
          >
            Accedir
            <v-icon icon="mdi-arrow-right" class="ml-2" size="small"></v-icon>
          </v-btn>

        </v-form>

        <div class="text-center mt-8 text-caption text-grey">
          Protegit per reCAPTCHA i subjecte a la política de privacitat del Consorci.
        </div>
      </v-card>
    </v-col>

    <v-col 
      cols="12" 
      md="6" 
      class="d-none d-md-flex align-center justify-center position-relative overflow-hidden"
    >
      <div class="position-absolute w-100 h-100 bg-gradient-animate"></div>
      <div class="glass-shape shape-1"></div>
      <div class="glass-shape shape-2"></div>
      
      <div class="d-flex flex-column align-center justify-center text-center pa-10 z-index-2" style="max-width: 500px;">
        <v-img
          src="https://undraw.co/api/illustrator/v1/svg/2618/1976d2/69f0ae/ffffff/Image.svg" 
          alt="Ilustración"
          width="100%"
          max-width="400"
          class="mb-8 drop-shadow-img"
        ></v-img>

        <h2 class="text-h4 font-weight-bold text-white mb-4">La teva eina educativa</h2>
        <p class="text-white text-body-1 opacity-90">
          Gestiona, aprèn i connecta amb la comunitat educativa de Barcelona.
        </p>
      </div>
    </v-col>

  </v-row>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const username = ref('');
const password = ref('');
const visible = ref(false);
const rememberMe = ref(false);

const handleLogin = () => {
  router.push('/');
};
</script>

<style scoped>
.fill-height { min-height: 100vh; }
.z-index-2 { z-index: 2; position: relative; }

/* Fondo de puntos muy sutil */
.pattern-grid {
  background-image: radial-gradient(#cccccc 1px, transparent 1px);
  background-size: 20px 20px;
  opacity: 0.2;
}

/* Inputs */
.custom-input :deep(.v-field__outline__start),
.custom-input :deep(.v-field__outline__end),
.custom-input :deep(.v-field__outline__notch) {
  border-color: #e0e0e0;
  transition: border-color 0.3s ease;
}
.custom-input:hover :deep(.v-field__outline__start),
.custom-input:hover :deep(.v-field__outline__end),
.custom-input:hover :deep(.v-field__outline__notch) {
  border-color: #004B87;
}

/* Hover Botón */
.btn-hover-effect {
  transition: transform 0.2s, box-shadow 0.2s;
}
.btn-hover-effect:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0, 75, 135, 0.2) !important;
}

.hover-underline:hover { text-decoration: underline !important; }

/* Fondo Derecha */
.bg-gradient-animate {
  background: linear-gradient(-45deg, #004B87, #0066b3, #002E5D, #004B87);
  background-size: 400% 400%;
  animation: gradientBG 15s ease infinite;
}

@keyframes gradientBG {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.glass-shape {
  position: absolute;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.shape-1 { width: 300px; height: 300px; top: -50px; right: -50px; }
.shape-2 { width: 200px; height: 200px; bottom: 50px; left: 50px; background: rgba(255, 255, 255, 0.05); }
.drop-shadow-img { filter: drop-shadow(0 10px 15px rgba(0,0,0,0.2)); }
</style>