const express = require('express');
const cors = require('cors');
const { connectDB } = require('./db');
const { ObjectId } = require('mongodb');

// 1. IMPORTANTE: AÑADIMOS LAS NUEVAS FUNCIONES AQUÍ
const { 
    createTaller, 
    createSollicitud, 
    getAllSolicitudes,    // <--- Necesaria para ver la lista
    updateEstatSolicitud  // <--- Necesaria para cambiar estado
} = require('./models');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Middleware de usuario simulado (Asegúrate de que este ID existe en tu BD si quieres filtrar por él, 
// pero para el admin usaremos getAllSolicitudes que trae todo)
app.use(async (req, res, next) => {
    req.user = { 
        _id: '65a1b2c3d4e5f67890123456', 
        rol: 'centre',
        nom: 'Institut Test'
    };
    next();
});

// --- RUTAS DE TALLERES ---

app.get('/api/tallers', async (req, res) => {
    try {
        const db = await connectDB();
        const tallers = await db.collection('tallers').find({ actiu: true }).toArray();
        res.json(tallers);
    } catch (error) {
        res.status(500).json({ error: 'Error obtenint tallers' });
    }
});

app.get('/api/tallers/:id', async (req, res) => {
    try {
        const db = await connectDB();
        const id = req.params.id;
        const taller = await db.collection('tallers').findOne({ _id: new ObjectId(id) });
        if (!taller) return res.status(404).json({ error: 'Taller no trobat' });
        res.json(taller);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

app.post('/api/tallers', async (req, res) => {
    try {
        const id = await createTaller(req.body);
        res.status(201).json({ message: 'Taller creat', id });
    } catch (error) {
        console.error("Error creant taller:", error);
        res.status(400).json({ error: error.message });
    }
});

// --- RUTAS DE SOLICITUDES (AQUÍ FALTABAN COSAS) ---

// 2. NUEVA RUTA GET: Para llenar la tabla del administrador
app.get('/api/sollicituds', async (req, res) => {
    try {
        console.log("--> Solicitando lista de solicitudes..."); // Log para depurar
        const solicitudes = await getAllSolicitudes();
        console.log(`--> Enviando ${solicitudes.length} solicitudes al frontend.`);
        res.json(solicitudes);
    } catch (error) {
        console.error("Error al obtener solicitudes:", error);
        res.status(500).json({ error: 'Error al obtener datos' });
    }
});

// Ruta POST existente (Crear)
app.post('/api/sollicituds', async (req, res) => {
    try {
        const { taller_id, alumnes_previstos, dia_preferit, observacions } = req.body;

        if (!taller_id || !alumnes_previstos) {
            return res.status(400).json({ error: "Falten dades obligatòries" });
        }

        const id = await createSollicitud(req.user._id, taller_id, {
            alumnes_previstos,
            dia_preferit,
            observacions
        });

        res.status(201).json({ message: 'Sol·licitud creada correctament', id });

    } catch (error) {
        console.error("Error creant sol·licitud:", error.message);
        res.status(400).json({ error: error.message });
    }
});

// 3. NUEVA RUTA PUT: Para Aceptar o Rechazar solicitudes
app.put('/api/sollicituds/:id', async (req, res) => {
    try {
        const { estat } = req.body; // Esperamos { estat: 'assignat' } o 'rebutjada'
        if (!estat) return res.status(400).json({ error: "Falta el nuevo estado" });

        await updateEstatSolicitud(req.params.id, estat);
        res.json({ message: `Estat actualitzat a ${estat}` });
    } catch (error) {
        console.error("Error actualizando estado:", error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor API escoltant a http://localhost:${PORT}`);
});