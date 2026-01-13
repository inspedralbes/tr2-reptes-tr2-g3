const express = require('express');
const cors = require('cors');
const { connectDB } = require('./db');
const { ObjectId } = require('mongodb');

// Importamos funciones
const { 
    createTaller, 
    createSollicitud, 
    getAllSolicitudes,
    updateEstatSolicitud
} = require('./models');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Middleware de usuario simulado
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

// --- RUTAS DE SOLICITUDES (CORREGIDAS A UNA 'L') ---

// RUTA GET: /api/solicituds
app.get('/api/solicituds', async (req, res) => {
    try {
        console.log("--> Solicitando lista de solicitudes..."); 
        const solicitudes = await getAllSolicitudes();
        console.log(`--> Enviando ${solicitudes.length} solicitudes al frontend.`);
        res.json(solicitudes);
    } catch (error) {
        console.error("Error al obtener solicitudes:", error);
        res.status(500).json({ error: 'Error al obtener datos' });
    }
});

// RUTA POST: /api/solicituds
app.post('/api/solicituds', async (req, res) => {
    try {
        console.log("Rebuda petició POST /api/solicituds:", req.body);
        const { taller_id, alumnes_previstos, dia_preferit, observacions, codi_centre } = req.body;

        if (!codi_centre) {
            console.warn("ALERTA: S'està creant una sol·licitud sense 'codi_centre'. Això provocarà 'Institut Desconegut'.");
        }

        if (!taller_id || !alumnes_previstos) {
            return res.status(400).json({ error: "Falten dades obligatòries" });
        }

        const id = await createSollicitud(req.user._id, taller_id, {
            alumnes_previstos,
            dia_preferit,
            observacions,
            codi_centre
        });

        res.status(201).json({ message: 'Sol·licitud creada correctament', id });

    } catch (error) {
        console.error("Error creant sol·licitud:", error.message);
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/centres/:codi', async (req, res) => {
    try {
        const db = await connectDB();
        // AÑADIDO: Aseguramos 8 dígitos (ej: "80123" -> "00080123") para coincidir con la BD
        const codi = req.params.codi.trim().padStart(8, '0');
        const centre = await db.collection('centres_oficials').findOne({ _id: codi });
        if (centre) res.json({ nom: centre.nom });
        else res.status(404).json({ error: 'Centre no trobat' });
    } catch (error) { res.status(500).json({ error: 'Error' }); }
});

// RUTA PUT: /api/solicituds/:id
app.put('/api/solicituds/:id', async (req, res) => {
    try {
        const { estat } = req.body;
        if (!estat) return res.status(400).json({ error: "Falta el nuevo estado" });

        await updateEstatSolicitud(req.params.id, estat);
        res.json({ message: `Estat actualitzat a ${estat}` });
    } catch (error) {
        console.error("Error actualizando estado:", error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/debug-data', async (req, res) => {
    const { connectDB } = require('./db');
    const db = await connectDB();
    
    const countCentros = await db.collection('centres_oficials').countDocuments();
    const unCentro = await db.collection('centres_oficials').findOne({});
    const unaSolicitud = await db.collection('sollicituds').findOne({}, { sort: { $natural: -1 } });
    
    res.json({
        total_centros_excel: countCentros,
        ejemplo_centro_excel: unCentro,
        ultima_solicitud: {
            id: unaSolicitud?._id,
            codi_guardado: unaSolicitud?.codi_centre,
            tipo_codi: typeof unaSolicitud?.codi_centre
        },
        coincide_tipo: unCentro && unaSolicitud ? (typeof unCentro._id === typeof unaSolicitud.codi_centre) : 'N/A'
    });
});

// --- RUTA EXTRA PARA LIMPIAR SOLICITUDES ANTIGUAS ---
app.get('/api/debug/reset-solicituds', async (req, res) => {
    const db = await connectDB();
    await db.collection('sollicituds').deleteMany({});
    console.log("Totes les sol·licituds han estat esborrades.");
    res.send("<h1>Historial esborrat</h1><p>Totes les sol·licituds antigues s'han eliminat. <br>Torna a la web i crea'n una de nova: ara hauria de sortir el nom del centre.</p>");
});

app.listen(PORT, () => {
    console.log(`Servidor API escoltant a http://localhost:${PORT}`);
});