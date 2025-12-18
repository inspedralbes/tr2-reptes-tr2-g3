<template>
    <NavBar />
    
    <v-container class="mx-auto px-4" style="max-width: 1000px; margin-top: 120px;">
        
        <h1 class="text-center font-weight-bold mb-6" style="color: #00426B;">Enginy</h1>

        <div class="text-center mx-auto mb-10">
            <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque eget arcu fermentum, pulvinar dui nec, ornare elit. Praesent ultricies elit vitae gravida tristique. Aenean in hendrerit ante. Nam ac pulvinar libero. Vivamus semper at magna in scelerisque. Fusce hendrerit ligula imperdiet odio pharetra fringilla. Ut et varius lacus, id maximus lacus. In pellentesque nec tellus sed porttitor. Aliquam vitae cursus nulla, sed mattis felis.
            </p>
        </div>

        <div 
            class="d-flex align-center justify-center bg-grey-lighten-5 rounded-lg w-100 mx-auto" 
            style="height: 400px; border: 2px dashed #999999;"
        >
            <div class="text-center">
                <span class="text-h6 text-grey-darken-1">
                    Espai per a la imatge (1000 x 400px)
                </span>
            </div>
        </div>

    </v-container>
</template>

<style scoped>
h1 { font-size: 3rem; }
p { font-size: 1.15rem; color: #666666; line-height: 1.6; }
</style>

<script setup>
    import NavBar from '@/components/NavBar.vue';
</script>