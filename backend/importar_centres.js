
const fs = require('fs');
const path = require('path');
const { connectDB } = require('./db'); 

async function importar() {
    console.log("Connectant a la base de dades...");
    const db = await connectDB();
    const collection = db.collection('centres_oficials');

    console.log("Llegint fitxer JSON...");
    try {
        
        const rutaArrel = path.join(__dirname, '../centres.json');
        const rutaLocal = path.join(__dirname, 'centres.json');
        
        const rutaFinal = fs.existsSync(rutaArrel) ? rutaArrel : rutaLocal;

        const data = fs.readFileSync(rutaFinal, 'utf8');
        const docs = JSON.parse(data);

        if (docs.length > 0) {
            
            const docsTransformats = docs.map(d => ({
                ...d,
                _id: d.codi_centre || d.codi || d._id 
            }));

            console.log(`Inserint ${docsTransformats.length} centres a la col·lecció 'centres_oficials'...`);

            
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