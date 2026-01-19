const { ObjectId } = require('mongodb');
const { connectDB } = require('./db');
const bcrypt = require('bcrypt');

const ROLS = ['admin', 'centre', 'professor'];
const MODALITATS = ['A', 'B', 'C'];
const ESTATS_SOL = ['pendent', 'assignat', 'finalitzat', 'rebutjada'];

function validarEnum(valor, permitidos, campo) {
    if (!permitidos.includes(valor)) {
        throw new Error(` Error en '${campo}': Valor '${valor}' no válido.`);
    }
}

// --- VALIDAR LOGIN (SIMPLE) ---
async function validarLogin(email, passwordInput) {
    const db = await connectDB();
    const user = await db.collection('usuaris').findOne({ email: email });

    if (!user) return null; 

    // Compara lo que escribe el usuario con lo guardado por el Admin
    const match = await bcrypt.compare(passwordInput, user.password_hash);
    if (match) {
        return user;
    }
    return null; 
}

// --- CREAR USUARIO (AJUSTADO AL PANEL ADMIN) ---
async function createUsuari(data) {
    const db = await connectDB();
    
    // 1. Validamos el Rol
    validarEnum(data.rol, ROLS, 'rol');

    // 2. Preparamos el documento base
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(data.password_hash || "123456", salt);

    let usuariDoc = {
        email: data.email,
        // Tu formulario Vue envía 'password_hash' (con la clave del input). Lo guardamos tal cual.
        password_hash: password_hash, 
        rol: data.rol,
        data_registre: new Date(),
        // Tu formulario Vue YA envía el perfil montado, así que lo usamos directo
        perfil: data.perfil || {} 
    };

    // 3. Caso especial: Profesor necesita centre_id
    if (data.rol === 'professor') {
        if (!data.centre_id) throw new Error("Un profesor debe tener centre_id");
        // Convertimos el string que envía Vue a ObjectId de Mongo
        usuariDoc.centre_id = new ObjectId(data.centre_id);
    }

    // 4. Insertar en BDD
    const result = await db.collection('usuaris').insertOne(usuariDoc);
    return result.insertedId;
}

// --- CREAR TALLER ---
async function createTaller(data) {
    const db = await connectDB();
    validarEnum(data.modalitat, MODALITATS, 'modalitat');

    const tallerDoc = {
        codi: data.codi,
        nom: data.nom,
        imatge: data.imatge || "",
        modalitat: data.modalitat,
        descripcio: data.descripcio,
        places_totals: parseInt(data.places_totals),
        places_disponibles: parseInt(data.places_totals),
        actiu: true,
        detalls_tecnics: data.detalls_tecnics || {}
    };

    const result = await db.collection('tallers').insertOne(tallerDoc);
    return result.insertedId;
}

// --- CREAR SOLICITUD ---
async function createSollicitud(centreUserId, tallerId, data) {
    const db = await connectDB();

    const taller = await db.collection('tallers').findOne({ _id: new ObjectId(tallerId) });
    if (!taller) throw new Error("Taller no encontrado");

    if (taller.places_disponibles < parseInt(data.alumnes_previstos)) {
        throw new Error("No quedan plazas disponibles.");
    }

    const solicitudDoc = {
        centre_id: new ObjectId(centreUserId),
        taller_id: new ObjectId(tallerId),
        estat: 'pendent',
        data_solicitud: new Date(),
        codi_centre: data.codi_centre ? String(data.codi_centre).trim().padStart(8, '0') : null,
        alumnes_previstos: parseInt(data.alumnes_previstos),
        preferencies: {
            dia_preferit: data.dia_preferit,
            observacions: data.observacions
        },
        professors_assignats_ids: [],
        checklist_seguiment: []
    };

    const result = await db.collection('sollicituds').insertOne(solicitudDoc);

    await db.collection('tallers').updateOne(
        { _id: new ObjectId(tallerId) },
        { $inc: { places_disponibles: -parseInt(data.alumnes_previstos) } }
    );

    return result.insertedId;
}

