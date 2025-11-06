/* ===================================
   MÓDULO DE NAVEGACIÓN - T&C GROUP
   Sistema de navegación entre vistas
   =================================== */

/**
 * Estado actual de la navegación
 */
let currentView = 'homeView';

/**
 * Inicializa el sistema de navegación
 */
export function initNavigation() {
    console.log('🧭 Iniciando sistema de navegación...');
    
    // Obtener todos los botones de navegación
    const navButtons = document.querySelectorAll('.nav-item');
    
    // Agregar event listeners a los botones
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetView = button.getAttribute('data-view');
            navigateToView(targetView);
        });
    });

    // Mostrar la vista inicial
    showView(currentView);
    
    console.log('✅ Sistema de navegación iniciado');
}

/**
 * Navega a una vista específica
 * @param {string} viewId - ID de la vista de destino
 */
export function navigateToView(viewId) {
    if (!viewId) {
        console.error('❌ No se proporcionó un ID de vista');
        return;
    }

    // Verificar si la vista existe
    const targetView = document.getElementById(viewId);
    if (!targetView) {
        console.error(`❌ No existe la vista: ${viewId}`);
        return;
    }

    // Si ya estamos en esa vista, no hacer nada
    if (currentView === viewId) {
        console.log(`ℹ️ Ya estás en la vista: ${viewId}`);
        return;
    }

    console.log(`🔄 Navegando de ${currentView} a ${viewId}`);

    // Ocultar vista actual
    hideView(currentView);

    // Mostrar nueva vista
    showView(viewId);

    // Actualizar navegación
    updateNavigation(viewId);

    // Actualizar vista actual
    currentView = viewId;
    
    // Cargar datos específicos de la vista
    handleViewChange(viewId);

    // Scroll al inicio
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Muestra una vista
 * @param {string} viewId - ID de la vista
 */
function showView(viewId) {
    const view = document.getElementById(viewId);
    if (view) {
        view.classList.add('active');
    }
}

/**
 * Oculta una vista
 * @param {string} viewId - ID de la vista
 */
function hideView(viewId) {
    const view = document.getElementById(viewId);
    if (view) {
        view.classList.remove('active');
    }
}

/**
 * Actualiza el estado visual de la navegación
 * @param {string} viewId - ID de la vista activa
 */
function updateNavigation(viewId) {
    // Obtener todos los botones
    const navButtons = document.querySelectorAll('.nav-item');
    
    // Remover clase active de todos
    navButtons.forEach(button => {
        button.classList.remove('active');
    });

    // Agregar clase active al botón correspondiente
    const activeButton = document.querySelector(`.nav-item[data-view="${viewId}"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
}

/**
 * Obtiene la vista actual
 * @returns {string} ID de la vista actual
 */
export function getCurrentView() {
    return currentView;
}

/**
 * Vuelve a la vista anterior (historial)
 */
export function goBack() {
    // Por ahora simplemente volvemos a Home
    navigateToView('homeView');
}

/**
 * Verifica si una vista está activa
 * @param {string} viewId - ID de la vista
 * @returns {boolean}
 */
export function isViewActive(viewId) {
    return currentView === viewId;
}

/**
 * Maneja las acciones al cambiar de vista
 * @param {string} viewId - ID de la nueva vista
 */
function handleViewChange(viewId) {
    // Cargar reportes si navegamos a esa vista
    if (viewId === 'reportsView') {
        // Importar dinámicamente para evitar dependencias circulares
        import('./report-manager.js').then(module => {
            module.loadReportsView();
        });
    }
}

// Hacer la función navigateToView global para usar en onclick
window.navigateToView = navigateToView;

// Exportar funciones principales
export default {
    initNavigation,
    navigateToView,
    getCurrentView,
    goBack,
    isViewActive
};