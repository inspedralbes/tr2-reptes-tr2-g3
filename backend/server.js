const express = require('express');
const cors = require('cors');
const { connectDB } = require('./db');
const { ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
// Importamos todas las funciones del modelo
const { 
    createTaller, 
    createSollicitud, 
    getAllSolicitudes,
    updateEstatSolicitud,
    createUsuari,          // <--- Importado
    validarLogin,          // <--- Importado (NUEVO)
    getAllTallersWithNames 
} = require('./models');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// 1. RUTA LOGIN
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(`Intento de login: ${email}`);

        // Usamos la función simple (sin encriptar) que definimos en models.js
        const user = await validarLogin(email, password);

        if (user) {
            res.json({
                success: true,
                message: "Login correcto",
                user: {
                    _id: user._id,
                    email: user.email,
                    rol: user.rol,
                    perfil: user.perfil
                }
            });
        } else {
            res.status(401).json({ error: "Usuario o contraseña incorrectos" });
        }
    } catch (error) {
        console.error("Error en login:", error);
        res.status(500).json({ error: "Error del servidor" });
    }
});

// server.js (Verificación rápida)

// ...

// Esta ruta es la que usa tu formulario Vue
app.post('/api/usuaris', async (req, res) => {
    try {
        console.log("Recibiendo datos de Admin:", req.body); // Verás los datos en la consola
        const id = await createUsuari(req.body);
        res.status(201).json({ message: 'Usuari creat correctament', id });
    } catch (error) {
        console.error("Error creando usuario:", error);
        res.status(400).json({ error: error.message });
    }
});



// ==========================================
// RUTAS DE TALLERES
// ==========================================

app.get('/api/tallers', async (req, res) => {
    try {
        // Usamos la función que trae los nombres de los centros
        const tallers = await getAllTallersWithNames();
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
        res.status(500).json({ error: 'Error del servidor' });
    }
});

app.post('/api/tallers', async (req, res) => {
    try {
        console.log("Rebuda petició per crear taller:", req.body);
        const id = await createTaller(req.body);
        console.log(`Taller creat correctament. ID: ${id}`);
        res.status(201).json({ message: 'Taller creat', id });
    } catch (error) {
        console.error("Error creant taller:", error);
        res.status(400).json({ error: error.message });
    }
});


// ==========================================
// RUTAS DE SOLICITUDES
// ==========================================

app.get('/api/solicituds', async (req, res) => {
    try {
        const solicitudes = await getAllSolicitudes();
        res.json(solicitudes);
    } catch (error) {
        console.error("Error al obtener solicitudes:", error);
        res.status(500).json({ error: 'Error al obtener datos' });
    }
});

app.post('/api/solicituds', async (req, res) => {
    try {
        console.log("Nueva solicitud:", req.body);
        const userId = req.body.userId || '65a1b2c3d4e5f67890123456';

            const { taller_id, alumnes_previstos, dia_preferit, observacions, codi_centre, relevancia } = req.body;

            if (!taller_id || !alumnes_previstos) {
                return res.status(400).json({ error: "Falten dades obligatòries" });
            }

            const id = await createSollicitud(userId, taller_id, {
                alumnes_previstos,
                dia_preferit,
                observacions,
                codi_centre,
                relevancia // forward frontend selection so models can store it
            });

        res.status(201).json({ message: 'Sol·licitud creada correctament', id });

    } catch (error) {
        console.error("Error creant sol·licitud:", error.message);
        res.status(400).json({ error: error.message });
    }
});

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

// ==========================================
// RUTAS DE GESTIÓN DE PROFESORS (NUEVO)
// ==========================================

app.get('/api/professors', async (req, res) => {
    try {
        const db = await connectDB();
        // Obtenemos usuarios con rol 'professor'
        const professors = await db.collection('usuaris').find({ rol: 'professor' }).toArray();
        
        // Devolvemos solo datos necesarios (evitamos enviar passwords o datos sensibles)
        const sanitized = professors.map(p => ({ _id: p._id, nom: p.nom || p.email, email: p.email }));
        res.json(sanitized);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/solicituds/:id/professors', async (req, res) => {
    try {
        const db = await connectDB();
        const { professors } = req.body; // Array de IDs de profesores

        if (!Array.isArray(professors) || professors.length > 2) {
            return res.status(400).json({ error: "Màxim 2 professors per sol·licitud." });
        }

        await db.collection('sollicituds').updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: { professors_assignats_ids: professors } }
        );

        res.json({ message: "Professors assignats correctament" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// RUTAS DE CENTROS & DEBUG
// ==========================================

app.get('/api/centres/:codi', async (req, res) => {
    try {
        const db = await connectDB();
        // Buscamos por _id (si es el código) O por un campo 'codi' si existe
        const centre = await db.collection('centres_oficials').findOne({ 
            $or: [ { _id: req.params.codi }, { codi: req.params.codi } ] 
        });
        
        if (centre) {
            res.json(centre);
        } else {
            res.status(404).json({ message: 'Centre no trobat' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/debug/reset-solicituds', async (req, res) => {
    const db = await connectDB();
    await db.collection('sollicituds').deleteMany({});
    res.send("<h1>Historial esborrat</h1><p>Totes les sol·licituds s'han eliminat.</p>");
});

// Arrancar servidor
app.listen(PORT, () => {
    console.log(`Servidor API escoltant a http://localhost:${PORT}`);
});