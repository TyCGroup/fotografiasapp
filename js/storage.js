/* ===================================
   MÓDULO DE STORAGE - T&C GROUP
   Gestión de Firestore y localStorage
   =================================== */

import { app } from './firestore-config.js';
import { 
    getFirestore, 
    collection, 
    doc, 
    getDocs, 
    getDoc, 
    addDoc, 
    updateDoc, 
    deleteDoc,
    query,
    where,
    orderBy,
    Timestamp 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Inicializar Firestore
const db = getFirestore(app);

/* ===================================
   COLECCIONES
   =================================== */

const COLLECTIONS = {
    USUARIOS: 'usuarios',
    EVENTOS: 'eventos'
};

/* ===================================
   USUARIOS
   =================================== */

/**
 * Obtiene todos los usuarios activos
 * @returns {Promise<Array>}
 */
export async function getActiveUsers() {
    try {
        console.log('📥 Obteniendo usuarios activos...');
        
        const usuariosRef = collection(db, COLLECTIONS.USUARIOS);
        const q = query(usuariosRef, where('estado', '==', 'Activo'));
        const querySnapshot = await getDocs(q);
        
        const usuarios = [];
        querySnapshot.forEach((doc) => {
            usuarios.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log(`✅ ${usuarios.length} usuarios activos obtenidos`);
        return usuarios;
    } catch (error) {
        console.error('❌ Error al obtener usuarios:', error);
        // Retornar usuarios de prueba si falla Firestore
        return getLocalUsers();
    }
}

/**
 * Obtiene usuarios desde localStorage (fallback)
 * @returns {Array}
 */
function getLocalUsers() {
    const localUsers = localStorage.getItem('usuarios');
    if (localUsers) {
        return JSON.parse(localUsers);
    }
    
    // Usuarios de ejemplo por defecto
    const defaultUsers = [
        { id: '1', nombre: 'Juan Pérez', estado: 'Activo' },
        { id: '2', nombre: 'María García', estado: 'Activo' },
        { id: '3', nombre: 'Carlos López', estado: 'Activo' }
    ];
    
    localStorage.setItem('usuarios', JSON.stringify(defaultUsers));
    return defaultUsers;
}

/* ===================================
   EVENTOS
   =================================== */

/**
 * Crea un nuevo evento
 * @param {Object} eventData - Datos del evento
 * @returns {Promise<string>} - ID del evento creado
 */
export async function createEvent(eventData) {
    try {
        console.log('💾 Creando evento...', eventData);
        
        const evento = {
            nombre: eventData.nombre,
            responsableId: eventData.responsableId,
            responsableNombre: eventData.responsableNombre,
            categorias: eventData.categorias || [],
            fotos: [],
            fechaCreacion: Timestamp.now(),
            fechaModificacion: Timestamp.now()
        };
        
        const docRef = await addDoc(collection(db, COLLECTIONS.EVENTOS), evento);
        
        console.log('✅ Evento creado con ID:', docRef.id);
        
        // También guardar en localStorage como respaldo
        saveEventToLocalStorage({ id: docRef.id, ...evento });
        
        return docRef.id;
    } catch (error) {
        console.error('❌ Error al crear evento:', error);
        // Si falla Firestore, guardar solo en localStorage
        return saveEventToLocalStorage(eventData);
    }
}

/**
 * Obtiene todos los eventos
 * @returns {Promise<Array>}
 */
export async function getAllEvents() {
    try {
        console.log('📥 Obteniendo eventos...');
        
        const eventosRef = collection(db, COLLECTIONS.EVENTOS);
        const q = query(eventosRef, orderBy('fechaCreacion', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const eventos = [];
        querySnapshot.forEach((doc) => {
            eventos.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log(`✅ ${eventos.length} eventos obtenidos`);
        
        // Guardar en localStorage como caché
        localStorage.setItem('userEvents', JSON.stringify(eventos));
        
        return eventos;
    } catch (error) {
        console.error('❌ Error al obtener eventos:', error);
        // Si falla, obtener de localStorage
        return getEventsFromLocalStorage();
    }
}

/**
 * Obtiene un evento por ID
 * @param {string} eventId - ID del evento
 * @returns {Promise<Object|null>}
 */
export async function getEventById(eventId) {
    try {
        console.log('📥 Obteniendo evento:', eventId);
        
        const docRef = doc(db, COLLECTIONS.EVENTOS, eventId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            console.log('✅ Evento encontrado');
            return {
                id: docSnap.id,
                ...docSnap.data()
            };
        } else {
            console.log('❌ Evento no encontrado');
            return null;
        }
    } catch (error) {
        console.error('❌ Error al obtener evento:', error);
        // Buscar en localStorage
        return getEventFromLocalStorage(eventId);
    }
}

/**
 * Actualiza un evento
 * @param {string} eventId - ID del evento
 * @param {Object} updates - Datos a actualizar
 * @returns {Promise<boolean>}
 */
export async function updateEvent(eventId, updates) {
    try {
        console.log('💾 Actualizando evento:', eventId);
        
        const docRef = doc(db, COLLECTIONS.EVENTOS, eventId);
        await updateDoc(docRef, {
            ...updates,
            fechaModificacion: Timestamp.now()
        });
        
        console.log('✅ Evento actualizado');
        
        // Actualizar en localStorage
        updateEventInLocalStorage(eventId, updates);
        
        return true;
    } catch (error) {
        console.error('❌ Error al actualizar evento:', error);
        // Intentar actualizar solo en localStorage
        return updateEventInLocalStorage(eventId, updates);
    }
}

/**
 * Elimina un evento
 * @param {string} eventId - ID del evento
 * @returns {Promise<boolean>}
 */
export async function deleteEvent(eventId) {
    try {
        console.log('🗑️ Eliminando evento:', eventId);
        
        const docRef = doc(db, COLLECTIONS.EVENTOS, eventId);
        await deleteDoc(docRef);
        
        console.log('✅ Evento eliminado');
        
        // Eliminar de localStorage
        deleteEventFromLocalStorage(eventId);
        
        return true;
    } catch (error) {
        console.error('❌ Error al eliminar evento:', error);
        // Intentar eliminar solo de localStorage
        return deleteEventFromLocalStorage(eventId);
    }
}

/* ===================================
   FUNCIONES DE LOCALSTORAGE (FALLBACK)
   =================================== */

/**
 * Guarda un evento en localStorage
 * @param {Object} evento - Datos del evento
 * @returns {string} - ID del evento
 */
function saveEventToLocalStorage(evento) {
    const eventos = getEventsFromLocalStorage();
    
    if (!evento.id) {
        evento.id = `local-${Date.now()}`;
    }
    
    if (!evento.fechaCreacion) {
        evento.fechaCreacion = new Date().toISOString();
    }
    
    eventos.push(evento);
    localStorage.setItem('userEvents', JSON.stringify(eventos));
    
    return evento.id;
}

/**
 * Obtiene eventos desde localStorage
 * @returns {Array}
 */
function getEventsFromLocalStorage() {
    const eventos = localStorage.getItem('userEvents');
    return eventos ? JSON.parse(eventos) : [];
}

/**
 * Obtiene un evento específico de localStorage
 * @param {string} eventId - ID del evento
 * @returns {Object|null}
 */
function getEventFromLocalStorage(eventId) {
    const eventos = getEventsFromLocalStorage();
    return eventos.find(e => e.id === eventId) || null;
}

/**
 * Actualiza un evento en localStorage
 * @param {string} eventId - ID del evento
 * @param {Object} updates - Datos a actualizar
 * @returns {boolean}
 */
function updateEventInLocalStorage(eventId, updates) {
    const eventos = getEventsFromLocalStorage();
    const index = eventos.findIndex(e => e.id === eventId);
    
    if (index !== -1) {
        eventos[index] = {
            ...eventos[index],
            ...updates,
            fechaModificacion: new Date().toISOString()
        };
        localStorage.setItem('userEvents', JSON.stringify(eventos));
        return true;
    }
    
    return false;
}

/**
 * Elimina un evento de localStorage
 * @param {string} eventId - ID del evento
 * @returns {boolean}
 */
function deleteEventFromLocalStorage(eventId) {
    const eventos = getEventsFromLocalStorage();
    const filtered = eventos.filter(e => e.id !== eventId);
    
    if (filtered.length !== eventos.length) {
        localStorage.setItem('userEvents', JSON.stringify(filtered));
        return true;
    }
    
    return false;
}

/* ===================================
   EXPORTACIONES
   =================================== */

export {
    db,
    COLLECTIONS
};