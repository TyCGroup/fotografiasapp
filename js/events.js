/* ===================================
   MÓDULO DE EVENTOS - T&C GROUP
   CRUD y gestión de eventos fotográficos
   =================================== */

import { 
    createEvent, 
    getAllEvents, 
    getEventById, 
    updateEvent, 
    deleteEvent,
    getActiveUsers 
} from './storage.js';

import {
    CATALOG_CATEGORIES,
    createCategory,
    createCategoryFromCatalog,
    addCategoryToEvent,
    removeCategoryFromEvent,
    validateCategoryName,
    resetColorIndex,
    renderCategoryChip,
    renderCatalogButton,
    getAvailableCatalogCategories
} from './categories.js';

import { showMessage } from './utils.js';

/* ===================================
   ESTADO DEL FORMULARIO
   =================================== */

const formState = {
    mode: 'create', // 'create' o 'edit'
    currentEventId: null,
    usuarios: [],
    categorias: [],
    showCatalog: true // Para alternar entre catálogo y campo personalizado
};

/* ===================================
   ELEMENTOS DEL DOM
   =================================== */

let eventForm;
let eventNameInput;
let responsableSelect;
let categoryInput;
let addCategoryBtn;
let categoriesContainer;
let catalogContainer;
let toggleCatalogBtn;
let customCategorySection;
let saveEventBtn;
let cancelEventBtn;

/* ===================================
   INICIALIZACIÓN
   =================================== */

/**
 * Inicializa el formulario de eventos
 */
export async function initEventForm() {
    console.log('📝 Inicializando formulario de eventos...');
    
    // Obtener elementos del DOM
    eventForm = document.getElementById('eventForm');
    eventNameInput = document.getElementById('eventName');
    responsableSelect = document.getElementById('responsableSelect');
    categoryInput = document.getElementById('categoryInput');
    addCategoryBtn = document.getElementById('addCategoryBtn');
    categoriesContainer = document.getElementById('categoriesContainer');
    catalogContainer = document.getElementById('catalogContainer');
    toggleCatalogBtn = document.getElementById('toggleCatalogBtn');
    customCategorySection = document.getElementById('customCategorySection');
    saveEventBtn = document.getElementById('saveEventBtn');
    cancelEventBtn = document.getElementById('cancelEventBtn');

    // Cargar usuarios
    await loadUsers();

    // Renderizar catálogo inicial
    renderCatalog();

    // Configurar event listeners
    setupFormListeners();

    console.log('✅ Formulario de eventos inicializado');
}

/**
 * Configura los event listeners del formulario
 */
function setupFormListeners() {
    // Envío del formulario
    if (eventForm) {
        eventForm.addEventListener('submit', handleFormSubmit);
    }

    // Agregar categoría personalizada
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', handleAddCustomCategory);
    }

    // Enter en input de categoría
    if (categoryInput) {
        categoryInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCustomCategory();
            }
        });
    }

    // Toggle entre catálogo y personalizado
    if (toggleCatalogBtn) {
        toggleCatalogBtn.addEventListener('click', handleToggleCatalog);
    }

    // Cancelar
    if (cancelEventBtn) {
        cancelEventBtn.addEventListener('click', handleCancel);
    }
}

/* ===================================
   CARGAR USUARIOS
   =================================== */

/**
 * Carga los usuarios activos en el select
 */
async function loadUsers() {
    try {
        console.log('👥 Cargando usuarios activos...');
        
        const usuarios = await getActiveUsers();
        formState.usuarios = usuarios;

        if (responsableSelect) {
            responsableSelect.innerHTML = '<option value="">Selecciona un responsable</option>';
            
            usuarios.forEach(usuario => {
                const option = document.createElement('option');
                option.value = usuario.id;
                option.textContent = usuario.nombre;
                option.dataset.nombre = usuario.nombre;
                responsableSelect.appendChild(option);
            });

            console.log(`✅ ${usuarios.length} usuarios cargados`);
        }
    } catch (error) {
        console.error('❌ Error al cargar usuarios:', error);
        showMessage('Error al cargar responsables', 'error');
    }
}

/* ===================================
   CATÁLOGO DE CATEGORÍAS
   =================================== */

/**
 * Renderiza el catálogo de categorías
 */
function renderCatalog() {
    if (!catalogContainer) return;

    const availableCategories = getAvailableCatalogCategories(formState.categorias);

    if (availableCategories.length === 0) {
        catalogContainer.innerHTML = '<p class="text-muted">Todas las categorías del catálogo han sido agregadas</p>';
        return;
    }

    catalogContainer.innerHTML = availableCategories
        .map(cat => renderCatalogButton(cat))
        .join('');
}

/**
 * Agrega una categoría desde el catálogo
 * @param {string} categoryName - Nombre de la categoría del catálogo
 */
