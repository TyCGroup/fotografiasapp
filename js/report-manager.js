/* ===================================
   REPORT MANAGER - T&C GROUP
   UI para gestionar generación y envío de reportes
   =================================== */

import { getAllEvents } from './storage.js';
import { generateWordReport, downloadReport } from './reports.js';
import { sendReportByEmail, parseMultipleEmails } from './email-sender.js';
import { showMessage, openModal, closeModal, toggleButtonLoading } from './utils.js';

/* ===================================
   ESTADO
   =================================== */

const reportManagerState = {
    events: [],
    currentReportBlob: null,
    currentEventName: null,
    isGenerating: false
};

/* ===================================
   ELEMENTOS DEL DOM
   =================================== */

let reportsContainer;
let emptyReportsState;

/* ===================================
   INICIALIZACIÓN
   =================================== */

/**
 * Inicializa el gestor de reportes
 */
export function initReportManager() {
    console.log('📊 Inicializando gestor de reportes...');
    
    // Obtener elementos del DOM
    reportsContainer = document.getElementById('reportsContainer');
    emptyReportsState = document.getElementById('emptyReportsState');
    
    // Configurar event listeners
    setupEventListeners();
    
    console.log('✅ Gestor de reportes inicializado');
}

/**
 * Configura los event listeners
 */
function setupEventListeners() {
    // Ya no necesitamos listeners del modal
    console.log('Event listeners configurados');
}

/* ===================================
   CARGAR EVENTOS
   =================================== */

/**
 * Carga y renderiza los eventos con fotos
 */
export async function loadReportsView() {
    try {
        console.log('🔥 Cargando eventos para reportes...');
        
        const events = await getAllEvents();
        
        // Filtrar solo eventos con fotos
        const eventsWithPhotos = events.filter(event => 
            event.fotos && event.fotos.length > 0
        );
        
        reportManagerState.events = eventsWithPhotos;
        
        if (eventsWithPhotos.length === 0) {
            showEmptyState();
        } else {
            renderReportsList(eventsWithPhotos);
        }
        
    } catch (error) {
        console.error('❌ Error al cargar eventos:', error);
        showMessage('Error al cargar eventos', 'error');
        showEmptyState();
    }
}

/**
 * Renderiza la lista de reportes
 * @param {Array} events - Eventos con fotos
 */
function renderReportsList(events) {
    if (!reportsContainer) return;
    
    hideEmptyState();
    
    reportsContainer.innerHTML = events.map(event => {
        const photoCount = event.fotos?.length || 0;
        const categoryCount = event.categorias?.length || 0;
        
        return `
            <div class="report-card">
                <div class="report-header">
                    <div class="report-info">
                        <h3>${event.nombre}</h3>
                        <div class="report-meta">
                            <div class="report-meta-item">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2"/>
                                    <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2"/>
                                </svg>
                                ${event.responsableNombre}
                            </div>
                            <div class="report-meta-item">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" stroke-width="2"/>
                                    <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                                    <polyline points="21 15 16 10 5 21" stroke="currentColor" stroke-width="2"/>
                                </svg>
                                ${photoCount} fotos en ${categoryCount} categorías
                            </div>
                        </div>
                    </div>
                    <span class="status-badge success">
                        Listo
                    </span>
                </div>
                <div class="report-actions">
                    <button class="btn-generate-report" onclick="generateReport('${event.id}', '${event.nombre.replace(/'/g, "\\'")}')">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" stroke-width="2"/>
                            <polyline points="7 10 12 15 17 10" stroke="currentColor" stroke-width="2"/>
                            <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" stroke-width="2"/>
                        </svg>
                        <span>Generar y Enviar Reporte</span>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Muestra el estado vacío
 */
function showEmptyState() {
    if (emptyReportsState) {
        emptyReportsState.classList.remove('hidden');
    }
    if (reportsContainer) {
        reportsContainer.innerHTML = '';
    }
}

/**
 * Oculta el estado vacío
 */
function hideEmptyState() {
    if (emptyReportsState) {
        emptyReportsState.classList.add('hidden');
    }
}

/* ===================================
   GENERAR REPORTE
   =================================== */

/**
 * Genera el reporte para un evento
 * @param {string} eventId - ID del evento
 * @param {string} eventName - Nombre del evento
 */
window.generateReport = async function(eventId, eventName) {
    if (reportManagerState.isGenerating) {
        showMessage('Ya hay un reporte generándose', 'error');
        return;
    }
    
    reportManagerState.isGenerating = true;
    
    // Obtener botón para mostrar loading
    const btn = event.target.closest('.btn-generate-report');
    const originalContent = btn ? btn.innerHTML : null;
    
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `
            <span class="spinner"></span>
            <span>Generando y enviando...</span>
        `;
    }
    
    try {
        console.log('📄 Generando reporte para:', eventName);
        
        showMessage('Generando reporte...', 'info');
        
        // Obtener datos del evento completo
        const { getEventById } = await import('./storage.js');
        const eventData = await getEventById(eventId);
        
        if (!eventData) {
            throw new Error('Evento no encontrado');
        }
        
        // Obtener email del responsable
        const { getActiveUsers } = await import('./storage.js');
        const usuarios = await getActiveUsers();
        const responsable = usuarios.find(u => u.id === eventData.responsableId);
        
        if (!responsable) {
            throw new Error('No se encontró el responsable del evento.');
        }
        
        if (!responsable.email) {
            throw new Error(`⚠️ El usuario "${responsable.nombre}" no tiene un email configurado en Firestore.\n\nPor favor, ve a Firestore y agrega un campo "email" al documento del usuario con ID: ${responsable.id}`);
        }
        
        showMessage(`Generando reporte para enviar a: ${responsable.email}...`, 'info');
        
        // Generar el reporte
        const reportBlob = await generateWordReport(eventId);
        
        showMessage('Enviando reporte por email...', 'info');
        
        // Enviar directamente al email del responsable
        const fileName = `Reporte_${eventName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.docx`;
        
        await sendReportByEmail(
            [responsable.email],
            eventName,
            reportBlob,
            fileName
        );
        
        showMessage(`✅ Reporte enviado correctamente a ${responsable.email}`, 'success', 5000);
        
    } catch (error) {
        console.error('❌ Error al generar/enviar reporte:', error);
        showMessage(error.message || 'Error al procesar el reporte', 'error', 6000);
    } finally {
        reportManagerState.isGenerating = false;
        
        // Restaurar botón
        if (btn && originalContent) {
            btn.disabled = false;
            btn.innerHTML = originalContent;
        }
    }
};

/* ===================================
   EXPORTACIONES
   =================================== */

export {
    reportManagerState
};