<template>
  <NavBar />

  <v-main class="bg-grey-lighten-5" style="min-height: 100vh; margin-top: 120px;">
    
    <v-container class="pt-10 pb-6" style="max-width: 1000px;">
      <div class="text-center mb-8">
        <h1 class="text-h3 font-weight-bold mb-2" style="color: #004B87;">Catàleg de Tallers</h1>
        <p class="text-body-1 text-grey-darken-1">
          Descobreix els oficis compartits del programa Enginy per al curs 2025-2026.
        </p>
      </div>

      <v-card elevation="3" class="rounded-xl overflow-hidden mx-auto" max-width="800">
        <v-text-field
          v-model="cerca"
          placeholder="Cerca per nom del taller, ofici o lloc..."
          prepend-inner-icon="mdi-magnify"
          variant="solids"
          hide-details
          class="py-2 px-4"
          bg-color="white"
          color="#004B87"
          clearable
        ></v-text-field>
      </v-card>
    </v-container>

    <v-container v-if="!cerca" class="mb-10" style="max-width: 1000px;">
      <div class="d-flex align-center mb-4">
        <v-icon color="#004B87" class="mr-2">mdi-star</v-icon>
        <h2 class="text-h5 font-weight-bold" style="color: #333;">Destaquem</h2>
      </div>

      <v-row>
        <v-col cols="12" md="4" v-for="taller in destacats" :key="taller.id">
          <v-card 
            class="rounded-lg cursor-pointer hover-card h-100" 
            elevation="2"
            @click="veureDetall(taller)"
          >
            <v-img :src="taller.imatge" height="180" cover class="align-end">
              <div class="bg-black-transparent px-4 py-2 w-100">
                <span class="text-white font-weight-bold">{{ taller.categoria }}</span>
              </div>
            </v-img>
            <v-card-text>
              <h3 class="text-h6 font-weight-bold mb-1 text-truncate" style="color: #004B87;">
                {{ taller.titol }}
              </h3>
              <div class="d-flex align-center text-caption text-grey-darken-1">
                <v-icon size="small" class="mr-1">mdi-map-marker</v-icon>
                {{ taller.lloc }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <v-container class="pb-16" style="max-width: 1000px;">
      <div class="d-flex align-center justify-space-between mb-4">
        <div class="d-flex align-center">
          <v-icon color="#004B87" class="mr-2">mdi-view-grid</v-icon>
          <h2 class="text-h5 font-weight-bold" style="color: #333;">
            {{ cerca ? 'Resultats de la cerca' : 'Tots els tallers' }}
          </h2>
        </div>
        <span class="text-caption text-grey">{{ tallersFiltrats.length }} tallers disponibles</span>
      </div>

      <v-row>
        <v-col cols="12" sm="6" md="4" v-for="taller in tallersFiltrats" :key="taller.id">
          <v-card 
            class="rounded-lg cursor-pointer hover-card d-flex flex-column h-100" 
            elevation="1"
            border
            @click="veureDetall(taller)"
          >
            <div class="pa-4 pb-0">
              <v-chip 
                size="small" 
                :color="getColorCategoria(taller.categoria)" 
                variant="flat" 
                class="font-weight-bold"
              >
                {{ taller.categoria }}
              </v-chip>
            </div>

            <v-card-title class="text-subtitle-1 font-weight-bold pt-3 pb-1 text-wrap" style="line-height: 1.3;">
              {{ taller.titol }}
            </v-card-title>

            <v-card-text class="flex-grow-1">
              <div class="d-flex align-start mb-2">
                <v-icon size="small" color="grey" class="mr-2 mt-1">mdi-map-marker</v-icon>
                <span class="text-body-2 text-grey-darken-2">{{ taller.lloc }}</span>
              </div>
              <div class="d-flex align-center text-caption text-grey">
                 <v-icon size="small" class="mr-2">mdi-clock-outline</v-icon>
                 {{ taller.horari }}
              </div>
            </v-card-text>

            <v-divider></v-divider>

            <v-card-actions class="pa-3 bg-grey-lighten-5">
              <v-spacer></v-spacer>
              <span class="text-caption font-weight-bold text-uppercase" style="color: #004B87;">
                Veure detalls <v-icon size="small">mdi-arrow-right</v-icon>
              </span>
            </v-card-actions>
          </v-card>
        </v-col>

        <v-col cols="12" v-if="tallersFiltrats.length === 0" class="text-center py-10">
          <v-icon size="60" color="grey-lighten-2">mdi-emoticon-sad-outline</v-icon>
          <h3 class="text-h6 text-grey mt-4">No s'han trobat tallers amb aquest nom.</h3>
          <v-btn variant="text" color="primary" @click="cerca = ''">Netejar cerca</v-btn>
        </v-col>
      </v-row>

    </v-container>
  </v-main>
</template>

<script setup>
import { ref, computed } from 'vue';
import NavBar from '@/components/NavBar.vue';

const cerca = ref('');

// DATOS EXTRAÍDOS DEL PDF PROPORCIONADO
const tallers = [
  { 
    id: 1, 
    titol: "Oficis Gastronòmics i Cuina", 
    categoria: "Hostaleria", 
    lloc: "Impulsem / Granja escola Sinai", // [cite: 97, 159]
    horari: "Dijous 9-12h / 10-13h",
    imatge: "https://images.unsplash.com/photo-1556910103-1c02745a30bf?auto=format&fit=crop&w=500&q=80"
  },
  { 
    id: 2, 
    titol: "Tecnolab Makers", 
    categoria: "Tecnologia", 
    lloc: "ISMAB (C/ Mollerussa, 71)", // [cite: 72, 314]
    horari: "Dijous 9-12h",
    imatge: "https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=500&q=80"
  },
  { 
    id: 3, 
    titol: "Mecànica de Bicicletes", 
    categoria: "Mecànica", 
    lloc: "Biciclot (C/ Verneda, 16)", // [cite: 103, 227]
    horari: "Dijous, torns matí",
    imatge: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=500&q=80"
  },
  { 
    id: 4, 
    titol: "Imatge Personal (Perruqueria i Estètica)", 
    categoria: "Imatge", 
    lloc: "Centre Formació Colomer", // [cite: 125, 272]
    horari: "Dijous o Dimarts",
    imatge: "https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=500&q=80"
  },
  { 
    id: 5, 
    titol: "Vela i Oficis de la Mar", 
    categoria: "Esport / Mar", 
    lloc: "Centre Municipal de Vela (Port Olímpic)", // [cite: 134, 142]
    horari: "Dimarts o Dijous 9-12h",
    imatge: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=500&q=80"
  },
  { 
    id: 6, 
    titol: "Jardineria", 
    categoria: "Medi Ambient", 
    lloc: "ISMAB (C/ Mollerussa, 71)", // [cite: 64, 305]
    horari: "Dijous 9-12h",
    imatge: "https://images.unsplash.com/photo-1416879595881-1d7918ca3678?auto=format&fit=crop&w=500&q=80"
  },
  { 
    id: 7, 
    titol: "Informàtica i Tecnologia", 
    categoria: "TIC", 
    lloc: "INS Escola de Treball", // [cite: 209, 218]
    horari: "Dimarts o Dijous 10-13h",
    imatge: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=500&q=80"
  },
  { 
    id: 8, 
    titol: "Fem Cine / Fem Moda Sostenible", 
    categoria: "Artístic", 
    lloc: "Artixoc / Rambla Santa Mònica", // [cite: 151, 351]
    horari: "Dijous Matí",
    imatge: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=500&q=80"
  },
  { 
    id: 9, 
    titol: "Instal·lacions Domèstiques", 
    categoria: "Manteniment", 
    lloc: "INS Anna Gironella de Mundet", // [cite: 180, 338]
    horari: "Dijous 8:30-11:30h",
    imatge: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=500&q=80"
  }
];

// Lógica de destacados (cogemos los 3 primeros)
const destacats = tallers.slice(0, 3);

// Lógica de filtrado
const tallersFiltrats = computed(() => {
  if (!cerca.value) return tallers;
  const q = cerca.value.toLowerCase();
  return tallers.filter(t => 
    t.titol.toLowerCase().includes(q) || 
    t.categoria.toLowerCase().includes(q) ||
    t.lloc.toLowerCase().includes(q)
  );
});

// Colores para categorías
const getColorCategoria = (cat) => {
  const map = {
    'Tecnologia': 'blue-lighten-4',
    'Hostaleria': 'orange-lighten-4',
    'Mecànica': 'grey-lighten-2',
    'Imatge': 'pink-lighten-4',
    'Medi Ambient': 'green-lighten-4',
    'Esport / Mar': 'cyan-lighten-4',
    'TIC': 'deep-purple-lighten-4',
    'Artístic': 'purple-lighten-4',
    'Manteniment': 'brown-lighten-4'
  };
  return map[cat] || 'grey-lighten-3';
};

const veureDetall = (taller) => {
  console.log("Navegar a taller:", taller.id);
  // router.push(`/taller/${taller.id}`);
};
</script>

<style scoped>
.bg-black-transparent {
  background: rgba(0, 0, 0, 0.6);
}

/* Efecto hover en las tarjetas */
.hover-card {
  transition: transform 0.2s, box-shadow 0.2s;
}
.hover-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
  border-color: #004B87 !important;
}

/* Estilo del buscador */
.v-text-field :deep(.v-field__outline) {
  display: none;
}
</style>