window.addCatalogCategory = function(categoryName) {
    try {
        const newCategory = createCategoryFromCatalog(categoryName);
        formState.categorias.push(newCategory);

        // Renderizar
        renderCategories();
        renderCatalog(); // Actualizar catálogo para ocultar la agregada

        console.log('✅ Categoría del catálogo agregada:', newCategory);
        showMessage(`Categoría "${categoryName}" agregada`, 'success', 2000);
    } catch (error) {
        console.error('❌ Error al agregar categoría del catálogo:', error);
        showMessage(error.message, 'error');
    }
};

/**
 * Alterna entre catálogo y campo personalizado
 */
function handleToggleCatalog() {
    formState.showCatalog = !formState.showCatalog;

    if (formState.showCatalog) {
        catalogContainer.classList.remove('hidden');
        customCategorySection.classList.add('hidden');
        toggleCatalogBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>Agregar Personalizada</span>
        `;
    } else {
        catalogContainer.classList.add('hidden');
        customCategorySection.classList.remove('hidden');
        toggleCatalogBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>Ver Catálogo</span>
        `;
        categoryInput.focus();
    }
}

/* ===================================
   GESTIÓN DE CATEGORÍAS PERSONALIZADAS
   =================================== */

/**
 * Agrega una categoría personalizada
 */
function handleAddCustomCategory() {
    const nombre = categoryInput.value.trim();

    if (!nombre) {
        showMessage('Ingresa un nombre para la categoría', 'error');
        return;
    }

    try {
        // Validar nombre
        const validation = validateCategoryName(nombre, formState.categorias);
        
        if (!validation.valid) {
            showMessage(validation.error, 'error');
            return;
        }

        // Crear categoría personalizada (sin color predefinido)
        const newCategory = createCategory(nombre);
        formState.categorias.push(newCategory);

        // Renderizar
        renderCategories();

        // Limpiar input
        categoryInput.value = '';
        categoryInput.focus();

        console.log('✅ Categoría personalizada agregada:', newCategory);
        showMessage(`Categoría "${nombre}" agregada`, 'success', 2000);
    } catch (error) {
        console.error('❌ Error al agregar categoría:', error);
        showMessage(error.message, 'error');
    }
}

/**
 * Elimina una categoría
 * @param {string} categoryId - ID de la categoría
 */
window.removeCategory = function(categoryId) {
    formState.categorias = removeCategoryFromEvent(formState.categorias, categoryId);
    renderCategories();
    renderCatalog(); // Actualizar catálogo para mostrar la eliminada
    console.log('🗑️ Categoría eliminada:', categoryId);
};

/**
 * Renderiza las categorías en el contenedor
 */
function renderCategories() {
    if (!categoriesContainer) return;

    if (formState.categorias.length === 0) {
        categoriesContainer.innerHTML = '<p class="text-muted">No hay categorías agregadas. Selecciona del catálogo o agrega una personalizada.</p>';
        return;
    }

    categoriesContainer.innerHTML = formState.categorias
        .map(cat => renderCategoryChip(cat, true))
        .join('');
}

/* ===================================
   ENVÍO DEL FORMULARIO
   =================================== */

/**
 * Maneja el envío del formulario
 * @param {Event} e - Evento del formulario
 */
async function handleFormSubmit(e) {
    e.preventDefault();

    const nombreEvento = eventNameInput.value.trim();
    const responsableId = responsableSelect.value;
    
    // Validaciones
    if (!nombreEvento) {
        showMessage('El nombre del evento es requerido', 'error');
        return;
    }

    if (!responsableId) {
        showMessage('Debes seleccionar un responsable', 'error');
        return;
    }

    if (formState.categorias.length === 0) {
        const confirm = window.confirm('No has agregado categorías. ¿Deseas continuar sin categorías?');
        if (!confirm) return;
    }

    // Obtener nombre del responsable
    const selectedOption = responsableSelect.options[responsableSelect.selectedIndex];
    const responsableNombre = selectedOption.dataset.nombre;

    // Preparar datos
    const eventData = {
        nombre: nombreEvento,
        responsableId: responsableId,
        responsableNombre: responsableNombre,
        categorias: formState.categorias
    };

    // Deshabilitar botón
    saveEventBtn.disabled = true;
    saveEventBtn.innerHTML = `
        <span class="spinner"></span>
        <span>Guardando...</span>
    `;

    try {
        if (formState.mode === 'create') {
            await createNewEvent(eventData);
        } else {
            await updateExistingEvent(formState.currentEventId, eventData);
        }
    } catch (error) {
        console.error('❌ Error al guardar evento:', error);
        showMessage('Error al guardar el evento', 'error');
        
        // Rehabilitar botón
        saveEventBtn.disabled = false;
        saveEventBtn.innerHTML = '<span>Guardar Evento</span>';
    }
}

/**
 * Crea un nuevo evento
 * @param {Object} eventData - Datos del evento
 */
