/* ===================================
   MÓDULO DE FOTOS - T&C GROUP
   Carga, compresión y gestión de fotos con Firebase Storage
   =================================== */

import { storage } from './firestore-config.js';
import { 
    ref, 
    uploadBytes, 
    getDownloadURL, 
    deleteObject 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';
import { generateId } from './utils.js';

/* ===================================
   CONFIGURACIÓN DE COMPRESIÓN
   =================================== */

const COMPRESSION_OPTIONS = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: 'image/jpeg'
};

/* ===================================
   FUNCIONES DE FIREBASE STORAGE
   =================================== */

/**
 * Sube una foto a Firebase Storage
 * @param {File} file - Archivo comprimido
 * @param {string} eventId - ID del evento
 * @param {string} photoId - ID de la foto
 * @returns {Promise<string>} - URL de descarga
 */
export async function uploadPhotoToStorage(file, eventId, photoId) {
    try {
        // Crear referencia en Storage: eventos/{eventId}/{photoId}.jpg
        const fileName = `${photoId}.jpg`;
        const storageRef = ref(storage, `eventos/${eventId}/${fileName}`);
        
        console.log(`☁️ Subiendo foto a Storage: ${fileName}`);
        
        // Subir archivo
        const snapshot = await uploadBytes(storageRef, file);
        
        // Obtener URL de descarga
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        console.log(`✅ Foto subida correctamente`);
        
        return downloadURL;
    } catch (error) {
        console.error('❌ Error al subir foto a Storage:', error);
        throw error;
    }
}

/**
 * Elimina una foto de Firebase Storage
 * @param {string} photoUrl - URL de la foto
 * @returns {Promise<boolean>}
 */
export async function deletePhotoFromStorage(photoUrl) {
    try {
        // Crear referencia desde la URL
        const storageRef = ref(storage, photoUrl);
        
        console.log(`🗑️ Eliminando foto de Storage...`);
        
        await deleteObject(storageRef);
        
        console.log(`✅ Foto eliminada de Storage`);
        return true;
    } catch (error) {
        console.error('❌ Error al eliminar foto de Storage:', error);
        // No lanzar error, la foto puede no existir
        return false;
    }
}

/* ===================================
   FUNCIONES DE CARGA DE FOTOS
   =================================== */

/**
 * Comprime una imagen
 * @param {File} file - Archivo de imagen
 * @returns {Promise<File>} - Archivo comprimido
 */
export async function compressImage(file) {
    try {
        // Usar browser-image-compression si está disponible
        if (window.imageCompression) {
            console.log(`📦 Comprimiendo imagen: ${file.name} (${formatBytes(file.size)})`);
            
            const compressedFile = await window.imageCompression(file, COMPRESSION_OPTIONS);
            
            console.log(`✅ Imagen comprimida: ${formatBytes(compressedFile.size)}`);
            return compressedFile;
        } else {
            console.warn('⚠️ Librería de compresión no disponible, usando imagen original');
            return file;
        }
    } catch (error) {
        console.error('❌ Error al comprimir imagen:', error);
        return file;
    }
}

/**
 * Convierte un archivo a Base64 (para preview temporal)
 * @param {File} file - Archivo a convertir
 * @returns {Promise<string>} - String Base64
 */
export function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Crea un objeto de foto y lo sube a Storage
 * @param {File} file - Archivo de imagen
 * @param {string} categoryId - ID de la categoría
 * @param {string} eventId - ID del evento
 * @returns {Promise<Object>} - Objeto de foto
 */
export async function createPhotoObject(file, categoryId, eventId) {
    const photoId = generateId();
    
    try {
        // Comprimir imagen
        const compressedFile = await compressImage(file);
        
        // Subir a Firebase Storage
        const downloadURL = await uploadPhotoToStorage(compressedFile, eventId, photoId);
        
        return {
            id: photoId,
            categoryId: categoryId,
            fileName: file.name,
            fileSize: compressedFile.size,
            fileType: compressedFile.type,
            url: downloadURL,
            storagePath: `eventos/${eventId}/${photoId}.jpg`,
            uploadedAt: new Date().toISOString()
        };
    } catch (error) {
        console.error('❌ Error al crear objeto de foto:', error);
        throw error;
    }
}

/**
 * Procesa múltiples archivos y los sube a Storage
 * @param {FileList} files - Lista de archivos
 * @param {string} categoryId - ID de la categoría
 * @param {string} eventId - ID del evento
 * @param {Function} onProgress - Callback de progreso
 * @returns {Promise<Array>} - Array de objetos de foto
 */
export async function processMultipleFiles(files, categoryId, eventId, onProgress = null) {
    const photos = [];
    const total = files.length;
    
    for (let i = 0; i < total; i++) {
        const file = files[i];
        
        // Validar que sea imagen
        if (!file.type.startsWith('image/')) {
            console.warn(`⚠️ Archivo ignorado (no es imagen): ${file.name}`);
            continue;
        }
        
        try {
            const photo = await createPhotoObject(file, categoryId, eventId);
            photos.push(photo);
            
            // Llamar callback de progreso
            if (onProgress) {
                onProgress(i + 1, total, photo);
            }
        } catch (error) {
            console.error(`❌ Error procesando ${file.name}:`, error);
            // Continuar con las demás fotos
        }
    }
    
    return photos;
}

/**
 * Valida un archivo de imagen
 * @param {File} file - Archivo a validar
 * @param {number} maxSizeMB - Tamaño máximo en MB
 * @returns {Object} - {valid: boolean, error: string}
 */
