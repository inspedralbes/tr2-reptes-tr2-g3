// importar_centres.js
const fs = require('fs');
const path = require('path');
const { connectDB } = require('./db'); // Usamos tu conexión existente

async function importar() {
    console.log("Connectant a la base de dades...");
    const db = await connectDB();
    const collection = db.collection('centres_oficials');

    console.log("Llegint fitxer JSON...");
    try {
        // Buscamos el archivo de forma robusta (en la raíz o en la carpeta actual)
        const rutaArrel = path.join(__dirname, '../centres.json');
        const rutaLocal = path.join(__dirname, 'centres.json');
        // Si existe en ../ (raíz), usa ese, si no, busca en local
        const rutaFinal = fs.existsSync(rutaArrel) ? rutaArrel : rutaLocal;

        const data = fs.readFileSync(rutaFinal, 'utf8');
        const docs = JSON.parse(data);

        if (docs.length > 0) {
            // TRANSFORMACIÓN CLAVE: Asignamos el código del centro al campo _id
            const docsTransformats = docs.map(d => ({
                ...d,
                _id: d.codi_centre || d.codi || d._id // Usamos el código oficial como ID de Mongo
            }));

            console.log(`Inserint ${docsTransformats.length} centres a la col·lecció 'centres_oficials'...`);

            // Borramos datos viejos para evitar duplicados y metemos los nuevos
            await collection.deleteMany({});
            await collection.insertMany(docsTransformats); 

            console.log("Importació completada amb èxit!");
        } else {
            console.log("No s'han trobat dades al JSON.");
        }

    } catch (error) {
        console.error("Error:", error.message);
        console.log("Assegura't que el fitxer 'centres.json' està a la carpeta arrel.");
    } finally {
        process.exit();
    }
}

importar();