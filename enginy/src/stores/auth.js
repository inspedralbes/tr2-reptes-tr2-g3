import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user')) || null,
    returnUrl: null 
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    esAdmin: (state) => state.user?.rol === 'admin',
    esCentre: (state) => state.user?.rol === 'centre',
    esProfessor: (state) => state.user?.rol === 'professor',
  },

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

      
        this.user = data.user;

        localStorage.setItem('user', JSON.stringify(data.user));

        return data.user; 
      } catch (error) {
        console.error(error);
        throw error; 
      }
    },

    logout(router = null) {
      this.user = null;
      localStorage.removeItem('user');
      if (router) {
        router.push('/login');
      } else {
        window.location.href = '/login';
      }
    }
  }
});