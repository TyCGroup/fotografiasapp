/* ===================================
   MÓDULO DE GESTIÓN DE USUARIOS - T&C GROUP
   Agregar usuarios con Firebase Authentication
   =================================== */

import { auth, db } from './firestore-config.js';
import { createUserWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { collection, addDoc, getDocs, query, where, Timestamp, doc, setDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { showMessage } from './utils.js';

/* ===================================
   ELEMENTOS DEL DOM
   =================================== */

let userForm;
let userNameInput;
let userEmailInput;
let userPasswordInput;
let userPasswordConfirmInput;
let addUserBtn;
let cancelUserBtn;
let togglePasswordBtn;
let togglePasswordConfirmBtn;

/* ===================================
   INICIALIZACIÓN
   =================================== */

/**
 * Inicializa el módulo de gestión de usuarios
 */
export function initUserManagement() {
    console.log('👥 Inicializando gestión de usuarios...');
    
    // Obtener elementos del DOM
    userForm = document.getElementById('userForm');
    userNameInput = document.getElementById('userName');
    userEmailInput = document.getElementById('userEmail');
    userPasswordInput = document.getElementById('userPassword');
    userPasswordConfirmInput = document.getElementById('userPasswordConfirm');
    addUserBtn = document.getElementById('addUserBtn');
    cancelUserBtn = document.getElementById('cancelUserBtn');
    togglePasswordBtn = document.getElementById('togglePasswordBtn');
    togglePasswordConfirmBtn = document.getElementById('togglePasswordConfirmBtn');
    
    // Configurar event listeners
    setupEventListeners();
    
    console.log('✅ Gestión de usuarios inicializada');
}

/**
 * Configura los event listeners
 */
function setupEventListeners() {
    // Envío del formulario
    if (userForm) {
        userForm.addEventListener('submit', handleAddUser);
    }
    
    // Cancelar
    if (cancelUserBtn) {
        cancelUserBtn.addEventListener('click', handleCancel);
    }

    // Toggle mostrar/ocultar contraseña
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', () => togglePasswordVisibility('userPassword', togglePasswordBtn));
    }

    if (togglePasswordConfirmBtn) {
        togglePasswordConfirmBtn.addEventListener('click', () => togglePasswordVisibility('userPasswordConfirm', togglePasswordConfirmBtn));
    }
}

/* ===================================
   AGREGAR USUARIO
   =================================== */

/**
 * Maneja el envío del formulario para agregar usuario
 * @param {Event} e - Evento del formulario
 */
async function handleAddUser(e) {
    e.preventDefault();
    
    const nombre = userNameInput.value.trim();
    const email = userEmailInput.value.trim();
    const password = userPasswordInput.value;
    const passwordConfirm = userPasswordConfirmInput.value;
    
    // Validaciones
    if (!nombre) {
        showMessage('El nombre es requerido', 'error');
        return;
    }
    
    if (nombre.length < 3) {
        showMessage('El nombre debe tener al menos 3 caracteres', 'error');
        return;
    }
    
    if (!email) {
        showMessage('El email es requerido', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showMessage('El email no es válido', 'error');
        return;
    }

    if (!password) {
        showMessage('La contraseña es requerida', 'error');
        return;
    }

    if (password.length < 6) {
        showMessage('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }

    if (password !== passwordConfirm) {
        showMessage('Las contraseñas no coinciden', 'error');
        return;
    }
    
    // Verificar si el email ya existe en Firestore
    const emailExistsInFirestore = await checkEmailExistsInFirestore(email);
    if (emailExistsInFirestore) {
        showMessage('Este email ya está registrado en el sistema', 'error');
        return;
    }
    
    // Deshabilitar botón
    addUserBtn.disabled = true;
    addUserBtn.innerHTML = `
        <span class="spinner"></span>
        <span>Creando usuario...</span>
    `;
    
    try {
        // Guardar el usuario actual (admin) para poder restaurarlo
        const currentUser = auth.currentUser;
        
        // Crear usuario en Firebase Authentication
        console.log('🔐 Creando usuario en Firebase Auth...');
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newUser = userCredential.user;
        
        console.log('✅ Usuario creado en Auth con UID:', newUser.uid);
        
        // Crear documento en Firestore con el mismo UID
        const userData = {
            nombre: nombre,
            email: email,
            estado: 'Activo',
            fechaCreacion: Timestamp.now(),
            fechaModificacion: Timestamp.now()
        };
        
        console.log('💾 Guardando datos en Firestore...');
        await setDoc(doc(db, 'usuarios', newUser.uid), userData);
        
        console.log('✅ Datos guardados en Firestore');
        
        // Cerrar sesión del usuario recién creado
        await auth.signOut();
        
        // IMPORTANTE: Aquí deberías re-autenticar al admin
        // Por ahora solo recargamos la página para que Firebase restaure la sesión del admin
        
        showMessage(`¡Usuario "${nombre}" creado exitosamente!`, 'success');
        
        // Resetear formulario
        resetForm();
        
        // Volver a perfil después de 2 segundos
        setTimeout(() => {
            window.navigateToView('profileView');
        }, 2000);
        
    } catch (error) {
        console.error('❌ Error al crear usuario:', error);
        
        // Mensajes de error específicos
        let errorMessage = 'Error al crear usuario';
        
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'Este email ya está registrado en Firebase Authentication';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'El email no es válido';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'La contraseña es muy débil';
        } else if (error.code === 'auth/network-request-failed') {
            errorMessage = 'Error de conexión. Verifica tu internet';
        } else {
            errorMessage = error.message || 'Error desconocido';
        }
        
        showMessage(errorMessage, 'error');
        
        // Rehabilitar botón
        addUserBtn.disabled = false;
        addUserBtn.innerHTML = '<span>Agregar Usuario</span>';
    }
}

/* ===================================
   VALIDACIONES
   =================================== */

/**
 * Valida un email
 * @param {string} email - Email a validar
 * @returns {boolean}
 */
function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Verifica si un email ya existe en Firestore
 * @param {string} email - Email a verificar
 * @returns {Promise<boolean>}
 */
async function checkEmailExistsInFirestore(email) {
    try {
        const usuariosRef = collection(db, 'usuarios');
        const q = query(usuariosRef, where('email', '==', email));
        const querySnapshot = await getDocs(q);
        
        return !querySnapshot.empty;
    } catch (error) {
        console.error('Error al verificar email:', error);
        return false;
    }
}

/**
 * Valida la fortaleza de la contraseña
 * @param {string} password - Contraseña a validar
 * @returns {Object} - {valid: boolean, strength: string, message: string}
 */
function validatePasswordStrength(password) {
    if (password.length < 6) {
        return { valid: false, strength: 'weak', message: 'Muy corta (mínimo 6 caracteres)' };
    }
    
    let strength = 'weak';
    let score = 0;
    
    // Criterios de fortaleza
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    
    if (score >= 5) {
        strength = 'strong';
    } else if (score >= 3) {
        strength = 'medium';
    }
    
    const messages = {
        weak: 'Débil - Usa más caracteres',
        medium: 'Media - Agrega mayúsculas o símbolos',
        strong: 'Fuerte'
    };
    
    return {
        valid: password.length >= 6,
        strength: strength,
        message: messages[strength]
    };
}

/* ===================================
   UTILIDADES
   =================================== */

/**
 * Toggle para mostrar/ocultar contraseña
 * @param {string} inputId - ID del input de contraseña
 * @param {HTMLElement} button - Botón de toggle
 */
function togglePasswordVisibility(inputId, button) {
    const input = document.getElementById(inputId);
    
    if (input.type === 'password') {
        input.type = 'text';
        button.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
    } else {
        input.type = 'password';
        button.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
    }
}

/**
 * Resetea el formulario
 */
function resetForm() {
    if (userForm) {
        userForm.reset();
    }
    
    if (addUserBtn) {
        addUserBtn.disabled = false;
        addUserBtn.innerHTML = '<span>Agregar Usuario</span>';
    }
}

/**
 * Maneja la cancelación
 */
function handleCancel() {
    const hasChanges = userNameInput.value.trim() !== '' || 
                      userEmailInput.value.trim() !== '' ||
                      userPasswordInput.value !== '' ||
                      userPasswordConfirmInput.value !== '';
    
    if (hasChanges) {
        const confirm = window.confirm('¿Deseas descartar los cambios?');
        if (!confirm) return;
    }
    
    resetForm();
    window.navigateToView('profileView');
}

/* ===================================
   EXPORTACIONES
   =================================== */

export default {
    initUserManagement
};