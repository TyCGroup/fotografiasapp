/* ===================================
   MÓDULO DE CATEGORÍAS - T&C GROUP
   Gestión de categorías de eventos
   =================================== */

import { generateId } from './utils.js';

/* ===================================
   COLORES PREDEFINIDOS PARA CATEGORÍAS
   =================================== */

const CATEGORY_COLORS = [
    '#3b82f6', // Azul
    '#10b981', // Verde
    '#f59e0b', // Amarillo
    '#ef4444', // Rojo
    '#8b5cf6', // Púrpura
    '#ec4899', // Rosa
    '#06b6d4', // Cian
    '#f97316', // Naranja
    '#14b8a6', // Teal
    '#6366f1', // Índigo
    '#84cc16', // Lima
    '#a855f7', // Violeta
];

// Índice para rotar colores
let colorIndex = 0;

/* ===================================
   FUNCIONES DE CATEGORÍAS
   =================================== */

/**
 * Crea una nueva categoría
 * @param {string} nombre - Nombre de la categoría
 * @returns {Object} - Objeto de categoría
 */
export function createCategory(nombre) {
    if (!nombre || nombre.trim() === '') {
        throw new Error('El nombre de la categoría es requerido');
    }

    const category = {
        id: generateId(),
        nombre: nombre.trim(),
        color: getNextColor(),
        createdAt: new Date().toISOString()
    };

    console.log('✅ Categoría creada:', category);
    return category;
}

/**
 * Valida el nombre de una categoría
 * @param {string} nombre - Nombre a validar
 * @param {Array} existingCategories - Categorías existentes
 * @returns {Object} - {valid: boolean, error: string}
 */
export function validateCategoryName(nombre, existingCategories = []) {
    if (!nombre || nombre.trim() === '') {
        return {
            valid: false,
            error: 'El nombre de la categoría no puede estar vacío'
        };
    }

    if (nombre.trim().length < 2) {
        return {
            valid: false,
            error: 'El nombre debe tener al menos 2 caracteres'
        };
    }

    if (nombre.trim().length > 30) {
        return {
            valid: false,
            error: 'El nombre no puede exceder 30 caracteres'
        };
    }

    // Verificar duplicados
    const isDuplicate = existingCategories.some(
        cat => cat.nombre.toLowerCase() === nombre.trim().toLowerCase()
    );

    if (isDuplicate) {
        return {
            valid: false,
            error: 'Ya existe una categoría con este nombre'
        };
    }

    return { valid: true, error: null };
}

/**
 * Agrega una categoría a un evento
 * @param {Array} categories - Array de categorías existentes
 * @param {string} nombre - Nombre de la nueva categoría
 * @returns {Array} - Array actualizado de categorías
 */
export function addCategoryToEvent(categories, nombre) {
    const validation = validateCategoryName(nombre, categories);
    
    if (!validation.valid) {
        throw new Error(validation.error);
    }

    const newCategory = createCategory(nombre);
    return [...categories, newCategory];
}

/**
 * Elimina una categoría de un evento
 * @param {Array} categories - Array de categorías
 * @param {string} categoryId - ID de la categoría a eliminar
 * @returns {Array} - Array actualizado sin la categoría
 */
export function removeCategoryFromEvent(categories, categoryId) {
    return categories.filter(cat => cat.id !== categoryId);
}

/**
 * Actualiza el nombre de una categoría
 * @param {Array} categories - Array de categorías
 * @param {string} categoryId - ID de la categoría
 * @param {string} newName - Nuevo nombre
 * @returns {Array} - Array actualizado
 */
export function updateCategoryName(categories, categoryId, newName) {
    // Validar que no exista otra categoría con ese nombre
    const otherCategories = categories.filter(cat => cat.id !== categoryId);
    const validation = validateCategoryName(newName, otherCategories);
    
    if (!validation.valid) {
        throw new Error(validation.error);
    }

    return categories.map(cat => 
        cat.id === categoryId 
            ? { ...cat, nombre: newName.trim() }
            : cat
    );
}

/**
 * Obtiene el siguiente color de la paleta
 * @returns {string} - Código de color hexadecimal
 */
function getNextColor() {
    const color = CATEGORY_COLORS[colorIndex];
    colorIndex = (colorIndex + 1) % CATEGORY_COLORS.length;
    return color;
}

/**
 * Reinicia el índice de colores
 */
export function resetColorIndex() {
    colorIndex = 0;
}

/**
 * Obtiene un color aleatorio de la paleta
 * @returns {string} - Código de color hexadecimal
 */
export function getRandomColor() {
    const randomIndex = Math.floor(Math.random() * CATEGORY_COLORS.length);
    return CATEGORY_COLORS[randomIndex];
}

/**
 * Renderiza un chip de categoría (HTML)
 * @param {Object} category - Objeto de categoría
 * @param {boolean} removable - Si se puede eliminar
 * @returns {string} - HTML string
 */
export function renderCategoryChip(category, removable = false) {
    const removeBtn = removable 
        ? `<button class="chip-remove" onclick="removeCategory('${category.id}')" type="button">
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                   <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
               </svg>
           </button>`
        : '';

    return `
        <div class="category-chip" data-category-id="${category.id}" style="background-color: ${category.color}20; color: ${category.color}; border: 1px solid ${category.color}40;">
            <span class="chip-text">${category.nombre}</span>
            ${removeBtn}
        </div>
    `;
}

/**
 * Cuenta las fotos por categoría
 * @param {Array} photos - Array de fotos
 * @param {string} categoryId - ID de la categoría
 * @returns {number} - Cantidad de fotos
 */
export function countPhotosByCategory(photos, categoryId) {
    if (!photos || !Array.isArray(photos)) return 0;
    return photos.filter(photo => photo.categoryId === categoryId).length;
}

/**
 * Obtiene las categorías más usadas
 * @param {Array} events - Array de eventos
 * @param {number} limit - Cantidad máxima a retornar
 * @returns {Array} - Categorías ordenadas por frecuencia
 */
export function getMostUsedCategories(events, limit = 5) {
    const categoryCount = {};

    events.forEach(event => {
        if (event.categorias && Array.isArray(event.categorias)) {
            event.categorias.forEach(cat => {
                const name = cat.nombre.toLowerCase();
                categoryCount[name] = (categoryCount[name] || 0) + 1;
            });
        }
    });

    return Object.entries(categoryCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([name, count]) => ({ name, count }));
}

/* ===================================
   EXPORTACIONES
   =================================== */

export default {
    createCategory,
    validateCategoryName,
    addCategoryToEvent,
    removeCategoryFromEvent,
    updateCategoryName,
    resetColorIndex,
    getRandomColor,
    renderCategoryChip,
    countPhotosByCategory,
    getMostUsedCategories
};