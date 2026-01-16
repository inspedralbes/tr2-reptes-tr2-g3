// src/stores/auth.js
import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  // 1. ESTADO: Aquí guardamos los datos globales
  state: () => ({
    // Intentamos leer del localStorage al iniciar para no perder la sesión al refrescar
    user: JSON.parse(localStorage.getItem('user')) || null,
    returnUrl: null // Para redirigir después de loguearse (opcional)
  }),

  // 2. GETTERS: Para saber cosas del estado (ej: ¿está logueado?)
  getters: {
    isAuthenticated: (state) => !!state.user,
    esAdmin: (state) => state.user?.rol === 'admin',
    esCentre: (state) => state.user?.rol === 'centre',
    esProfessor: (state) => state.user?.rol === 'professor',
  },

  // 3. ACCIONES: Las funciones para modificar el estado (Login / Logout)
  actions: {
    async login(email, password) {
      try {
        const response = await fetch('http://localhost:3000/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Credenciales incorrectas');
        }

        // --- ÉXITO ---
        // 1. Actualizamos el estado de Pinia
        this.user = data.user;

        // 2. Guardamos en localStorage para persistencia
        localStorage.setItem('user', JSON.stringify(data.user));

        return true; // Indicamos que fue bien
      } catch (error) {
        console.error(error);
        throw error; // Lanzamos el error para que lo muestre el componente
      }
    },

    logout() {
      this.user = null;
      localStorage.removeItem('user');
      // Opcional: forzar recarga o ir al login
      window.location.href = '/login'; 
    }
  }
});