async function createNewEvent(eventData) {
    try {
        console.log('💾 Creando evento...', eventData);
        
        const eventId = await createEvent(eventData);
        
        showMessage('¡Evento creado exitosamente!', 'success');
        
        // Resetear formulario
        resetForm();
        
        // Volver al inicio y recargar eventos
        setTimeout(() => {
            window.navigateToView('homeView');
            
            // Disparar evento personalizado para recargar lista
            window.dispatchEvent(new CustomEvent('eventCreated', { detail: { eventId } }));
        }, 1000);
        
    } catch (error) {
        throw error;
    }
}

/**
 * Actualiza un evento existente
 * @param {string} eventId - ID del evento
 * @param {Object} eventData - Datos actualizados
 */
async function updateExistingEvent(eventId, eventData) {
    try {
        console.log('💾 Actualizando evento...', eventId);
        
        await updateEvent(eventId, eventData);
        
        showMessage('¡Evento actualizado exitosamente!', 'success');
        
        // Resetear formulario
        resetForm();
        
        // Volver al inicio y recargar eventos
        setTimeout(() => {
            window.navigateToView('homeView');
            
            // Disparar evento personalizado para recargar lista
            window.dispatchEvent(new CustomEvent('eventUpdated', { detail: { eventId } }));
        }, 1000);
        
    } catch (error) {
        throw error;
    }
}

/* ===================================
   EDICIÓN DE EVENTOS
   =================================== */

/**
 * Carga un evento para editar
 * @param {string} eventId - ID del evento
 */
export async function loadEventForEdit(eventId) {
    try {
        console.log('📝 Cargando evento para editar:', eventId);
        
        const event = await getEventById(eventId);
        
        if (!event) {
            showMessage('Evento no encontrado', 'error');
            return;
        }

        // Cambiar modo a edición
        formState.mode = 'edit';
        formState.currentEventId = eventId;

        // Llenar formulario
        eventNameInput.value = event.nombre;
        responsableSelect.value = event.responsableId;
        formState.categorias = event.categorias || [];

        // Renderizar categorías y catálogo
        resetColorIndex();
        renderCategories();
        renderCatalog();

        // Cambiar título
        const viewTitle = document.querySelector('#createView .view-title');
        if (viewTitle) {
            viewTitle.textContent = 'Editar Evento';
        }

        // Cambiar texto del botón
        if (saveEventBtn) {
            saveEventBtn.innerHTML = '<span>Actualizar Evento</span>';
        }

        // Navegar a la vista de crear
        window.navigateToView('createView');

        console.log('✅ Evento cargado para edición');
    } catch (error) {
        console.error('❌ Error al cargar evento:', error);
        showMessage('Error al cargar el evento', 'error');
    }
}

/* ===================================
   RESETEO Y CANCELACIÓN
   =================================== */

/**
 * Resetea el formulario
 */
function resetForm() {
    formState.mode = 'create';
    formState.currentEventId = null;
    formState.categorias = [];
    formState.showCatalog = true;

    if (eventForm) {
        eventForm.reset();
    }

    // Resetear categorías
    renderCategories();
    renderCatalog();

    // Mostrar catálogo por defecto
    if (catalogContainer) catalogContainer.classList.remove('hidden');
    if (customCategorySection) customCategorySection.classList.add('hidden');
    
    if (toggleCatalogBtn) {
        toggleCatalogBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>Agregar Personalizada</span>
        `;
    }

    if (saveEventBtn) {
        saveEventBtn.disabled = false;
        saveEventBtn.innerHTML = '<span>Guardar Evento</span>';
    }

    // Restaurar título
    const viewTitle = document.querySelector('#createView .view-title');
    if (viewTitle) {
        viewTitle.textContent = 'Crear Evento';
    }

    resetColorIndex();
}

/**
 * Maneja la cancelación del formulario
 */
function handleCancel() {
    const hasChanges = eventNameInput.value.trim() !== '' || 
                      responsableSelect.value !== '' || 
                      formState.categorias.length > 0;

    if (hasChanges) {
        const confirm = window.confirm('¿Deseas descartar los cambios?');
        if (!confirm) return;
    }

    resetForm();
    window.navigateToView('homeView');
}

/* ===================================
   ELIMINACIÓN DE EVENTOS
   =================================== */

/**
 * Elimina un evento
 * @param {string} eventId - ID del evento
 */
export async function deleteEventById(eventId) {
    const confirm = window.confirm('¿Estás seguro de eliminar este evento? Esta acción no se puede deshacer.');
    
    if (!confirm) return;

    try {
        console.log('🗑️ Eliminando evento:', eventId);
        
        await deleteEvent(eventId);
        
        showMessage('Evento eliminado exitosamente', 'success');
        
        // Recargar eventos
        window.dispatchEvent(new CustomEvent('eventDeleted', { detail: { eventId } }));
        
    } catch (error) {
        console.error('❌ Error al eliminar evento:', error);
        showMessage('Error al eliminar el evento', 'error');
    }
}

/* ===================================
   EXPORTACIONES
   =================================== */

export {
    formState,
    loadUsers,
    resetForm
};