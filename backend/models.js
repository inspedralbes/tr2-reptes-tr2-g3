const { ObjectId } = require('mongodb');
const { connectDB } = require('./db');
const bcrypt = require('bcryptjs');

const ROLS = ['admin', 'centre', 'professor', 'institut'];
const MODALITATS = ['A', 'B', 'C'];
const ESTATS_SOL = ['pendent', 'assignat', 'finalitzat', 'rebutjada'];

function validarEnum(valor, permitidos, campo) {
    if (!permitidos.includes(valor)) {
        throw new Error(`Error en '${campo}': Valor '${valor}' no válido.`);
    }
}

// --- VALIDAR LOGIN ---
async function validarLogin(email, passwordInput) {
    const db = await connectDB();
    const user = await db.collection('usuaris').findOne({ email: email });

    if (!user) return null; 

    const match = await bcrypt.compare(passwordInput, user.password);
    if (match) return user;
    return null; 
}

// --- CREAR USUARIO ---
async function createUsuari(data) {
    const db = await connectDB();
    
    const existe = await db.collection('usuaris').findOne({ email: data.email });
    if (existe) throw new Error("El email ya está registrado");

    const rol = data.rol || 'institut'; 
    validarEnum(rol, ROLS, 'rol');

    const rawPassword = data.password || "123456"; 
    const salt = await bcrypt.genSalt(10);
    const passwordEncrypted = await bcrypt.hash(rawPassword, salt);

    let usuariDoc = {
        email: data.email,
        password: passwordEncrypted,
        rol: rol,
        data_registre: new Date(),
        perfil: data.perfil || {} 
    };

    if (rol === 'professor') {
        if (!data.centre_id) throw new Error("Un profesor debe tener centre_id");
        if (typeof data.centre_id === 'string' && data.centre_id.length === 24 && /^[0-9a-fA-F]{24}$/.test(data.centre_id)) {
            usuariDoc.centre_id = new ObjectId(data.centre_id);
        } else {
            usuariDoc.centre_id = data.centre_id;
        }
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

// --- CREAR SOLICITUD (CORREGIDO) ---
async function createSollicitud(centreUserId, tallerId, data) {
    const db = await connectDB();

    const taller = await db.collection('tallers').findOne({ _id: new ObjectId(tallerId) });
    if (!taller) throw new Error("Taller no encontrado");

    // TIPO DE SOLICITUD: 'assistencia' (enviar alumnos) o 'acollida' (pedir ser sede)
    const tipusSolicitud = data.tipus || 'assistencia'; 

    // VALIDACIÓN ESPECÍFICA PARA ASISTENCIA (RESERVAR PLAZAS)
    if (tipusSolicitud === 'assistencia') {
        if (!taller.centre_codi_oficial) {
             throw new Error("Este taller es solo una plantilla. Debes solicitar 'Acollir el taller' en tu centro.");
        }
        if (taller.places_disponibles < parseInt(data.alumnes_previstos)) {
            throw new Error("No quedan plazas disponibles.");
        }
    }

    const solicitudDoc = {
        centre_id: new ObjectId(centreUserId),
        taller_id: new ObjectId(tallerId),
        tipus: tipusSolicitud, // <--- GUARDAMOS EL TIPO
        estat: 'pendent',
        data_solicitud: new Date(),
        codi_centre: data.codi_centre ? String(data.codi_centre).trim().padStart(8, '0') : null,
        
        // Datos comunes
        preferencies: {
            dia_preferit: data.dia_preferit,
            observacions: data.observacions,
            relevancia: data.relevancia || 'Normal'
        },
        professors_assignats_ids: [],
        checklist_seguiment: []
    };

    // DATOS ESPECÍFICOS SEGÚN TIPO
    if (tipusSolicitud === 'assistencia') {
        solicitudDoc.alumnes_previstos = parseInt(data.alumnes_previstos);
    } else {
        // Si es 'acollida', el centro dice cuánta capacidad tiene su sala
        solicitudDoc.capacitat_proposada = parseInt(data.capacitat_proposada);
        // NO restamos plazas del taller original, porque esto creará un taller nuevo en el futuro
    }

    const result = await db.collection('sollicituds').insertOne(solicitudDoc);

    // SOLO RESTAMOS PLAZAS SI ES ASISTENCIA A UN TALLER EXISTENTE
    if (tipusSolicitud === 'assistencia') {
        await db.collection('tallers').updateOne(
            { _id: new ObjectId(tallerId) },
            { $inc: { places_disponibles: -parseInt(data.alumnes_previstos) } }
        );
    }

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

// --- GET ALL SOLICITUDES (MEJORADO PARA NOMBRES) ---
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
                professors_assignats_ids: 1,
                assignacio_info: 1,
                centre_info: {
                    nom_oficial: { 
                        $ifNull: [
                            '$dades_oficials.nom',               // 1. Base oficial
                            '$usuario_info.perfil.nom_oficial',  // 2. Perfil tipo instituto
                            '$usuario_info.perfil.nom',          // 3. Perfil tipo profesor/admin
                            { $concat: ["Usuari (", { $ifNull: ["$usuario_info.email", "?"] }, ")"] }
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
                localField: 'centre_codi_oficial', // Campo que vincula con el centro anfitrión
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
                // Lógica para determinar si es un taller "Plantilla" o "Asignado"
                es_plantilla: { $cond: { if: { $ifNull: ['$info_centre', false] }, then: false, else: true } },
                nom_institut: { $ifNull: ['$info_centre.nom', 'Per determinar (Catàleg)'] },
                adreca_institut: { $ifNull: ['$info_centre.adreca', null] }, // <--- AQUI LA DIRECCIÓN
                municipi_institut: { $ifNull: ['$info_centre.municipi', null] }
            }
        }
    ]).toArray();
}
// ... (todo tu código anterior sigue igual)

// --- NUEVO: APP & EXCEL - OBTENER TALLERES ASIGNADOS A UN PROFE ---
// En models.js

async function getTallersByProfessor(profesorId) {
    const db = await connectDB();
    
    let idsBusqueda = [String(profesorId)];
    if (ObjectId.isValid(profesorId)) {
        idsBusqueda.push(new ObjectId(profesorId));
    }

    return await db.collection('sollicituds').aggregate([
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
                from: 'centres_oficials', // Asegúrate que tu colección se llama así
                localField: 'codi_centre', 
                foreignField: '_id', // Tu ejemplo muestra "_id": "08000013", así que esto debería cruzar bien
                as: 'centre_info'
            }
        },
        { $unwind: { path: '$centre_info', preserveNullAndEmptyArrays: true } },
        {
            $project: {
             _id: 1, 
             nom: '$taller_info.nom',
             imatge: '$taller_info.imatge',
                
                // --- AQUÍ ESTÁ EL CAMBIO IMPORTANTE DEL MAPA ---
                // Concatenamos: Nombre + Dirección (adreoa) + Municipio
                lloc: { 
                    $concat: [
                        { $ifNull: ['$centre_info.denominacio_completa', 'Centre desconegut'] }, 
                        ", ", 
                        { $ifNull: ['$centre_info.adreoa', ''] }, // Usamos tu campo 'adreoa'
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
}
// --- NUEVO: APP & EXCEL - GUARDAR ASISTENCIA ---
async function saveAssistencia(sollicitudId, llistaAlumnos) {
    const db = await connectDB();
    
    if (!ObjectId.isValid(sollicitudId)) {
        throw new Error("ID de sol·licitud no vàlid");
    }

    // llistaAlumnos es el array que sacamos del Excel o de la App
    const result = await db.collection('sollicituds').updateOne(
        { _id: new ObjectId(sollicitudId) },
        { $set: { llista_assistencia: llistaAlumnos } }
    );
    
    // Devolvemos el resultado para verificar en el server si se ha modificado algo
    return result;
}

// --- NUEVO: BORRAR ASISTENCIA ---
async function deleteAssistencia(sollicitudId) {
    const db = await connectDB();
    
    if (!ObjectId.isValid(sollicitudId)) {
        throw new Error("ID de sol·licitud no vàlid");
    }

    // Vaciamos el array llista_assistencia
    return await db.collection('sollicituds').updateOne(
        { _id: new ObjectId(sollicitudId) },
        { $set: { llista_assistencia: [] } }
    );
}

async function getConfig() {
    const db = await connectDB();
    const collection = db.collection('configuracio');
    let config = await collection.findOne({ _id: 'main_config' });

    if (!config) {
        console.log("No s'ha trobat configuració, creant una per defecte.");
        const defaultConfig = {
            _id: 'main_config',
            faseActual: 1, // Per defecte: Fase d'Inscripció
            data_creacio: new Date()
        };
        await collection.insertOne(defaultConfig);
        return defaultConfig;
    }
    return config;
}

async function updateFase(nuevaFase) {
    const db = await connectDB();
    const collection = db.collection('configuracio');
    
    const faseNum = parseInt(nuevaFase);
    if (isNaN(faseNum) || ![1, 2, 3].includes(faseNum)) {
        throw new Error("Fase no vàlida. Ha de ser 1, 2 o 3.");
    }

    return await collection.updateOne(
        { _id: 'main_config' },
        { $set: { faseActual: faseNum, data_modificacio: new Date() } },
        { upsert: true }
    );
}

// --- NUEVO: ELIMINAR TALLER (CON VERIFICACIÓN) ---
async function deleteTaller(tallerId) {
    const db = await connectDB();
    
    if (!ObjectId.isValid(tallerId)) {
        throw new Error("ID de taller no válido.");
    }
    const id = new ObjectId(tallerId);

    // Verificación previa: No eliminar si hay solicitudes asociadas
    const numSolicitudes = await db.collection('sollicituds').countDocuments({ taller_id: id });
    if (numSolicitudes > 0) {
        throw new Error(`No es pot eliminar el taller. Té ${numSolicitudes} sol·licitud(s) associada(s).`);
    }

    // Eliminar el taller
    const result = await db.collection('tallers').deleteOne({ _id: id });

    if (result.deletedCount === 0) {
        throw new Error("No s'ha trobat el taller per eliminar.");
    }

    return result;
}

// --- ACTUALIZAR EL EXPORT ---
module.exports = {
    validarLogin, 
    createUsuari,
    createTaller,
    createSollicitud,
    createValoracio,
    getAllSolicitudes,
    updateEstatSolicitud,
    getAllTallersWithNames,
    // AÑADE ESTAS DOS:
    getTallersByProfessor,
    saveAssistencia,
    deleteAssistencia,
    getConfig,
    updateFase,
    deleteTaller
};