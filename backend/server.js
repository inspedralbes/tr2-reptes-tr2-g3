const express = require('express');
const cors = require('cors');
const { connectDB } = require('./db');
const { ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer'); // Importar nodemailer
require('dotenv').config(); // Cargar variables de entorno

// --- CONFIGURACIÓ NODEMAILER ---
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    // Afegim opció per a entorns de desenvolupament amb certificats autofirmats
    tls: {
        rejectUnauthorized: false
    }
});
// --------------------------------

// Importamos TODAS las funciones del modelo (Asegúrate de que models.js tenga estas exportaciones)
const { 
    createTaller, 
    createSollicitud, 
    getAllSolicitudes,
    updateEstatSolicitud,
    createUsuari,          
    validarLogin,          
    getAllTallersWithNames,
    getTallersByProfessor, 
    saveAssistencia,
    deleteAssistencia        
} = require('./models');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Aumentado el límite por si subes Excels grandes

// ==========================================
// 1. AUTENTICACIÓN Y USUARIOS
// ==========================================

// RUTA LOGIN
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
                    // Si es profe, enviamos su centre_id o lo que necesites
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

// CREAR USUARIO
app.post('/api/usuaris', async (req, res) => {
    try {
        const id = await createUsuari(req.body);
        res.status(201).json({ message: 'Usuari creat correctament', id });
    } catch (error) {
        console.error("Error creando usuario:", error);
        res.status(400).json({ error: error.message });
    }
});

// OBTENER LISTA DE PROFESORES (Para asignar en el panel de admin)
app.get('/api/professors', async (req, res) => {
    try {
        const db = await connectDB();
        const professors = await db.collection('usuaris').find({ rol: 'professor' }).toArray();
        // Devolvemos datos limpios
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

// ==========================================
// 2. TALLERES
// ==========================================

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
        
        // Buscamos info del centro si la tiene
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

// ==========================================
// 3. SOLICITUDES
// ==========================================

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
        const userId = req.body.userId || '65a1b2c3d4e5f67890123456'; // Fallback ID
        const { taller_id, tipus, alumnes_previstos, capacitat_proposada } = req.body;

        // Validaciones básicas
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

// ASIGNAR PROFESORES A UNA SOLICITUD
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

        // --- LÒGICA D'ENVIAMENT DE CORREU ---
        try {
            // 1. Obtenir la sol·licitud per als detalls del taller
            const sollicitud = await db.collection('sollicituds').findOne({ _id: new ObjectId(req.params.id) });
            if (!sollicitud) {
                // Aquesta situació és improbable si l'actualització anterior va anar bé,
                // però ho mantenim per seguretat.
                console.error(`[EMAIL] Sol·licitud ${req.params.id} no trobada DESPRÉS d'actualitzar.`);
                // No retornem un error fatal, ja que l'assignació principal va funcionar.
                // Simplement registrem el problema i continuem.
            } else {
                // 2. Obtenir el nom del taller
                const taller = await db.collection('tallers').findOne({ _id: new ObjectId(sollicitud.taller_id) });
                const nomTaller = taller ? taller.nom : 'Taller desconegut';

                // 3. Iterar pels professors assignats i enviar correu a cadascun
                for (const professorId of professors) {
                    if (!ObjectId.isValid(professorId)) {
                        console.error(`[EMAIL] ID de professor invàlid: ${professorId}. No s'enviarà correu.`);
                        continue;
                    }

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
                                    <p>Pots consultar els detalls i gestionar l'assistència dels alumnes a través de la plataforma.</p>
                                    <hr>
                                    <p style="font-size: 0.9em; color: #555;">
                                        Aquest és un correu automàtic. Si us plau, no responguis a aquest missatge.
                                    </p>
                                </div>
                            `,
                        };

                        try {
                            await transporter.sendMail(mailOptions);
                            console.log(`[EMAIL] Correu de notificació enviat a ${professor.email} per al taller ${nomTaller}.`);
                        } catch (emailError) {
                            console.error(`[EMAIL] Error enviant correu a ${professor.email}:`, emailError);
                        }
                    } else {
                        console.warn(`[EMAIL] No s'ha trobat l'email del professor amb ID ${professorId} o l'usuari no existeix.`);
                    }
                }
            }
        } catch (emailLogicError) {
            // Si hi ha un error en la lògica d'enviament de correus,
            // no fem que la petició principal falli. Només ho registrem.
            console.error(`[EMAIL] Ha ocorregut un error greu en la lògica d'enviament de correus:`, emailLogicError);
        }
        // --- FINAL LÒGICA D'ENVIAMENT DE CORREU ---

        res.json({ message: "Professors i detalls assignats correctament" });
    } catch (error) {
        // Aquest error només captura errors de l'actualització de la base de dades, no dels correus.
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// 4. RUTAS APP / EXCEL (PROFESORES)  <--- ¡ESTO ES LO QUE TE FALTABA!
// ==========================================

// Obtener talleres asignados a un profesor concreto
app.get('/api/app/profesor/:id/tallers', async (req, res) => {
    try {
        const tallers = await getTallersByProfessor(req.params.id);
        res.json(tallers);
    } catch (error) {
        console.error("Error API App:", error);
        res.status(500).json({ error: error.message });
    }
});

// Guardar lista de asistencia (desde Excel o App)
app.post('/api/app/assistencia', async (req, res) => {
    try {
        const { sollicitud_id, llista } = req.body;
        
        console.log(`[API] Rebuda petició guardar assistència. ID: ${sollicitud_id}, Alumnes: ${llista?.length}`);

        if (!sollicitud_id || !llista) {
            return res.status(400).json({ error: "Falten dades (sollicitud_id o llista)" });
        }

        const result = await saveAssistencia(sollicitud_id, llista);
        
        if (result.matchedCount === 0) {
            console.error(`[ERROR] No s'ha trobat cap sol·licitud amb ID: ${sollicitud_id}`);
            // No devolvemos 404 estricto para no romper la UI si hay desincronización, pero avisamos
            return res.status(404).json({ error: "No s'ha trobat la sol·licitud. Comprova que el taller existeix." });
        }

        console.log(`[INFO] ÈXIT: S'ha actualitzat la sol·licitud ${sollicitud_id}`);
        console.log(`[INFO] MongoDB: Trobats=${result.matchedCount}, Modificats=${result.modifiedCount}`);
        console.log(`[INFO] Alumnes guardats: ${llista.length}`);
        
        res.json({ success: true, message: "Llistat guardat correctament" });
    } catch (error) {
        console.error("Error API Assistencia:", error);
        res.status(500).json({ error: error.message });
    }
});

// Borrar lista de asistencia
app.delete('/api/app/assistencia/:id', async (req, res) => {
    try {
        await deleteAssistencia(req.params.id);
        res.json({ success: true, message: "Llistat esborrat correctament" });
    } catch (error) {
        console.error("Error API Delete Assistencia:", error);
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// 5. CENTROS Y UTILIDADES
// ==========================================

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

// ARRANCAR SERVIDOR
app.listen(PORT, () => {
    console.log(`Servidor API escoltant a http://localhost:${PORT}`);
});