// importar_centres.js
const fs = require('fs');
const { connectDB } = require('./db'); // Usamos tu conexión existente

async function importar() {
    console.log("Connectant a la base de dades...");
    const db = await connectDB();
    const collection = db.collection('centres_oficials');

    console.log("Llegint fitxer JSON...");
    try {
        const data = fs.readFileSync('centres.json', 'utf8');
        const docs = JSON.parse(data);

        if (docs.length > 0) {
            console.log(`Inserint ${docs.length} centres a la col·lecció 'centres_oficials'...`);
            console.log(`Exemple del primer centre importat: ID="${docs[0]._id}" NOM="${docs[0].denominacio_completa}"`);

            // Borramos datos viejos para evitar duplicados y metemos los nuevos
            await collection.deleteMany({});
            await collection.insertMany(docs); // Insertamos todo de golpe

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