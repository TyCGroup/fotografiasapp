/* ===================================
   MÓDULO DE CATEGORÍAS - T&C GROUP
   Gestión de categorías con catálogo predefinido
   =================================== */

import { generateId } from './utils.js';

/* ===================================
   CATÁLOGO PREDEFINIDO DE CATEGORÍAS
   =================================== */

export const CATALOG_CATEGORIES = [
    { nombre: 'Hospedaje', color: '#3b82f6', icon: '🏨' },
    { nombre: 'Salones / Recintos', color: '#10b981', icon: '🏛️' },
    { nombre: 'A&B', color: '#f59e0b', icon: '🍽️' },
    { nombre: 'A/V', color: '#ef4444', icon: '🎬' },
    { nombre: 'Producción/Templetes/Alfombra', color: '#8b5cf6', icon: '🎭' },
    { nombre: 'Mobiliario', color: '#ec4899', icon: '🪑' },
    { nombre: 'Internet/Tecnología/Cómputo', color: '#06b6d4', icon: '💻' },
    { nombre: 'Interpretación', color: '#f97316', icon: '🗣️' },
    { nombre: 'Transporte', color: '#14b8a6', icon: '🚐' },
    { nombre: 'Seguridad', color: '#6366f1', icon: '🛡️' },
    { nombre: 'Arreglos Florales', color: '#84cc16', icon: '💐' },
    { nombre: 'Marketing (Mejores fotos)', color: '#a855f7', icon: '📸' }
];

/* ===================================
   COLORES ADICIONALES (para categorías personalizadas)
   =================================== */

const ADDITIONAL_COLORS = [
    '#0ea5e9', // Sky
    '#22c55e', // Green
    '#eab308', // Yellow
    '#f43f5e', // Rose
    '#a78bfa', // Violet
    '#fb923c', // Orange
    '#2dd4bf', // Teal
    '#818cf8', // Indigo
];

let colorIndex = 0;

/* ===================================
   FUNCIONES DE CATEGORÍAS
   =================================== */

/**
 * Crea una nueva categoría
 * @param {string} nombre - Nombre de la categoría
 * @param {string} color - Color (opcional)
 * @param {string} icon - Icono (opcional)
 * @returns {Object} - Objeto de categoría
 */
export function createCategory(nombre, color = null, icon = null) {
    if (!nombre || nombre.trim() === '') {
        throw new Error('El nombre de la categoría es requerido');
    }

    const category = {
        id: generateId(),
        nombre: nombre.trim(),
        color: color || getNextColor(),
        icon: icon || null,
        isCustom: !color, // Si no tiene color predefinido, es personalizada
        createdAt: new Date().toISOString()
    };

    console.log('✅ Categoría creada:', category);
    return category;
}

/**
 * Crea una categoría desde el catálogo
 * @param {string} nombre - Nombre de la categoría del catálogo
 * @returns {Object} - Objeto de categoría
 */
export function createCategoryFromCatalog(nombre) {
    const catalogItem = CATALOG_CATEGORIES.find(cat => cat.nombre === nombre);
    
    if (!catalogItem) {
        throw new Error('Categoría no encontrada en el catálogo');
    }

    return createCategory(catalogItem.nombre, catalogItem.color, catalogItem.icon);
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

    if (nombre.trim().length > 50) {
        return {
            valid: false,
            error: 'El nombre no puede exceder 50 caracteres'
        };
    }

    // Verificar duplicados (case-insensitive)
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
 * @param {string} color - Color (opcional)
 * @param {string} icon - Icono (opcional)
 * @returns {Array} - Array actualizado de categorías
 */
export function addCategoryToEvent(categories, nombre, color = null, icon = null) {
    const validation = validateCategoryName(nombre, categories);
    
    if (!validation.valid) {
        throw new Error(validation.error);
    }

    const newCategory = createCategory(nombre, color, icon);
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
 * Obtiene el siguiente color de la paleta adicional
 * @returns {string} - Código de color hexadecimal
 */
function getNextColor() {
    const color = ADDITIONAL_COLORS[colorIndex];
    colorIndex = (colorIndex + 1) % ADDITIONAL_COLORS.length;
    return color;
}

/**
 * Reinicia el índice de colores
 */
export function resetColorIndex() {
    colorIndex = 0;
}

/**
 * Obtiene categorías no usadas del catálogo
 * @param {Array} usedCategories - Categorías ya agregadas
 * @returns {Array} - Categorías disponibles del catálogo
 */
export function getAvailableCatalogCategories(usedCategories = []) {
    const usedNames = usedCategories.map(cat => cat.nombre.toLowerCase());
    
    return CATALOG_CATEGORIES.filter(
        catalogCat => !usedNames.includes(catalogCat.nombre.toLowerCase())
    );
}

/**
 * Renderiza un chip de categoría (HTML)
 * @param {Object} category - Objeto de categoría
 * @param {boolean} removable - Si se puede eliminar
 * @returns {string} - HTML string
 */
export function renderCategoryChip(category, removable = false) {
    const icon = category.icon ? `<span class="chip-icon">${category.icon}</span>` : '';
    const customBadge = category.isCustom ? `<span class="chip-badge">Personalizada</span>` : '';
    
    const removeBtn = removable 
        ? `<button class="chip-remove" onclick="removeCategory('${category.id}')" type="button">
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                   <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
               </svg>
           </button>`
        : '';

    return `
        <div class="category-chip" data-category-id="${category.id}" style="background-color: ${category.color}20; color: ${category.color}; border: 1px solid ${category.color}40;">
            ${icon}
            <span class="chip-text">${category.nombre}</span>
            ${customBadge}
            ${removeBtn}
        </div>
    `;
}

/**
 * Renderiza botón de categoría del catálogo
 * @param {Object} catalogCategory - Categoría del catálogo
 * @returns {string} - HTML string
 */
export function renderCatalogButton(catalogCategory) {
    return `
        <button type="button" 
                class="catalog-category-btn" 
                onclick="addCatalogCategory('${catalogCategory.nombre}')"
                style="border-color: ${catalogCategory.color}40; color: ${catalogCategory.color};">
            <span class="catalog-icon">${catalogCategory.icon}</span>
            <span class="catalog-name">${catalogCategory.nombre}</span>
        </button>
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
    CATALOG_CATEGORIES,
    createCategory,
    createCategoryFromCatalog,
    validateCategoryName,
    addCategoryToEvent,
    removeCategoryFromEvent,
    updateCategoryName,
    resetColorIndex,
    getAvailableCatalogCategories,
    renderCategoryChip,
    renderCatalogButton,
    countPhotosByCategory,
    getMostUsedCategories
};