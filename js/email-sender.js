/* ===================================
   MÓDULO DE ENVÍO DE EMAILS - T&C GROUP
   Envía reportes por email usando EmailJS
   =================================== */

import { showMessage } from './utils.js';
import { getCurrentUser } from './auth.js';

/* ===================================
   CONFIGURACIÓN DE EMAILJS
   =================================== */

const EMAILJS_CONFIG = {
    serviceId: 'service_v94s42f',
    templateId: 'template_t1s9d1c',
    publicKey: 'yNNsGVOHTpW7zEJz8'
};

/* ===================================
   INICIALIZACIÓN
   =================================== */

/**
 * Inicializa EmailJS
 */
export function initEmailJS() {
    if (typeof emailjs === 'undefined') {
        console.error('❌ EmailJS no está cargado');
        return false;
    }
    
    emailjs.init(EMAILJS_CONFIG.publicKey);
    console.log('✅ EmailJS inicializado');
    return true;
}

/* ===================================
   ENVÍO DE EMAILS
   =================================== */

/**
 * Envía un email con el reporte
 * @param {Object} event - Datos del evento
 * @param {Blob} reportBlob - Blob del reporte Word
 * @param {string} downloadUrl - URL de descarga del reporte (opcional, para reportes grandes)
 * @returns {Promise<boolean>}
 */
export async function sendReportEmail(event, reportBlob = null, downloadUrl = null) {
    try {
        // Verificar que EmailJS esté inicializado
        if (typeof emailjs === 'undefined') {
            throw new Error('EmailJS no está disponible');
        }

        // Obtener el usuario actual (quien está generando el reporte)
        const currentUser = getCurrentUser();
        
        if (!currentUser || !currentUser.email) {
            throw new Error('No se pudo obtener el email del usuario actual');
        }

        console.log('📧 Enviando reporte a:', currentUser.email);

        // Preparar parámetros del email
        const emailParams = {
            to_email: currentUser.email,
            to_name: currentUser.displayName || 'Usuario',
            event_name: event.nombre,
            event_responsible: event.responsableNombre,
            photo_count: event.fotos?.length || 0,
            category_count: event.categorias?.length || 0
        };

        // Si hay URL de descarga (reportes grandes), usar template con link
        if (downloadUrl) {
            emailParams.download_url = downloadUrl;
            emailParams.is_large_file = 'true';
            
            console.log('📤 Enviando email con link de descarga...');
            showMessage('Enviando email con link de descarga...', 'info', 2000);
            
            const response = await emailjs.send(
                EMAILJS_CONFIG.serviceId,
                EMAILJS_CONFIG.templateId,
                emailParams
            );

            if (response.status === 200) {
                console.log('✅ Email enviado exitosamente');
                showMessage('¡Email enviado exitosamente!', 'success');
                return true;
            }
        } 
        // Si hay Blob y es pequeño, adjuntar el archivo
        else if (reportBlob) {
            // Convertir Blob a Base64
            const base64Report = await blobToBase64(reportBlob);
            
            // Calcular tamaño
            const fileSizeKB = reportBlob.size / 1024;
            console.log(`📄 Tamaño del reporte: ${fileSizeKB.toFixed(2)} KB`);

            // Si es muy grande (>4MB), no adjuntar
            if (fileSizeKB > 4096) {
                console.log('⚠️ Archivo muy grande para adjuntar por email');
                showMessage('Archivo muy grande. Descarga el reporte manualmente.', 'info');
                return false;
            }

            // Agregar archivo al email
            emailParams.attachment = base64Report;
            emailParams.attachment_name = `Reporte_${event.nombre.replace(/\s+/g, '_')}.docx`;
            
            console.log('📤 Enviando email con archivo adjunto...');
            showMessage('Enviando email con archivo adjunto...', 'info', 2000);

            const response = await emailjs.send(
                EMAILJS_CONFIG.serviceId,
                EMAILJS_CONFIG.templateId,
                emailParams
            );

            if (response.status === 200) {
                console.log('✅ Email enviado exitosamente');
                showMessage('¡Email enviado exitosamente!', 'success');
                return true;
            }
        }

        return false;

    } catch (error) {
        console.error('❌ Error al enviar email:', error);
        
        let errorMessage = 'Error al enviar email';
        
        if (error.message.includes('EmailJS')) {
            errorMessage = 'Error de configuración de EmailJS';
        } else if (error.message.includes('usuario')) {
            errorMessage = error.message;
        } else if (error.text) {
            errorMessage = `Error: ${error.text}`;
        }
        
        showMessage(errorMessage, 'error');
        return false;
    }
}

/* ===================================
   UTILIDADES
   =================================== */

/**
 * Convierte un Blob a Base64
 * @param {Blob} blob - Blob a convertir
 * @returns {Promise<string>}
 */
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/**
 * Obtiene el tamaño legible de un Blob
 * @param {Blob} blob - Blob
 * @returns {string}
 */
export function getBlobSize(blob) {
    const bytes = blob.size;
    
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/* ===================================
   EXPORTACIONES
   =================================== */

export default {
    initEmailJS,
    sendReportEmail,
    getBlobSize
};