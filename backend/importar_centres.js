// importar_centres.js
const fs = require('fs');
const { connectDB } = require('./db'); // Usamos tu conexión existente

async function importar() {
    console.log("🔄 Connectant a la base de dades...");
    const db = await connectDB();
    const collection = db.collection('centres_oficials');

    console.log("📖 Llegint fitxer CSV...");
    try {
        const data = fs.readFileSync('totcat-centres-educatius.csv', 'utf8');
        const lines = data.split(/\r?\n/); // Dividir por líneas
        
        const docs = [];
        
        // Empezamos en i=1 para saltar la cabecera
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            // El separador es punto y coma (;)
            const parts = line.split(';');
            
            // Columna 0 = Codi, Columna 1 = Nom
            const codi = parts[0];
            const nom = parts[1];
            
            if (codi && nom) {
                docs.push({
                    _id: codi, // Usamos el código como ID para búsquedas rápidas
                    nom: nom.replace(/"/g, '').trim() // Limpiamos comillas si las hay
                });
            }
        }

        if (docs.length > 0) {
            console.log(`📦 Inserint ${docs.length} centres a la col·lecció 'centres_oficials'...`);
            
            // Borramos datos viejos para evitar duplicados y metemos los nuevos
            await collection.deleteMany({}); 
            await collection.insertMany(docs); // Insertamos todo de golpe
            
            console.log("✅ Importació completada amb èxit!");
        } else {
            console.log("⚠️ No s'han trobat dades al CSV.");
        }

    } catch (error) {
        console.error("❌ Error:", error.message);
        console.log("Assegura't que el fitxer 'totcat-centres-educatius.csv' està a la carpeta arrel.");
    } finally {
        process.exit();
    }
}

importar();