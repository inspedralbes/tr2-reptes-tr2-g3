// importar_centres.js
const fs = require('fs');
const { connectDB } = require('./db'); // Usamos tu conexión existente

async function importar() {
    console.log("Connectant a la base de dades...");
    const db = await connectDB();
    const collection = db.collection('centres_oficials');

    console.log("Llegint fitxer CSV...");
    try {
        const data = fs.readFileSync('totcat-centres-educatius.csv', 'utf8');
        const lines = data.split(/\r?\n/); // Dividir por líneas
        
        const docs = [];
        
        // Empezamos en i=1 para saltar la cabecera
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            // El separador es punto y coma (;)
            let parts = line.split(';');
            
            // Si no encuentra columnas con ';', prueba con coma ','
            if (parts.length < 2) {
                parts = line.split(',');
            }
            
            // Columna 0 = Codi, Columna 1 = Nom
            const rawCodi = parts[0] ? parts[0].replace(/["']/g, '').trim() : '';
            const rawNom = parts[1] ? parts[1].replace(/["']/g, '').trim() : '';
            
            if (rawCodi && rawNom) {
                // Aseguramos que el código tenga 8 dígitos (ej: "80123" -> "00080123")
                const codi = rawCodi.padStart(8, '0');
                docs.push({ _id: codi, nom: rawNom });
            }
        }

        if (docs.length > 0) {
            console.log(`Inserint ${docs.length} centres a la col·lecció 'centres_oficials'...`);
            console.log(`Exemple del primer centre importat: ID="${docs[0]._id}" NOM="${docs[0].nom}"`);
            
            // Borramos datos viejos para evitar duplicados y metemos los nuevos
            await collection.deleteMany({}); 
            await collection.insertMany(docs); // Insertamos todo de golpe
            
            console.log("Importació completada amb èxit!");
        } else {
            console.log("No s'han trobat dades al CSV.");
        }

    } catch (error) {
        console.error("Error:", error.message);
        console.log("Assegura't que el fitxer 'totcat-centres-educatius.csv' està a la carpeta arrel.");
    } finally {
        process.exit();
    }
}

importar();