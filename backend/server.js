const express = require('express');
const cors = require('cors');
const { connectDB } = require('./db');
const { ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer'); 
require('dotenv').config(); 

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_PORT === '465', 
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false
    }
});

const { 
    createTaller, 
    createSollicitud, 
    getAllSolicitudes,
    updateEstatSolicitud,
    createUsuari,          
    validarLogin,          
    getAllTallersWithNames,
    updateTallerFase
} = require('./models');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' })); 


app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(`Intento de login: ${email}`);

        const user = await validarLogin(email, password);

        if (user) {
            res.json({
                success: true,
                message: "Login correcto",
                user: {
                    _id: user._id,
                    email: user.email,
                    rol: user.rol,
                    perfil: user.perfil,
                    centre_id: user.centre_id 
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

app.post('/api/usuaris', async (req, res) => {
    try {
        const id = await createUsuari(req.body);
        res.status(201).json({ message: 'Usuari creat correctament', id });
    } catch (error) {
        console.error("Error creando usuario:", error);
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/professors', async (req, res) => {
    try {
        const db = await connectDB();

        const { centre_id, codi } = req.query;

        let filter = { rol: 'professor' };

        if (centre_id) {
            try {
                const oid = new ObjectId(centre_id);
                filter.centre_id = oid;
            } catch (e) {
                filter.centre_id = centre_id;
            }
        } else if (codi) {
            const centre = await db.collection('centres_oficials').findOne({ $or: [{ _id: codi }, { codi: codi }] });
            if (centre) {
                filter.centre_id = centre._id;
            } else {
                return res.json([]);
            }
        }

        const professors = await db.collection('usuaris').find(filter).toArray();
        const sanitized = professors.map(p => ({ 
            _id: p._id, 
            nom: p.perfil?.nom || p.email, 
            email: p.email 
        }));
        res.json(sanitized);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


app.get('/api/tallers', async (req, res) => {
    try {
        const tallers = await getAllTallersWithNames();
        res.json(tallers);
    } catch (error) {
        res.status(500).json({ error: 'Error obtenint tallers' });
    }
});

app.get('/api/tallers/:id', async (req, res) => {
    try {
        const db = await connectDB();
        const taller = await db.collection('tallers').findOne({ _id: new ObjectId(req.params.id) });
        if (!taller) return res.status(404).json({ error: 'Taller no trobat' });
        
        if (taller.centre_codi_oficial) {
             const centro = await db.collection('centres_oficials').findOne({ _id: taller.centre_codi_oficial });
             taller.info_centre = centro;
        }
        
        res.json(taller);
    } catch (error) {
        res.status(500).json({ error: 'Error del servidor' });
    }
});

app.post('/api/tallers', async (req, res) => {
    try {
        const id = await createTaller(req.body);
        res.status(201).json({ message: 'Taller creat', id });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});


app.get('/api/solicituds', async (req, res) => {
    try {
        const solicitudes = await getAllSolicitudes();
        res.json(solicitudes);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener datos' });
    }
});

app.post('/api/solicituds', async (req, res) => {
    try {
        const userId = req.body.userId || '65a1b2c3d4e5f67890123456'; 
        const { taller_id } = req.body;

        if (!taller_id) return res.status(400).json({ error: "Falta el ID del taller" });

        const id = await createSollicitud(userId, taller_id, req.body);
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
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/solicituds/:id/professors', async (req, res) => {
    try {
        const db = await connectDB();
        const { professors, info } = req.body; 

        if (!Array.isArray(professors) || professors.length > 2) {
            return res.status(400).json({ error: "Màxim 2 professors per sol·licitud." });
        }

        await db.collection('sollicituds').updateOne(
            { _id: new ObjectId(req.params.id) },
            { 
                $set: { 
                    professors_assignats_ids: professors,
                    assignacio_info: info || ""
                } 
            }
        );

        try {
            const sollicitud = await db.collection('sollicituds').findOne({ _id: new ObjectId(req.params.id) });
            if (sollicitud) {
                const taller = await db.collection('tallers').findOne({ _id: new ObjectId(sollicitud.taller_id) });
                const nomTaller = taller ? taller.nom : 'Taller desconegut';

                for (const professorId of professors) {
                    if (!ObjectId.isValid(professorId)) continue;

                    const professor = await db.collection('usuaris').findOne({ _id: new ObjectId(professorId) });

                    if (professor && professor.email) {
                        const professorName = professor.perfil?.nom || professor.email;
                        const mailOptions = {
                            from: `"Notificacions TR2" <${process.env.EMAIL_USER}>`,
                            to: professor.email,
                            subject: `✔️ Has estat assignat a un nou taller: ${nomTaller}`,
                            html: `
                                <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                                    <h2>Hola ${professorName},</h2>
                                    <p>T'informem que has estat assignat al taller <strong>"${nomTaller}"</strong>.</p>
                                    <p><strong>Detalls / Dies:</strong> ${info || 'Consultar a la plataforma'}</p>
                                    <p>Pots consultar els detalls i gestionar l'assistència dels alumnes a través de la plataforma.</p>
                                    <hr>
                                    <p style="font-size: 0.9em; color: #555;">Missatge automàtic.</p>
                                </div>
                            `,
                        };
                        await transporter.sendMail(mailOptions);
                        console.log(`[EMAIL] Enviat a ${professor.email}`);
                    }
                }
            }
        } catch (emailLogicError) {
            console.error(`[EMAIL] Error enviant correus:`, emailLogicError);
        }

        res.json({ message: "Professors i detalls assignats correctament" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


app.get('/api/app/profesor/:id/tallers', async (req, res) => {
    try {
        const db = await connectDB();
        const profesorId = req.params.id;
        
        let idsBusqueda = [String(profesorId)];
        if (ObjectId.isValid(profesorId)) {
            idsBusqueda.push(new ObjectId(profesorId));
        }

        const tallers = await db.collection('sollicituds').aggregate([
            { 
               $match: { 
                    professors_assignats_ids: { $in: idsBusqueda }
                }
            }, 
            {
                $lookup: {
                    from: 'tallers',
                    localField: 'taller_id',
                    foreignField: '_id',
                    as: 'taller_info'
                }
            },
            { $unwind: '$taller_info' },
            {
                $lookup: {
                    from: 'centres_oficials',
                    localField: 'codi_centre', 
                    foreignField: '_id',
                    as: 'centre_info'
                }
            },
            { $unwind: { path: '$centre_info', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                 _id: 1, 
                 nom: '$taller_info.nom',
                 imatge: '$taller_info.imatge',
                 lloc: { 
                    $concat: [
                        { $ifNull: ['$centre_info.denominacio_completa', 'Centre desconegut'] }, 
                        ", ", 
                        { $ifNull: ['$centre_info.adreca', ''] }, 
                        ", ", 
                        { $ifNull: ['$centre_info.nom_municipi', ''] }
                    ] 
                 },
                 data_solicitud: 1,
                 dia_preferit: '$preferencies.dia_preferit',
                 assignacio_info: 1,
                 alumnes_previstos: 1,
                 nomCentre: { $ifNull: ['$centre_info.denominacio_completa', '$codi_centre'] },
                 codi_centre: 1,
                 llista_assistencia: { $ifNull: ['$llista_assistencia', []] }
                }
            }
        ]).toArray();

        res.json(tallers);
    } catch (error) {
        console.error("Error API App:", error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/app/assistencia', async (req, res) => {
    try {
        const { sollicitud_id, llista } = req.body;
        console.log(`[API] Guardar assistència ID: ${sollicitud_id}`);

        if (!sollicitud_id || !llista) {
            return res.status(400).json({ error: "Falten dades" });
        }

        const db = await connectDB();
        const result = await db.collection('sollicituds').updateOne(
            { _id: new ObjectId(sollicitud_id) },
            { $set: { llista_assistencia: llista } }
        );
        
        res.json({ success: true, message: "Llistat guardat correctament" });
    } catch (error) {
        console.error("Error API Assistencia:", error);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/app/assistencia/:id', async (req, res) => {
    try {
        const db = await connectDB();
        await db.collection('sollicituds').updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: { llista_assistencia: [] } }
        );
        res.json({ success: true, message: "Llistat esborrat correctament" });
    } catch (error) {
        console.error("Error API Delete:", error);
        res.status(500).json({ error: error.message });
    }
});


app.put('/api/tallers/:id/fase', async (req, res) => {
    try {
        const { nuevaFase } = req.body;
        if (typeof nuevaFase === 'undefined') {
            return res.status(400).json({ error: "Falta el paràmetre 'nuevaFase'" });
        }
        await updateTallerFase(req.params.id, nuevaFase);
        res.json({ success: true, message: `Fase del taller actualitzada a ${nuevaFase}` });
    } catch (error) {
        console.error("Error actualitzant fase del taller:", error);
        res.status(400).json({ error: error.message });
    }
});


app.get('/api/centres/:codi', async (req, res) => {
    try {
        const db = await connectDB();
        const centre = await db.collection('centres_oficials').findOne({ 
            $or: [ { _id: req.params.codi }, { codi: req.params.codi } ] 
        });
        
        if (centre) res.json(centre);
        else res.status(404).json({ message: 'Centre no trobat' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/debug/reset-solicituds', async (req, res) => {
    const db = await connectDB();
    await db.collection('sollicituds').deleteMany({});
    res.send("<h1>Historial esborrat</h1><p>Totes les sol·licituds s'han eliminat.</p>");
});

app.listen(PORT, () => {
    console.log(`Servidor API escoltant a http://localhost:${PORT}`);
});