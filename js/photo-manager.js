/* ===================================
   PHOTO MANAGER - T&C GROUP
   UI para gestionar fotos de eventos
   =================================== */

import { getEventById, updateEvent } from './storage.js';
import { 
    processMultipleFiles, 
    capturePhoto, 
    selectMultiplePhotos,
    filterPhotosByCategory,
    removePhotoById,
    countPhotosByCategory
} from './photos.js';
import { showMessage } from './utils.js';
import { addCategoryToEvent } from './categories.js';

/* ===================================
   ESTADO DEL GESTOR DE FOTOS
   =================================== */

const photoManagerState = {
    currentEvent: null,
    currentCategoryId: null,
    photos: [],
    isUploading: false
};

/* ===================================
   ELEMENTOS DEL DOM
   =================================== */

let photoManagerView;
let eventInfoSection;
let categoriesTabsContainer;
let photosGridContainer;
let addPhotosSection;
let capturePhotoBtn;
let selectPhotosBtn;
let backToEventsBtn;
let addCategoryPhotoBtn;
let emptyPhotosState;

/* ===================================
   INICIALIZACIÓN
   =================================== */

/**
 * Inicializa el gestor de fotos
 */
export function initPhotoManager() {
    console.log('📸 Inicializando gestor de fotos...');
    
    // Obtener elementos del DOM
    photoManagerView = document.getElementById('photoManagerView');
    eventInfoSection = document.getElementById('eventInfoSection');
    categoriesTabsContainer = document.getElementById('categoriesTabsContainer');
    photosGridContainer = document.getElementById('photosGridContainer');
    addPhotosSection = document.getElementById('addPhotosSection');
    capturePhotoBtn = document.getElementById('capturePhotoBtn');
    selectPhotosBtn = document.getElementById('selectPhotosBtn');
    backToEventsBtn = document.getElementById('backToEventsBtn');
    addCategoryPhotoBtn = document.getElementById('addCategoryPhotoBtn');
    emptyPhotosState = document.getElementById('emptyPhotosState');
    
    // Configurar event listeners
    setupPhotoManagerListeners();
    
    console.log('✅ Gestor de fotos inicializado');
}

/**
 * Configura los event listeners
 */
function setupPhotoManagerListeners() {
    if (capturePhotoBtn) {
        capturePhotoBtn.addEventListener('click', handleCapturePhoto);
    }
    
    if (selectPhotosBtn) {
        selectPhotosBtn.addEventListener('click', handleSelectPhotos);
    }
    
    if (backToEventsBtn) {
        backToEventsBtn.addEventListener('click', handleBackToEvents);
    }
    
    if (addCategoryPhotoBtn) {
        addCategoryPhotoBtn.addEventListener('click', handleAddCategory);
    }
}

/* ===================================
   CARGAR EVENTO
   =================================== */

/**
 * Abre el gestor de fotos para un evento
 * @param {string} eventId - ID del evento
 */
export async function openPhotoManager(eventId) {
    try {
        console.log('📂 Abriendo gestor de fotos para evento:', eventId);
        
        // Cargar evento
        const event = await getEventById(eventId);
        
        if (!event) {
            showMessage('Evento no encontrado', 'error');
            return;
        }
        
        // Guardar en estado
        photoManagerState.currentEvent = event;
        photoManagerState.photos = event.fotos || [];
        
        // Renderizar información del evento
        renderEventInfo(event);
        
        // Renderizar tabs de categorías
        renderCategoryTabs(event.categorias);
        
        // Seleccionar primera categoría o mostrar mensaje
        if (event.categorias && event.categorias.length > 0) {
            selectCategory(event.categorias[0].id);
        } else {
            showNoCategoriesMessage();
        }
        
        // Navegar a la vista
        window.navigateToView('photoManagerView');
        
        console.log('✅ Gestor de fotos abierto');
    } catch (error) {
        console.error('❌ Error al abrir gestor de fotos:', error);
        showMessage('Error al cargar el evento', 'error');
    }
}

/**
 * Renderiza la información del evento
 * @param {Object} event - Evento
 */
