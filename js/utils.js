/* ===================================
   UTILIDADES GENERALES - T&C GROUP
   Funciones auxiliares reutilizables
   =================================== */

/**
 * Muestra un mensaje temporal al usuario
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de mensaje: 'success', 'error', 'info'
 * @param {number} duration - Duración en ms (default: 4000)
 */
export function showMessage(message, type = 'info', duration = 4000) {
    const container = document.getElementById('messageContainer');
    const content = document.getElementById('messageContent');
    
    if (!container || !content) return;
    
    // Configurar mensaje
    content.textContent = message;
    content.className = `message ${type}`;
    
    // Mostrar
    container.classList.remove('hidden');
    
    // Ocultar automáticamente
    setTimeout(() => {
        container.classList.add('hidden');
    }, duration);
}

/**
 * Muestra/oculta el spinner de carga en un botón
 * @param {HTMLElement} button - Botón
 * @param {HTMLElement} textElement - Elemento del texto
 * @param {HTMLElement} spinnerElement - Elemento del spinner
 * @param {boolean} loading - Estado de carga
 */
export function toggleButtonLoading(button, textElement, spinnerElement, loading) {
    if (loading) {
        button.disabled = true;
        textElement.classList.add('hidden');
        spinnerElement.classList.remove('hidden');
    } else {
        button.disabled = false;
        textElement.classList.remove('hidden');
        spinnerElement.classList.add('hidden');
    }
}

/**
 * Valida un correo electrónico
 * @param {string} email - Correo a validar
 * @returns {boolean}
 */
export function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Valida una contraseña (mínimo 6 caracteres)
 * @param {string} password - Contraseña a validar
 * @returns {boolean}
 */
export function isValidPassword(password) {
    return password.length >= 6;
}

/**
 * Formatea una fecha a string legible
 * @param {Date|string} date - Fecha a formatear
 * @returns {string}
 */
export function formatDate(date) {
    const d = new Date(date);
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    return d.toLocaleDateString('es-MX', options);
}

/**
 * Formatea una fecha a formato corto
 * @param {Date|string} date - Fecha a formatear
 * @returns {string} Formato: DD/MM/YYYY
 */
export function formatDateShort(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

/**
 * Genera un ID único
 * @returns {string}
 */
export function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Guarda datos en localStorage
 * @param {string} key - Clave
 * @param {any} data - Datos a guardar
 */
export function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Error al guardar en localStorage:', error);
        return false;
    }
}

/**
 * Obtiene datos de localStorage
 * @param {string} key - Clave
 * @returns {any|null}
 */
export function getFromLocalStorage(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Error al leer de localStorage:', error);
        return null;
    }
}

/**
 * Elimina datos de localStorage
 * @param {string} key - Clave
 */
export function removeFromLocalStorage(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (error) {
        console.error('Error al eliminar de localStorage:', error);
        return false;
    }
}

/**
 * Limpia todo el localStorage
 */
export function clearLocalStorage() {
    try {
        localStorage.clear();
        return true;
    } catch (error) {
        console.error('Error al limpiar localStorage:', error);
        return false;
    }
}

/**
 * Debounce: retrasa la ejecución de una función
 * @param {Function} func - Función a ejecutar
 * @param {number} delay - Retraso en ms
 * @returns {Function}
 */
export function debounce(func, delay = 300) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * Sanitiza un string para evitar XSS
 * @param {string} str - String a sanitizar
 * @returns {string}
 */
export function sanitizeString(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Obtiene los mensajes de error de Firebase en español
 * @param {string} errorCode - Código de error de Firebase
 * @returns {string}
 */
export function getFirebaseErrorMessage(errorCode) {
    const errorMessages = {
        'auth/invalid-email': 'El correo electrónico no es válido',
        'auth/user-disabled': 'Esta cuenta ha sido deshabilitada',
        'auth/user-not-found': 'No existe una cuenta con este correo',
        'auth/wrong-password': 'La contraseña es incorrecta',
        'auth/email-already-in-use': 'Este correo ya está registrado',
        'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
        'auth/network-request-failed': 'Error de conexión. Verifica tu internet',
        'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
        'auth/operation-not-allowed': 'Operación no permitida',
        'auth/invalid-credential': 'Las credenciales no son válidas',
        'auth/missing-password': 'Debes ingresar una contraseña'
    };
    
    return errorMessages[errorCode] || 'Ocurrió un error inesperado';
}

/**
 * Convierte bytes a formato legible
 * @param {number} bytes - Cantidad de bytes
 * @returns {string}
 */
export function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Valida si el navegador soporta características necesarias
 * @returns {object}
 */
export function checkBrowserSupport() {
    return {
        localStorage: typeof(Storage) !== 'undefined',
        serviceWorker: 'serviceWorker' in navigator,
        camera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
        fileAPI: window.File && window.FileReader && window.FileList && window.Blob
    };
}

/**
 * Copia texto al portapapeles
 * @param {string} text - Texto a copiar
 * @returns {Promise<boolean>}
 */
export async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        console.error('Error al copiar al portapapeles:', error);
        return false;
    }
}

/**
 * Abre un modal
 * @param {string} modalId - ID del modal
 */
export function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Cierra un modal
 * @param {string} modalId - ID del modal
 */
export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

/**
 * Previene el comportamiento por defecto de un evento
 * @param {Event} event - Evento
 */
export function preventDefault(event) {
    event.preventDefault();
}

/**
 * Detiene la propagación de un evento
 * @param {Event} event - Evento
 */
export function stopPropagation(event) {
    event.stopPropagation();
}

// Exportar todas las utilidades como objeto por defecto también
export default {
    showMessage,
    toggleButtonLoading,
    isValidEmail,
    isValidPassword,
    formatDate,
    formatDateShort,
    generateId,
    saveToLocalStorage,
    getFromLocalStorage,
    removeFromLocalStorage,
    clearLocalStorage,
    debounce,
    sanitizeString,
    getFirebaseErrorMessage,
    formatBytes,
    checkBrowserSupport,
    copyToClipboard,
    openModal,
    closeModal,
    preventDefault,
    stopPropagation
};