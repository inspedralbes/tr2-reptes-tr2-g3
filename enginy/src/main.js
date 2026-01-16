/**
 * main.js
 */

// 1. Imports de Vue y librerías
import { createApp } from 'vue'
import { createPinia } from 'pinia' // Importar Pinia

// 2. Imports de Componentes y Estilos
import App from './App.vue'
import { registerPlugins } from '@/plugins'
import 'unfonts.css'

// 3. Crear la App
const app = createApp(App)

// 4. Usar Pinia (ANTES de montar)
app.use(createPinia())

// 5. Registrar otros plugins (Vuetify, Router, etc.)
registerPlugins(app)

// 6. Montar la App (SIEMPRE AL FINAL)
app.mount('#app')