function renderEventInfo(event) {
    if (!eventInfoSection) return;
    
    const totalPhotos = event.fotos?.length || 0;
    
    eventInfoSection.innerHTML = `
        <div class="event-info-card">
            <h2 class="event-info-title">${event.nombre}</h2>
            <div class="event-info-details">
                <span class="event-info-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2"/>
                        <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    ${event.responsableNombre}
                </span>
                <span class="event-info-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" stroke-width="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                        <polyline points="21 15 16 10 5 21" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    ${totalPhotos} fotos
                </span>
            </div>
        </div>
    `;
}

/**
 * Renderiza los tabs de categorías
 * @param {Array} categories - Categorías
 */
function renderCategoryTabs(categories) {
    if (!categoriesTabsContainer) return;
    
    if (!categories || categories.length === 0) {
        categoriesTabsContainer.innerHTML = '';
        return;
    }
    
    categoriesTabsContainer.innerHTML = categories.map(cat => {
        const photoCount = countPhotosByCategory(photoManagerState.photos, cat.id);
        
        return `
            <button 
                class="category-tab" 
                data-category-id="${cat.id}"
                onclick="selectPhotoCategory('${cat.id}')"
                style="border-bottom: 3px solid ${cat.color};">
                <span class="category-tab-name">${cat.nombre}</span>
                <span class="category-tab-count">${photoCount}</span>
            </button>
        `;
    }).join('');
}

/**
 * Selecciona una categoría
 * @param {string} categoryId - ID de la categoría
 */
window.selectPhotoCategory = function(categoryId) {
    selectCategory(categoryId);
};

