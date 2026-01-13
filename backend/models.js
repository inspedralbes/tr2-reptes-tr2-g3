const { ObjectId } = require('mongodb');
const { connectDB } = require('./db');

const ROLS = ['admin', 'centre', 'professor'];
const MODALITATS = ['A', 'B', 'C'];
// Definimos los estados posibles. Mapeamos 'rebutjada' para que no dé error.
const ESTATS_SOL = ['pendent', 'assignat', 'finalitzat', 'rebutjada'];

function validarEnum(valor, permitidos, campo) {
    if (!permitidos.includes(valor)) {
        throw new Error(` Error en '${campo}': Valor '${valor}' no válido.`);
    }
}

// --- CREAR USUARIO ---
async function createUsuari(data) {
    const db = await connectDB();
    validarEnum(data.rol, ROLS, 'rol');

    let usuariDoc = {
        email: data.email,
        password_hash: data.password_hash || "hash_simulado_123", 
        rol: data.rol,
        data_registre: new Date(),
        perfil: {} 
    };

    if (data.rol === 'centre') {
        usuariDoc.perfil = {
            codi_centre: data.codi_centre,
            nom_oficial: data.nom_oficial,
            adreça: data.adreça,
            municipi: data.municipi
        };
    } else if (data.rol === 'professor') {
        if (!data.centre_id) throw new Error("Un profesor debe tener centre_id");
        usuariDoc.centre_id = new ObjectId(data.centre_id); 
        usuariDoc.perfil = {
            nom: data.nom,
            departament: data.departament,
            disponibilitat: data.disponibilitat || []
        };
    }

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
        nom_centre: data.nom_centre || null, // Guardamos el nombre manual si existe
        estat: 'pendent',
        data_sollicitud: new Date(),
        alumnes_previstos: parseInt(data.alumnes_previstos),
        preferencies: {
            dia_preferit: data.dia_preferit,
            observacions: data.observacions
        },
        professors_assignats_ids: [], 
        checklist_seguiment: []
    };

    const result = await db.collection('sollicituds').insertOne(solicitudDoc);

    // Restar plazas
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

// ==========================================
//  FUNCIONES NUEVAS PARA EL ADMIN (FALTABAN)
// ==========================================

// 1. OBTENER TODAS (Para rellenar la tabla)
// EN models.js

async function getAllSolicitudes() {
    const db = await connectDB();
    
    return await db.collection('sollicituds').aggregate([
        // 1. Unir con la colección de usuarios (para sacar el código del centro)
        {
            $lookup: {
                from: 'usuaris',
                localField: 'centre_id',
                foreignField: '_id',
                as: 'usuario_info'
            }
        },
        { $unwind: { path: '$usuario_info', preserveNullAndEmptyArrays: true } },

        // 2. NUEVO: Unir con la lista oficial de centros (CSV) usando el código
        {
            $lookup: {
                from: 'centres_oficials',           // La colección que creamos con el script
                localField: 'usuario_info.perfil.codi_centre', // El código que tiene el usuario
                foreignField: '_id',                // El ID en la colección oficial (es el código)
                as: 'dades_oficials'
            }
        },
        { $unwind: { path: '$dades_oficials', preserveNullAndEmptyArrays: true } },
        
        // 3. Unir con talleres
        {
            $lookup: {
                from: 'tallers',
                localField: 'taller_id',
                foreignField: '_id',
                as: 'taller_info'
            }
        },
        { $unwind: { path: '$taller_info', preserveNullAndEmptyArrays: true } },
        
        // 4. Proyección final (Elegir qué nombre mostrar)
        {
            $project: {
                _id: 1,
                data_sollicitud: 1, 
                estat: 1,
                alumnes_previstos: 1,
                preferencies: 1,
                // AQUÍ ESTÁ LA MAGIA:
                // Si existe nombre en el Excel ('dades_oficials.nom'), úsalo.
                // Si existe nombre manual ('nom_centre'), úsalo con prioridad.
                // Si no, usa el del registro ('usuario_info...').
                // Si no, pon "Desconegut".
                centre_id: { 
                    perfil: {
                        nom_oficial: { 
                            $ifNull: ['$dades_oficials.nom', '$usuario_info.perfil.nom_oficial', 'Institut Desconegut'] 
                            $ifNull: ['$nom_centre', '$dades_oficials.nom', '$usuario_info.perfil.nom_oficial', 'Institut Desconegut'] 
                        },
                        codi_centre: '$usuario_info.perfil.codi_centre',
                        municipi: '$usuario_info.perfil.municipi'
                    },
                    email: '$usuario_info.email'
                },
                taller_id: { 
                    $ifNull: ['$taller_info', { nom: 'Taller Eliminat' }] 
                }
            }
        },
        { $sort: { data_sollicitud: -1 } }
    ]).toArray();
}

// 2. ACTUALIZAR ESTADO (Aceptar/Rechazar)
async function updateEstatSolicitud(id, nuevoEstado) {
    const db = await connectDB();
    validarEnum(nuevoEstado, ESTATS_SOL, 'estat');

    const solicitud = await db.collection('sollicituds').findOne({ _id: new ObjectId(id) });
    if (!solicitud) throw new Error("No existe la solicitud");

    // Si se rechaza, devolvemos las plazas al taller
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

// ¡IMPORTANTE!: Exportar las nuevas funciones
module.exports = { 
    createUsuari, 
    createTaller, 
    createSollicitud, 
    createValoracio,
    getAllSolicitudes,    // <--- Necesaria para ver la lista
    updateEstatSolicitud  // <--- Necesaria para los botones
};