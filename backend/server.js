const express = require('express');
const cors = require('cors');
const { connectDB } = require('./db');
const { ObjectId } = require('mongodb');
const { createTaller, createSollicitud } = require('./models');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use(async (req, res, next) => {
    req.user = { 
        _id: '65a1b2c3d4e5f67890123456', 
        rol: 'centre',
        nom: 'Institut Test'
    };
    next();
});

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

app.listen(PORT, () => {
    console.log(`Servidor API escoltant a http://localhost:${PORT}`);
});