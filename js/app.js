/* ===================================
   APP PRINCIPAL - T&C GROUP
   Lógica principal del dashboard
   =================================== */

import { auth } from './firestore-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { logout, getCurrentUser } from './auth.js';
import { initNavigation } from './navigation.js';
import { showMessage, getFromLocalStorage } from './utils.js';
import { getAllEvents } from './storage.js';
import { initEventForm, loadEventForEdit, deleteEventById } from './events.js';
import { initPhotoManager, openPhotoManager } from './photo-manager.js';
import { initReportManager, loadReportsView } from './report-manager.js';
import { initUserManagement } from './user-management.js';

/* ===================================
   INICIALIZACIÓN
   =================================== */

// Estado de la aplicación
const appState = {
    currentUser: null,
    events: [],
    isLoading: false
};

// Elementos del DOM
let logoutBtn;
let welcomeMessage;
let profileName;
let profileEmail;
let searchInput;
let filterBtn;
let eventsContainer;
let emptyState;

// Variable para evitar múltiples inicializaciones
let isInitialized = false;

/**
 * Inicializa la aplicación
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Iniciando aplicación...');
    
    // Verificar autenticación antes de continuar
    checkAuthentication();
});

/**
 * Verifica si el usuario está autenticado
 */
function checkAuthentication() {
    onAuthStateChanged(auth, (user) => {
        if (user && !isInitialized) {
            console.log('✅ Usuario autenticado:', user.email);
            appState.currentUser = user;
            isInitialized = true;
            initializeApp();
        } else if (!user) {
            console.log('❌ Usuario no autenticado, redirigiendo...');
            redirectToLogin();
        }
    });
}

/**
 * Inicializa todos los componentes de la aplicación
 */
function initializeApp() {
    console.log('⚙️ Inicializando componentes...');
    
    // Obtener elementos del DOM
    initializeDOMElements();
    
    // Inicializar navegación
    initNavigation();
    
    // Inicializar formulario de eventos
    initEventForm();
    
    // Inicializar gestor de fotos
    initPhotoManager();
    
    // Inicializar gestor de reportes
    initReportManager();
    
    // Inicializar gestión de usuarios
    initUserManagement();
    
    // Cargar datos del usuario
    loadUserData();
    
    // Configurar event listeners
    setupEventListeners();
    
    // Configurar listeners de eventos personalizados
    setupCustomEventListeners();
    
    // Cargar eventos
    loadEvents();
    
    console.log('✅ Aplicación iniciada correctamente');
}

/**
 * Obtiene referencias a elementos del DOM
 */
function initializeDOMElements() {
    logoutBtn = document.getElementById('logoutBtn');
    welcomeMessage = document.getElementById('welcomeMessage');
    profileName = document.getElementById('profileName');
    profileEmail = document.getElementById('profileEmail');
    searchInput = document.getElementById('searchInput');
    filterBtn = document.getElementById('filterBtn');
    eventsContainer = document.getElementById('eventsContainer');
    emptyState = document.getElementById('emptyState');
}

/**
 * Configura los event listeners
 */
function setupEventListeners() {
    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Búsqueda
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }

    // Filtros
    if (filterBtn) {
        filterBtn.addEventListener('click', handleFilter);
    }
}

/**
 * Configura listeners para eventos personalizados
 */
function setupCustomEventListeners() {
    // Cuando se crea un evento
    window.addEventListener('eventCreated', () => {
        loadEvents();
    });

    // Cuando se actualiza un evento
    window.addEventListener('eventUpdated', () => {
        loadEvents();
    });

    // Cuando se elimina un evento
    window.addEventListener('eventDeleted', () => {
        loadEvents();
    });
}

/* ===================================
   DATOS DEL USUARIO
   =================================== */

/**
 * Carga y muestra los datos del usuario
 */
