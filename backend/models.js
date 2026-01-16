const { ObjectId } = require('mongodb');
const { connectDB } = require('./db');

const ROLS = ['admin', 'centre', 'professor'];
const MODALITATS = ['A', 'B', 'C'];
const ESTATS_SOL = ['pendent', 'assignat', 'finalitzat', 'rebutjada'];

function validarEnum(valor, permitidos, campo) {
    if (!permitidos.includes(valor)) {
        throw new Error(`Error en '${campo}': Valor '${valor}' no válido.`);
    }
}

// ---------------------------------------------------------
// SECCIÓ 1: CREACIÓ (CRUD: CREATE)
// ---------------------------------------------------------

async function createUsuari(data) {
    const db = await connectDB();
    validarEnum(data.rol, ROLS, 'rol');

    let usuariDoc = {
        email: data.email,
        password_hash: data.password_hash || "hash_simulado_123",
        rol: data.rol,
        data_registre: new Date(),
        perfil: {} // Polimorfisme: estructura variable segons el rol
    };

    const datosOrigen = data.perfil || data; 

    if (data.rol === 'centre') {
        usuariDoc.perfil = {
            codi_centre: datosOrigen.codi_centre,
            nom_oficial: datosOrigen.nom_oficial,
            adreça: datosOrigen.adreça,
            municipi: datosOrigen.municipi
        };
    } else if (data.rol === 'professor') {
        if (!data.centre_id) throw new Error("Un profesor debe tener centre_id");
        usuariDoc.centre_id = new ObjectId(data.centre_id);
        
        usuariDoc.perfil = {
            nom: datosOrigen.nom,
            departament: datosOrigen.departament,
            disponibilitat: datosOrigen.disponibilitat || []
        };
    }

    const result = await db.collection('usuaris').insertOne(usuariDoc);
    return result.insertedId;
}

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
        // [CHECKLIST] 2. Model: Objectes imbricats i configuracions variables
        detalls_tecnics: data.detalls_tecnics || {} 
    };

    const result = await db.collection('tallers').insertOne(tallerDoc);
    return result.insertedId;
}

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
        checklist_seguiment: [] // Array dinàmic per al seguiment
    };

    const result = await db.collection('sollicituds').insertOne(solicitudDoc);

    // [CHECKLIST] 3. CRUD: Operació atòmica $inc per evitar Race Conditions
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

// ---------------------------------------------------------
// SECCIÓ 2: LECTURA I JOINS (CRUD: READ)
// ---------------------------------------------------------

async function getAllSolicitudes() {
    const db = await connectDB();
    // [CHECKLIST] 5. Agregacions: Utilització de pipelines amb $lookup (Joins)
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
                checklist_seguiment: 1, // Important per veure l'array
                centre_info: {
                    nom_oficial: { 
                        $ifNull: [
                            '$dades_oficials.nom', 
                            '$usuario_info.perfil.nom_oficial', 
                            "Centre Desconegut"
                        ] 
                    },
                    codi: '$codi_centre',
                    email: '$usuario_info.email'
                },
                taller_nom: '$taller_info.nom'
            }
        },
        { $sort: { data_solicitud: -1 } }
    ]).toArray();
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
                modalitat: 1,
                places_disponibles: 1,
                places_totals: 1,
                nom_institut: { $ifNull: ['$info_centre.nom', 'Institut Públic'] }
            }
        }
    ]).toArray();
}

// ---------------------------------------------------------
// SECCIÓ 3: ACTUALITZACIÓ I ARRAYS (CRUD: UPDATE)
// ---------------------------------------------------------

async function updateEstatSolicitud(id, nuevoEstado) {
    const db = await connectDB();
    validarEnum(nuevoEstado, ESTATS_SOL, 'estat');

    const solicitud = await db.collection('sollicituds').findOne({ _id: new ObjectId(id) });
    if (!solicitud) throw new Error("No existe la solicitud");

    // Si es rebutja, tornem les places
    if (nuevoEstado === 'rebutjada' && solicitud.estat !== 'rebutjada') {
        await db.collection('tallers').updateOne(
            { _id: solicitud.taller_id },
            { $inc: { places_disponibles: solicitud.alumnes_previstos } }
        );
    }

    return await db.collection('sollicituds').updateOne(
        { _id: new ObjectId(id) },
        { $set: { estat: nuevoEstado } }
    );
}

