<template>
  <NavBar/>
  
  <v-container class="d-flex justify-center mt-15" fluid>
    
    <v-card width="100%" max-width="600" elevation="0" color="transparent">
      
      <div class="d-flex justify-center w-100 mb-10">
        <h1 
          class="text-uppercase font-weight-bold text-center" 
          style="color: #C00000; font-size: 3.5rem; letter-spacing: 2px;"
        >
          Enginy
        </h1>
      </div>

      <v-form @submit.prevent="handleLogin">
        
        <div class="mb-4">
          <label class="text-subtitle-1 font-weight-medium text-black mb-1 d-block">
            Identificador:
          </label>
          <v-text-field
            v-model="username"
            variant="outlined"
            density="compact"
            bg-color="white"
            color="grey-darken-2"
            hide-details
            class="rounded-0"
          ></v-text-field>
        </div>

        <div class="mb-8">
          <label class="text-subtitle-1 font-weight-medium text-black mb-1 d-block">
            Contrasenya:
          </label>
          <v-text-field
            v-model="password"
            :type="visible ? 'text' : 'password'"
            variant="outlined"
            density="compact"
            bg-color="white"
            color="grey-darken-2"
            hide-details
            class="rounded-0"
            :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append-inner="visible = !visible"
          ></v-text-field>
        </div>

        <div class="d-flex justify-center mb-6">
          <v-btn
            type="submit"
            color="#333333"
            height="50"
            width="200"
            class="text-none text-subtitle-1 elevation-2"
            style="color: white;"
          >
            Accedir
          </v-btn>
        </div>
        
        </v-form>

    </v-card>
  </v-container>
</template>

<script setup>
import NavBar from '@/components/NavBar.vue';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const username = ref('');
const password = ref('');
const visible = ref(false);

const handleLogin = () => {
  console.log('Login:', username.value, password.value);
  router.push('/cataleg');
};

const irARegistro = () => {
  router.push('/register');
};
</script>

<style scoped>
/* Aseguramos que el h1 se centre también desde CSS por si acaso */
h1 {
  text-align: center;
  width: 100%;
}

.v-text-field :deep(.v-field__outline__start),
.v-text-field :deep(.v-field__outline__end),
.v-text-field :deep(.v-field__outline__notch) {
  border-color: #7a7a7a !important;
}
</style>