function loadUserData() {
    const userData = getCurrentUser();
    
    if (userData) {
        // Actualizar mensaje de bienvenida
        if (welcomeMessage) {
            const firstName = userData.displayName 
                ? userData.displayName.split(' ')[0] 
                : 'Usuario';
            welcomeMessage.textContent = `Bienvenido de nuevo, ${firstName}`;
        }

        // Actualizar perfil
        if (profileName) {
            profileName.textContent = userData.displayName || 'Usuario';
        }
        
        if (profileEmail) {
            profileEmail.textContent = userData.email;
        }

        console.log('✅ Datos del usuario cargados:', userData.email);
    }
}

/* ===================================
   GESTIÓN DE EVENTOS
   =================================== */

/**
 * Carga los eventos del usuario
 */
async function loadEvents() {
    console.log('📁 Cargando eventos...');
    
    try {
        // Cargar desde Firestore
        const events = await getAllEvents();
        
        if (events && events.length > 0) {
            appState.events = events;
            renderEvents(events);
            console.log(`✅ Cargados ${events.length} eventos`);
        } else {
            // No hay eventos, mostrar estado vacío
            showEmptyState();
            console.log('ℹ️ No hay eventos guardados');
        }
    } catch (error) {
        console.error('❌ Error al cargar eventos:', error);
        showEmptyState();
    }
}

/**
 * Renderiza la lista de eventos
 * @param {Array} events - Lista de eventos
 */
function renderEvents(events) {
    if (!eventsContainer) return;

    // Limpiar contenedor
    eventsContainer.innerHTML = '';

    if (events.length === 0) {
        showEmptyState();
        return;
    }

    // Ocultar estado vacío si existe
    if (emptyState) {
        emptyState.classList.add('hidden');
    }

    // Crear cards de eventos
    events.forEach(event => {
        const eventCard = createEventCard(event);
        eventsContainer.appendChild(eventCard);
    });
}

/**
 * Crea un card de evento
 * @param {Object} event - Datos del evento
 * @returns {HTMLElement}
 */
function createEventCard(event) {
    const card = document.createElement('div');
    card.className = 'event-card';
    
    // Click en el card para abrir fotos
    card.onclick = (e) => {
        // Evitar abrir si se hace clic en los botones
        if (!e.target.closest('.btn-action')) {
            openEvent(event.id);
        }
    };
    card.style.cursor = 'pointer';

    // Contar fotos y categorías
    const photoCount = event.fotos?.length || 0;
    const categoryCount = event.categorias?.length || 0;
    
    // Formatear fecha
    const fechaCreacion = formatEventDate(event.fechaCreacion);
    
    // Renderizar categorías
    const categoriasHTML = categoryCount > 0 ? renderCategories(event.categorias) : '';

    card.innerHTML = `
        <div class="event-content">
            <h3 class="event-title">${event.nombre}</h3>
            <p class="event-date">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline; vertical-align: middle; margin-right: 4px;">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                ${event.responsableNombre}
            </p>
            <p class="event-date" style="margin-top: 4px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline; vertical-align: middle; margin-right: 4px;">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                ${fechaCreacion}
            </p>
            <div class="event-stats">
                <div class="event-stat">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" stroke-width="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                        <polyline points="21 15 16 10 5 21" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    <span>${photoCount} fotos</span>
                </div>
                <div class="event-stat">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" stroke="currentColor" stroke-width="2"/>
                        <line x1="7" y1="7" x2="7.01" y2="7" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    <span>${categoryCount} categorías</span>
                </div>
            </div>
            ${categoriasHTML ? `<div class="event-categories">${categoriasHTML}</div>` : ''}
            <div class="event-actions">
                <button class="btn-action btn-action-edit" onclick="editEvent('${event.id}'); event.stopPropagation();">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Editar
                </button>
                <button class="btn-action btn-action-delete" onclick="deleteEvent('${event.id}'); event.stopPropagation();">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <polyline points="3 6 5 6 21 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Eliminar
                </button>
            </div>
        </div>
    `;

    return card;
}

