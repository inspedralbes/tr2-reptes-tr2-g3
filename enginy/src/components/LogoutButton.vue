<template>
  <v-btn
    prepend-icon="mdi-logout"
    variant="text"
    color="error"
    class="font-weight-bold text-none"
    @click="handleLogout"
  >
    Tancar Sessió
  </v-btn>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

const handleLogout = () => {
  authStore.logout(router);
};
</script>