<template>
    <NavBar />
    
    <v-container>
        
        <h1 class="text-center mt-10">Enginy</h1>

        <div class="mt-6 text-center mx-auto px-4" style="max-width: 1000px;">
            <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque eget arcu fermentum, pulvinar dui nec, ornare elit. Praesent ultricies elit vitae gravida tristique. Aenean in hendrerit ante. Nam ac pulvinar libero. Vivamus semper at magna in scelerisque. Fusce hendrerit ligula imperdiet odio pharetra fringilla. Ut et varius lacus, id maximus lacus. In pellentesque nec tellus sed porttitor. Aliquam vitae cursus nulla, sed mattis felis.
            </p>
        </div>

        <div 
            class="mt-10 mx-auto d-flex align-center justify-center bg-grey-lighten-4 rounded-lg" 
            style="max-width: 1000px; height: 400px; border: 3px dashed #999999;"
        >
            <span class="text-h6 text-grey-darken-1">
                Espai per a la imatge (1000 x 400px)
            </span>
        </div>

    </v-container>
</template>

<style scoped>
h1 {
    color: #C00000;
    font-size: 3rem; 
    font-weight: bold;
}
p {
    font-size: 1.25rem; 
    color: #666666;
    line-height: 1.6; 
}
</style>

<script setup>
    import NavBar from '@/components/NavBar.vue';
</script>