/**
 * Renderiza las categorías de un evento
 * @param {Array} categories - Lista de categorías
 * @returns {string}
 */
function renderCategories(categories) {
    if (!categories || !Array.isArray(categories) || categories.length === 0) {
        return '';
    }

    return categories.slice(0, 3).map(cat => {
        if (!cat || !cat.nombre || !cat.color) return '';
        
        return `<span class="category-chip" style="background-color: ${cat.color}20; color: ${cat.color}; border: 1px solid ${cat.color}40;">
            ${cat.nombre}
        </span>`;
    }).filter(chip => chip !== '').join('');
}

/**
 * Formatea la fecha del evento
 * @param {string|Date|Timestamp} date - Fecha del evento
 * @returns {string}
 */
function formatEventDate(date) {
    if (!date) return 'Fecha no disponible';
    
    let d;
    
    // Si es un Timestamp de Firestore
    if (date && typeof date.toDate === 'function') {
        d = date.toDate();
    } 
    // Si es un objeto con seconds (Firestore serializado)
    else if (date && date.seconds) {
        d = new Date(date.seconds * 1000);
    }
    // Si es un string ISO
    else if (typeof date === 'string') {
        d = new Date(date);
    }
    // Si ya es un Date
    else if (date instanceof Date) {
        d = date;
    }
    else {
        return 'Fecha no disponible';
    }
    
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    
    return d.toLocaleDateString('es-MX', options);
}

/**
 * Muestra el estado vacío
 */
function showEmptyState() {
    if (emptyState) {
        emptyState.classList.remove('hidden');
    }
}

/**
 * Abre un evento específico (gestor de fotos)
 * @param {string} eventId - ID del evento
 */
function openEvent(eventId) {
    console.log('📂 Abriendo gestor de fotos para evento:', eventId);
    openPhotoManager(eventId);
}

/**
 * Edita un evento (función global)
 * @param {string} eventId - ID del evento
 */
window.editEvent = async function(eventId) {
    console.log('✏️ Editando evento:', eventId);
    await loadEventForEdit(eventId);
};

/**
 * Elimina un evento (función global)
 * @param {string} eventId - ID del evento
 */
window.deleteEvent = async function(eventId) {
    await deleteEventById(eventId);
};

/* ===================================
   BÚSQUEDA Y FILTROS
   =================================== */

/**
 * Maneja la búsqueda de eventos
 * @param {Event} e - Evento del input
 */
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        renderEvents(appState.events);
        return;
    }

    const filteredEvents = appState.events.filter(event => 
        event.nombre.toLowerCase().includes(searchTerm) ||
        event.responsableNombre?.toLowerCase().includes(searchTerm) ||
        event.categorias?.some(cat => cat.nombre.toLowerCase().includes(searchTerm))
    );

    renderEvents(filteredEvents);
    console.log(`🔍 Búsqueda: "${searchTerm}" - ${filteredEvents.length} resultados`);
}

/**
 * Maneja los filtros de eventos
 */
function handleFilter() {
    console.log('🔧 Filtros (disponible en próxima etapa)');
    showMessage('Filtros disponibles en la siguiente etapa', 'info');
}

/* ===================================
   LOGOUT
   =================================== */

/**
 * Maneja el cierre de sesión
 */
async function handleLogout() {
    console.log('👋 Cerrando sesión...');
    
    const confirmLogout = confirm('¿Estás seguro de cerrar sesión?');
    
    if (confirmLogout) {
        try {
            await logout();
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            showMessage('Error al cerrar sesión', 'error');
        }
    }
}

/* ===================================
   REDIRECCIÓN
   =================================== */

/**
 * Redirige al login
 */
function redirectToLogin() {
    if (!isInitialized) {
        console.log('🔄 Redirigiendo a login...');
        window.location.replace('index.html');
    }
}

/* ===================================
   EXPORTACIONES
   =================================== */

export {
    appState,
    loadEvents,
    renderEvents,
    openEvent
};