// [CHECKLIST] 3. CRUD: $push per afegir a array
async function addPasChecklist(sollicitudId, pas, responsable) {
    const db = await connectDB();
    return await db.collection('sollicituds').updateOne(
        { _id: new ObjectId(sollicitudId) },
        { 
            $push: { 
                checklist_seguiment: { 
                    pas_nom: pas, 
                    data_completat: new Date(), 
                    fet: true,
                    responsable: responsable 
                } 
            } 
        }
    );
}

// ---------------------------------------------------------
// SECCIÓ 4: ESBORRAT (CRUD: DELETE) - REQUISIT FALTANT
// ---------------------------------------------------------

// [CHECKLIST] 3. CRUD: deleteOne amb verificacions prèvies
async function deleteSollicitud(id) {
    const db = await connectDB();
    const objectId = new ObjectId(id);

    // 1. Verificació
    const solicitud = await db.collection('sollicituds').findOne({ _id: objectId });
    if (!solicitud) throw new Error("Sol·licitud no trobada");
    if (solicitud.estat === 'finalitzat') throw new Error("No es pot esborrar una sol·licitud ja finalitzada.");

    // 2. Retorn de places si la sol·licitud ocupava lloc
    if (sollicitud.estat === 'pendent' || solicitud.estat === 'assignat') {
        await db.collection('tallers').updateOne(
            { _id: solicitud.taller_id },
            { $inc: { places_disponibles: solicitud.alumnes_previstos } }
        );
    }

    // 3. Esborrat real
    return await db.collection('sollicituds').deleteOne({ _id: objectId });
}

// ---------------------------------------------------------
// SECCIÓ 5: CONSULTES AVANÇADES I ESTADÍSTIQUES
// ---------------------------------------------------------

// [CHECKLIST] 4. Consultes Avançades: $elemMatch i Dot Notation
async function getSolicitudsAmbPasCompletat(nomPas) {
    const db = await connectDB();
    return await db.collection('sollicituds').find({
        checklist_seguiment: {
            $elemMatch: {
                pas_nom: nomPas,
                fet: true
            }
        }
    }).toArray();
}

// [CHECKLIST] 5. Agregacions: Estadístiques per estat ($group + $sum)
async function getStatsSollicituds() {
    const db = await connectDB();
    return await db.collection('sollicituds').aggregate([
        {
            $group: {
                _id: "$estat", 
                total_sollicituds: { $sum: 1 },
                total_alumnes: { $sum: "$alumnes_previstos" }
            }
        }
    ]).toArray();
}

// [CHECKLIST] 5. Agregacions: Tallers més demandats (Complexa)
async function getTopTallers() {
    const db = await connectDB();
    return await db.collection('sollicituds').aggregate([
        {
            $group: {
                _id: "$taller_id",
                vegades_sollicitat: { $sum: 1 }
            }
        },
        { $sort: { vegades_sollicitat: -1 } }, // Ordena descendent
        { $limit: 3 }, // Top 3
        // Lookup per obtenir el nom del taller a partir de la ID agrupada
        {
            $lookup: {
                from: 'tallers',
                localField: '_id',
                foreignField: '_id',
                as: 'info'
            }
        },
        {
            $project: {
                nom_taller: { $arrayElemAt: ["$info.nom", 0] },
                vegades_sollicitat: 1
            }
        }
    ]).toArray();
}

module.exports = {
    createUsuari,
    createTaller,
    createSollicitud,
    createValoracio,
    getAllSolicitudes,
    getAllTallersWithNames,
    updateEstatSolicitud,
    addPasChecklist,       // NOU
    deleteSollicitud,      // NOU (Delete)
    getStatsSollicituds,   // NOU (Stats)
    getTopTallers,         // NOU (Stats)
    getSolicitudsAmbPasCompletat // NOU (Query array)
};