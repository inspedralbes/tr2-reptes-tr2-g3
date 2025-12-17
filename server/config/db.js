const { MongoClient } = require('mongodb');

const url = 'mongodb+srv://a24matnegcar:PtF1HL6TuS2BmmOq@proyectodam.fzutqex.mongodb.net/?appName=ProyectoDAM';
const dbName = 'enginybd'; 

let db = null;

async function connectDB() {
    if (db) return db;
    try {
        const client = new MongoClient(url);
        await client.connect();
        console.log('Conectado a la Base de Datos');
        db = client.db(dbName);
        return db;
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

module.exports = { connectDB };