function selectCategory(categoryId) {
    photoManagerState.currentCategoryId = categoryId;
    
    // Actualizar tabs activos
    const tabs = document.querySelectorAll('.category-tab');
    tabs.forEach(tab => {
        if (tab.dataset.categoryId === categoryId) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    // Renderizar fotos de la categoría
    renderPhotosGrid(categoryId);
}

/* ===================================
   GRID DE FOTOS
   =================================== */

/**
 * Renderiza el grid de fotos
 * @param {string} categoryId - ID de la categoría
 */
function renderPhotosGrid(categoryId) {
    if (!photosGridContainer) return;
    
    const photos = filterPhotosByCategory(photoManagerState.photos, categoryId);
    
    if (photos.length === 0) {
        showEmptyPhotosState();
        return;
    }
    
    hideEmptyPhotosState();
    
    photosGridContainer.innerHTML = photos.map(photo => `
        <div class="photo-card" data-photo-id="${photo.id}">
            <img src="${photo.url}" alt="${photo.fileName}" class="photo-image" loading="lazy">
            <button class="photo-delete-btn" onclick="deletePhoto('${photo.id}')" type="button">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <polyline points="3 6 5 6 21 6" stroke="currentColor" stroke-width="2"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" stroke-width="2"/>
                </svg>
            </button>
        </div>
    `).join('');
}

/**
 * Muestra el estado vacío
 */
function showEmptyPhotosState() {
    if (emptyPhotosState) {
        emptyPhotosState.classList.remove('hidden');
    }
    if (photosGridContainer) {
        photosGridContainer.innerHTML = '';
    }
}

/**
 * Oculta el estado vacío
 */
function hideEmptyPhotosState() {
    if (emptyPhotosState) {
        emptyPhotosState.classList.add('hidden');
    }
}

/**
 * Muestra mensaje de sin categorías
 */
function showNoCategoriesMessage() {
    if (photosGridContainer) {
        photosGridContainer.innerHTML = `
            <div class="no-categories-message">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" stroke="currentColor" stroke-width="2"/>
                </svg>
                <h3>No hay categorías</h3>
                <p>Agrega categorías para organizar tus fotos</p>
                <button class="btn-primary" onclick="handleAddCategoryFromPhotos()">
                    Agregar Categoría
                </button>
            </div>
        `;
    }
}

/* ===================================
   CARGAR FOTOS
   =================================== */

/**
 * Maneja la captura de foto con cámara
 */
async function handleCapturePhoto() {
    if (!photoManagerState.currentCategoryId) {
        showMessage('Selecciona una categoría primero', 'error');
        return;
    }
    
    try {
        showMessage('Abriendo cámara...', 'info', 2000);
        
        const file = await capturePhoto();
        await processAndAddPhoto([file]);
        
    } catch (error) {
        console.error('❌ Error al capturar foto:', error);
        showMessage('Error al capturar la foto', 'error');
    }
}

/**
 * Maneja la selección múltiple de fotos
 */
async function handleSelectPhotos() {
    if (!photoManagerState.currentCategoryId) {
        showMessage('Selecciona una categoría primero', 'error');
        return;
    }
    
    try {
        const files = await selectMultiplePhotos();
        await processAndAddPhoto(files);
        
    } catch (error) {
        console.error('❌ Error al seleccionar fotos:', error);
        if (error.message !== 'No se seleccionaron fotos') {
            showMessage('Error al seleccionar las fotos', 'error');
        }
    }
}

/**
 * Procesa y agrega fotos
 * @param {FileList|Array} files - Archivos a procesar
 */
async function processAndAddPhoto(files) {
    if (photoManagerState.isUploading) {
        showMessage('Ya hay una carga en progreso', 'error');
        return;
    }
    
    photoManagerState.isUploading = true;
    
    try {
        showMessage(`Subiendo ${files.length} foto(s) a la nube...`, 'info');
        
        // Procesar y subir fotos a Firebase Storage
        const newPhotos = await processMultipleFiles(
            files, 
            photoManagerState.currentCategoryId,
            photoManagerState.currentEvent.id, // Pasar eventId
            (current, total, photo) => {
                showMessage(`Subiendo foto ${current} de ${total}...`, 'info', 1000);
            }
        );
        
        if (newPhotos.length === 0) {
            showMessage('No se pudo subir ninguna foto', 'error');
            photoManagerState.isUploading = false;
            return;
        }
        
        // Agregar a las fotos del evento
        photoManagerState.photos = [...photoManagerState.photos, ...newPhotos];
        
        // Guardar en Firestore (solo las URLs)
        await savePhotosToEvent();
        
        // Re-renderizar
        renderCategoryTabs(photoManagerState.currentEvent.categorias);
        renderPhotosGrid(photoManagerState.currentCategoryId);
        
        showMessage(`✅ ${newPhotos.length} foto(s) subida(s) correctamente`, 'success');
        
    } catch (error) {
        console.error('❌ Error al procesar fotos:', error);
        showMessage('Error al subir las fotos', 'error');
    } finally {
        photoManagerState.isUploading = false;
    }
}

/**
 * Elimina una foto
 * @param {string} photoId - ID de la foto
 */
window.deletePhoto = async function(photoId) {
    const confirm = window.confirm('¿Eliminar esta foto?');
    if (!confirm) return;
    
    try {
        console.log('🗑️ Eliminando foto:', photoId);
        
        // Eliminar del array Y de Storage (esperar a que termine)
        photoManagerState.photos = await removePhotoById(photoManagerState.photos, photoId);
        
        // Guardar en Firestore
        await savePhotosToEvent();
        
        // Re-renderizar
        renderCategoryTabs(photoManagerState.currentEvent.categorias);
        renderPhotosGrid(photoManagerState.currentCategoryId);
        
        showMessage('Foto eliminada', 'success');
        
    } catch (error) {
        console.error('❌ Error al eliminar foto:', error);
        showMessage('Error al eliminar la foto', 'error');
    }
};

/* ===================================
   GUARDAR EN FIRESTORE
   =================================== */

/**
 * Guarda las fotos en el evento
 */
async function savePhotosToEvent() {
    try {
        await updateEvent(photoManagerState.currentEvent.id, {
            fotos: photoManagerState.photos
        });
        
        console.log('✅ Fotos guardadas en Firestore');
    } catch (error) {
        console.error('❌ Error al guardar fotos:', error);
        throw error;
    }
}

/* ===================================
   NAVEGACIÓN
   =================================== */

/**
 * Vuelve a la lista de eventos
 */
async function handleBackToEvents() {
    // Guardar antes de salir
    try {
        await savePhotosToEvent();
    } catch (error) {
        console.error('Error al guardar:', error);
    }
    
    // Limpiar estado
    photoManagerState.currentEvent = null;
    photoManagerState.currentCategoryId = null;
    photoManagerState.photos = [];
    
    // Navegar y recargar eventos
    window.navigateToView('homeView');
    window.dispatchEvent(new CustomEvent('eventUpdated'));
}

/**
 * Agrega una categoría desde el gestor de fotos
 */
function handleAddCategory() {
    // Redirigir a editar evento
    window.editEvent(photoManagerState.currentEvent.id);
}

window.handleAddCategoryFromPhotos = handleAddCategory;

/* ===================================
   EXPORTACIONES
   =================================== */

export {
    photoManagerState
};