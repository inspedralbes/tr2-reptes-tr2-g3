<template>
  <v-app-bar color="#333333" elevation="2" theme="dark">
    
    <div class="ml-15 d-flex align-center">
      <img 
        src="/logoGencat/gencat_cat_blanc.png" 
        alt="Logo Generalitat" 
        height="25" 
      />
    </div>

    <v-btn 
      variant="text" 
      class="text-none ml-15"
      size="100px" 
      @click="irAInicio"
    >
        Inici
    </v-btn>

    <v-spacer></v-spacer>

    <v-btn 
      prepend-icon="mdi-account" 
      variant="text" 
      class="text-none mr-15"
      @click="irALogin"
    >
      Accedeix
    </v-btn>

  </v-app-bar>
</template>

<script setup>
  import { useRouter } from 'vue-router';
  const router = useRouter();
  
  // Ya no necesitas 'click-login' si navegas directamente a una página
  // defineEmits(['click-login']); 

  const irAInicio = () => {
    router.push('/');
  }

  // Nueva función para ir al Login
  const irALogin = () => {
    // Esto asume que tu ruta en el router.js o pages está configurada como '/login'
    router.push('/login');
  }
</script>

<style scoped>
    img {
        object-fit: contain; 
    }
</style>