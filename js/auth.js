/* ===================================
   MÓDULO DE AUTENTICACIÓN - T&C GROUP
   Gestión de login y recuperación de contraseña
   =================================== */

import { auth } from './firestore-config.js';
import { 
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

import {
    showMessage,
    toggleButtonLoading,
    isValidEmail,
    isValidPassword,
    getFirebaseErrorMessage,
    openModal,
    closeModal,
    saveToLocalStorage,
    getFromLocalStorage
} from './utils.js';

/* ===================================
   INICIALIZACIÓN
   =================================== */

// Elementos del DOM
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const loginBtnText = document.getElementById('loginBtnText');
const loginSpinner = document.getElementById('loginSpinner');

const togglePasswordBtn = document.getElementById('togglePassword');
const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');

const resetPasswordModal = document.getElementById('resetPasswordModal');
const closeModalBtn = document.getElementById('closeModal');
const resetPasswordForm = document.getElementById('resetPasswordForm');
const resetEmailInput = document.getElementById('resetEmail');
const resetBtn = document.getElementById('resetBtn');
const resetBtnText = document.getElementById('resetBtnText');
const resetSpinner = document.getElementById('resetSpinner');

/* ===================================
   EVENT LISTENERS
   =================================== */

// Verificar estado de autenticación al cargar
document.addEventListener('DOMContentLoaded', () => {
    checkAuthState();
    initializeEventListeners();
    loadRememberedEmail();
});

/**
 * Inicializa todos los event listeners
 */
function initializeEventListeners() {
    // Login form
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Toggle password visibility
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', togglePasswordVisibility);
    }

    // Forgot password
    if (forgotPasswordBtn) {
        forgotPasswordBtn.addEventListener('click', () => openModal('resetPasswordModal'));
    }

    // Close modal
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => closeModal('resetPasswordModal'));
    }

    // Modal overlay click
    if (resetPasswordModal) {
        resetPasswordModal.querySelector('.modal-overlay')?.addEventListener('click', () => {
            closeModal('resetPasswordModal');
        });
    }

    // Reset password form
    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', handlePasswordReset);
    }

    // Enter key en inputs
    if (emailInput) {
        emailInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                passwordInput?.focus();
            }
        });
    }
}

/* ===================================
   FUNCIONES DE AUTENTICACIÓN
   =================================== */

/**
 * Verifica el estado de autenticación del usuario
 */
function checkAuthState() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // Usuario autenticado, redirigir al dashboard
            console.log('Usuario autenticado:', user.email);
            // Solo redirigir si estamos en la página de login
            if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
                redirectToDashboard();
            }
        }
    });
}

/**
 * Maneja el envío del formulario de login
 * @param {Event} e - Evento del formulario
 */
async function handleLogin(e) {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Validaciones
    if (!email || !password) {
        showMessage('Por favor completa todos los campos', 'error');
        return;
    }

    if (!isValidEmail(email)) {
        showMessage('El correo electrónico no es válido', 'error');
        return;
    }

    if (!isValidPassword(password)) {
        showMessage('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }

    // Mostrar loading
    toggleButtonLoading(loginBtn, loginBtnText, loginSpinner, true);

    try {
        // Intentar iniciar sesión
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Guardar email para recordar
        rememberEmail(email);

        // Guardar datos del usuario
        saveUserData(user);

        // Mostrar mensaje de éxito
        showMessage('¡Bienvenido de nuevo!', 'success', 2000);

        // Redirigir al dashboard
        setTimeout(() => {
            redirectToDashboard();
        }, 1000);

    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        const errorMessage = getFirebaseErrorMessage(error.code);
        showMessage(errorMessage, 'error');
        toggleButtonLoading(loginBtn, loginBtnText, loginSpinner, false);
    }
}

/**
 * Maneja el envío del formulario de recuperación de contraseña
 * @param {Event} e - Evento del formulario
 */
async function handlePasswordReset(e) {
    e.preventDefault();

    const email = resetEmailInput.value.trim();

    // Validaciones
    if (!email) {
        showMessage('Por favor ingresa tu correo electrónico', 'error');
        return;
    }

    if (!isValidEmail(email)) {
        showMessage('El correo electrónico no es válido', 'error');
        return;
    }

    // Mostrar loading
    toggleButtonLoading(resetBtn, resetBtnText, resetSpinner, true);

    try {
        // Enviar correo de recuperación
        await sendPasswordResetEmail(auth, email);

        // Mostrar mensaje de éxito
        showMessage('¡Correo enviado! Revisa tu bandeja de entrada', 'success', 5000);

        // Cerrar modal y resetear formulario
        setTimeout(() => {
            closeModal('resetPasswordModal');
            resetPasswordForm.reset();
            toggleButtonLoading(resetBtn, resetBtnText, resetSpinner, false);
        }, 2000);

    } catch (error) {
        console.error('Error al enviar correo de recuperación:', error);
        const errorMessage = getFirebaseErrorMessage(error.code);
        showMessage(errorMessage, 'error');
        toggleButtonLoading(resetBtn, resetBtnText, resetSpinner, false);
    }
}

/**
 * Toggle de visibilidad de la contraseña
 */
function togglePasswordVisibility() {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);

    // Cambiar ícono
    const eyeIcon = document.getElementById('eyeIcon');
    if (type === 'text') {
        eyeIcon.innerHTML = `
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        `;
    } else {
        eyeIcon.innerHTML = `
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        `;
    }
}

/* ===================================
   FUNCIONES AUXILIARES
   =================================== */

/**
 * Guarda el email del usuario para recordarlo
 * @param {string} email - Email a guardar
 */
function rememberEmail(email) {
    saveToLocalStorage('rememberedEmail', email);
}

/**
 * Carga el email guardado en el input
 */
function loadRememberedEmail() {
    const rememberedEmail = getFromLocalStorage('rememberedEmail');
    if (rememberedEmail && emailInput) {
        emailInput.value = rememberedEmail;
    }
}

/**
 * Guarda los datos del usuario en localStorage
 * @param {Object} user - Usuario de Firebase
 */
function saveUserData(user) {
    const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'Usuario',
        photoURL: user.photoURL || null,
        lastLogin: new Date().toISOString()
    };
    saveToLocalStorage('currentUser', userData);
}

/**
 * Redirige al usuario al dashboard
 */
function redirectToDashboard() {
    console.log('🚀 Redirigiendo al dashboard...');
    window.location.replace('app.html');
}

/**
 * Cierra la sesión del usuario
 */
export async function logout() {
    try {
        await auth.signOut();
        localStorage.removeItem('currentUser');
        showMessage('Sesión cerrada correctamente', 'success');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        showMessage('Error al cerrar sesión', 'error');
    }
}

/**
 * Obtiene el usuario actual
 * @returns {Object|null}
 */
export function getCurrentUser() {
    return getFromLocalStorage('currentUser');
}

/**
 * Verifica si hay un usuario autenticado
 * @returns {boolean}
 */
export function isAuthenticated() {
    return getCurrentUser() !== null && auth.currentUser !== null;
}

// Exportar funciones principales
export {
    handleLogin,
    handlePasswordReset,
    checkAuthState
};