export function validateImageFile(file, maxSizeMB = 10) {
    // Validar tipo
    if (!file.type.startsWith('image/')) {
        return {
            valid: false,
            error: 'El archivo debe ser una imagen'
        };
    }
    
    // Validar tamaño
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
        return {
            valid: false,
            error: `La imagen no debe superar ${maxSizeMB}MB`
        };
    }
    
    return { valid: true, error: null };
}

/**
 * Toma una foto con la cámara
 * @returns {Promise<File>} - Archivo de la foto
 */
export async function capturePhoto() {
    return new Promise((resolve, reject) => {
        // Crear input file con capture
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment'; // Usar cámara trasera
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                resolve(file);
            } else {
                reject(new Error('No se capturó ninguna foto'));
            }
        };
        
        input.click();
    });
}

/**
 * Selecciona múltiples fotos de la galería
 * @returns {Promise<FileList>} - Lista de archivos
 */
export async function selectMultiplePhotos() {
    return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.multiple = true;
        
        input.onchange = (e) => {
            const files = e.target.files;
            if (files && files.length > 0) {
                resolve(files);
            } else {
                reject(new Error('No se seleccionaron fotos'));
            }
        };
        
        input.click();
    });
}

/* ===================================
   FUNCIONES AUXILIARES
   =================================== */

/**
 * Formatea bytes a formato legible
 * @param {number} bytes - Cantidad de bytes
 * @returns {string}
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Obtiene las dimensiones de una imagen
 * @param {string} url - URL de la imagen
 * @returns {Promise<Object>} - {width, height}
 */
export function getImageDimensions(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            resolve({ width: img.width, height: img.height });
        };
        img.onerror = reject;
        img.src = url;
    });
}

/**
 * Cuenta fotos por categoría
 * @param {Array} photos - Array de fotos
 * @param {string} categoryId - ID de la categoría
 * @returns {number}
 */
export function countPhotosByCategory(photos, categoryId) {
    if (!photos || !Array.isArray(photos)) return 0;
    return photos.filter(photo => photo.categoryId === categoryId).length;
}

/**
 * Filtra fotos por categoría
 * @param {Array} photos - Array de fotos
 * @param {string} categoryId - ID de la categoría
 * @returns {Array}
 */
export function filterPhotosByCategory(photos, categoryId) {
    if (!photos || !Array.isArray(photos)) return [];
    return photos.filter(photo => photo.categoryId === categoryId);
}

/**
 * Obtiene fotos sin categoría
 * @param {Array} photos - Array de todas las fotos
 * @returns {Array} - Fotos sin categoría
 */
export function getUncategorizedPhotos(photos) {
    if (!photos || !Array.isArray(photos)) {
        return [];
    }
    
    return photos.filter(photo => !photo.categoryId);
}

/**
 * Agrupa fotos por categoría
 * @param {Array} photos - Array de todas las fotos
 * @param {Array} categories - Array de categorías
 * @returns {Object} - Objeto con categoryId como key y array de fotos como value
 */
export function groupPhotosByCategory(photos, categories) {
    const grouped = {};
    
    if (!categories || !Array.isArray(categories)) {
        return grouped;
    }
    
    categories.forEach(category => {
        grouped[category.id] = filterPhotosByCategory(photos, category.id);
    });
    
    // Agregar fotos sin categoría
    const uncategorized = getUncategorizedPhotos(photos);
    if (uncategorized.length > 0) {
        grouped['uncategorized'] = uncategorized;
    }
    
    return grouped;
}

/**
 * Elimina una foto del array y de Storage
 * @param {Array} photos - Array de fotos
 * @param {string} photoId - ID de la foto
 * @returns {Promise<Array>} - Array sin la foto eliminada
 */
export async function removePhotoById(photos, photoId) {
    const photo = photos.find(p => p.id === photoId);
    
    if (photo && photo.url) {
        // Eliminar de Storage
        await deletePhotoFromStorage(photo.url);
    }
    
    return photos.filter(p => p.id !== photoId);
}

/**
 * Calcula el tamaño total de las fotos
 * @param {Array} photos - Array de fotos
 * @returns {string} - Tamaño formateado
 */
export function getTotalPhotosSize(photos) {
    if (!photos || !Array.isArray(photos)) return '0 Bytes';
    
    const totalBytes = photos.reduce((sum, photo) => sum + (photo.fileSize || 0), 0);
    return formatBytes(totalBytes);
}

/**
 * Obtiene estadísticas de fotos
 * @param {Array} photos - Array de fotos
 * @returns {Object} - Estadísticas
 */
export function getPhotosStats(photos) {
    if (!photos || !Array.isArray(photos)) {
        return {
            total: 0,
            totalSize: '0 Bytes',
            byCategory: {}
        };
    }
    
    const byCategory = {};
    photos.forEach(photo => {
        if (!byCategory[photo.categoryId]) {
            byCategory[photo.categoryId] = 0;
        }
        byCategory[photo.categoryId]++;
    });
    
    return {
        total: photos.length,
        totalSize: getTotalPhotosSize(photos),
        byCategory: byCategory
    };
}

/* ===================================
   EXPORTACIONES
   =================================== */

export default {
    uploadPhotoToStorage,
    deletePhotoFromStorage,
    compressImage,
    fileToBase64,
    createPhotoObject,
    processMultipleFiles,
    validateImageFile,
    capturePhoto,
    selectMultiplePhotos,
    getImageDimensions,
    countPhotosByCategory,
    filterPhotosByCategory,
    getUncategorizedPhotos,
    groupPhotosByCategory,
    removePhotoById,
    getTotalPhotosSize,
    getPhotosStats
};