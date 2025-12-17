const { ObjectId } = require('mongodb');
const { connectDB } = require('./db');

const ROLS = ['admin', 'centre', 'professor'];
const MODALITATS = ['A', 'B', 'C'];
const ESTATS_SOL = ['pendent', 'assignat', 'finalitzat'];

function validarEnum(valor, permitidos, campo) {
    if (!permitidos.includes(valor)) {
        throw new Error(` Error en '${campo}': Valor '${valor}' no válido. Opciones: ${permitidos.join(', ')}`);
    }
}

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
            disponibilitat: data.disponibilitat || [] // Array de strings
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

async function createSollicitud(centreUserId, tallerId, data) {
    const db = await connectDB();
    
    const taller = await db.collection('tallers').findOne({ _id: new ObjectId(tallerId) });
    if (taller.places_disponibles <= 0) {
        throw new Error("No quedan plazas disponibles en este taller.");
    }

    const solicitudDoc = {
        centre_id: new ObjectId(centreUserId), 
        taller_id: new ObjectId(tallerId),
        estat: 'pendent',
        data_sollicitud: new Date(),
        alumnes_previstos: data.alumnes_previstos,
        preferencies: {
            dia_preferit: data.dia_preferit,
            observacions: data.observacions
        },
        professors_assignats_ids: [], 
        checklist_seguiment: [
            { pas: "Confirmació assignació", completat: false, data: null },
            { pas: "Autorització sortida", completat: false, evidencies: [] }
        ]
    };

    const result = await db.collection('sollicituds').insertOne(solicitudDoc);

    await db.collection('tallers').updateOne(
        { _id: new ObjectId(tallerId) },
        { $inc: { places_disponibles: -1 } }
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