async function createValoracio(sollicitudId, tallerId, tipoUsuario, respostes) {
    const db = await connectDB();
    const valoracioDoc = {
        sollicitud_id: new ObjectId(sollicitudId),
        taller_id: new ObjectId(tallerId),
        tipus_usuari: tipoUsuario,
        data: new Date(),
        respostes: respostes
    };
    return await db.collection('valoracions').insertOne(valoracioDoc);
}

// --- GET ALL SOLICITUDES ---
async function getAllSolicitudes() {
    const db = await connectDB();
    return await db.collection('sollicituds').aggregate([
        {
            $lookup: {
                from: 'usuaris',
                localField: 'centre_id',
                foreignField: '_id',
                as: 'usuario_info'
            }
        },
        { $unwind: { path: '$usuario_info', preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: 'centres_oficials',
                localField: 'codi_centre', 
                foreignField: '_id',      
                as: 'dades_oficials'
            }
        },
        { $unwind: { path: '$dades_oficials', preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: 'tallers',
                localField: 'taller_id',
                foreignField: '_id',
                as: 'taller_info'
            }
        },
        { $unwind: { path: '$taller_info', preserveNullAndEmptyArrays: true } },
        {
            $project: {
                _id: 1,
                data_solicitud: 1, 
                estat: 1,
                alumnes_previstos: 1,
                preferencies: 1,
                centre_info: {
                    nom_oficial: { 
                        $ifNull: [
                            '$dades_oficials.nom', 
                            '$usuario_info.perfil.nom_oficial', 
                            { $concat: ["Institut Desconegut (", { $ifNull: ["$codi_centre", "Sense Codi"] }, ")"] }
                        ] 
                    },
                    codi: '$codi_centre',
                    email: '$usuario_info.email'
                },
                taller_id: {
                    $ifNull: ['$taller_info', { nom: 'Taller Eliminat' }]
                }
            }
        },
        { $sort: { data_solicitud: -1 } }
    ]).toArray();
}

async function updateEstatSolicitud(id, nuevoEstado) {
    const db = await connectDB();
    validarEnum(nuevoEstado, ESTATS_SOL, 'estat');

    const solicitud = await db.collection('sollicituds').findOne({ _id: new ObjectId(id) });
    if (!solicitud) throw new Error("No existe la solicitud");

    if (nuevoEstado === 'rebutjada' && solicitud.estat !== 'rebutjada') {
        await db.collection('tallers').updateOne(
            { _id: solicitud.taller_id },
            { $inc: { places_disponibles: solicitud.alumnes_previstos } }
        );
    }

    const result = await db.collection('sollicituds').updateOne(
        { _id: new ObjectId(id) },
        { $set: { estat: nuevoEstado } }
    );
    return result;
}

async function getAllTallersWithNames() {
    const db = await connectDB();
    return await db.collection('tallers').aggregate([
        {
            $lookup: {
                from: 'centres_oficials',
                localField: 'centre_codi_oficial',
                foreignField: '_id',
                as: 'info_centre'
            }
        },
        { $unwind: { path: '$info_centre', preserveNullAndEmptyArrays: true } },
        {
            $project: {
                _id: 1,
                codi: 1,
                nom: 1,
                imatge: 1,
                modalitat: 1,
                descripcio: 1,
                places_disponibles: 1,
                places_totals: 1,
                detalls_tecnics: 1,
                nom_institut: { $ifNull: ['$info_centre.nom', 'Institut Públic'] }
            }
        }
    ]).toArray();
}

module.exports = {
    validarLogin, // <--- IMPORTANTE: ESTO NUEVO
    createUsuari,
    createTaller,
    createSollicitud,
    createValoracio,
    getAllSolicitudes,
    updateEstatSolicitud,
    getAllTallersWithNames
};