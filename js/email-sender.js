/* ===================================
   MÓDULO DE ENVÍO DE EMAILS - T&C GROUP
   Envío de reportes por correo usando Firebase Storage
   =================================== */

import { db, storage } from './storage.js';
import { collection, addDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';
import { showMessage } from './utils.js';
import { getCurrentUser } from './auth.js';

/* ===================================
   CONFIGURACIÓN
   =================================== */

// Nombre de la colección que usa la extensión de Firebase
const EMAIL_COLLECTION = 'mail';

/* ===================================
   ENVÍO DE EMAILS
   =================================== */

/**
 * Envía un email con link de descarga del reporte al usuario actual
 * @param {string} eventName - Nombre del evento
 * @param {string} responsableNombre - Nombre del responsable del evento
 * @param {number} photoCount - Cantidad de fotos
 * @param {number} categoryCount - Cantidad de categorías
 * @param {Blob} reportBlob - Blob del documento Word
 * @param {string} fileName - Nombre del archivo
 * @returns {Promise<boolean>}
 */
export async function sendReportByEmail(eventName, responsableNombre, photoCount, categoryCount, reportBlob, fileName) {
    try {
        console.log('📧 Preparando envío de email...');
        
        // Obtener el usuario actual (quien está generando el reporte)
        const currentUser = getCurrentUser();
        
        if (!currentUser || !currentUser.email) {
            throw new Error('No se pudo obtener el email del usuario actual. Por favor, inicia sesión nuevamente.');
        }
        
        console.log('👤 Usuario actual:', currentUser.email);
        console.log('📨 El reporte se enviará a:', currentUser.email);
        
        // Validar email
        if (!isValidEmail(currentUser.email)) {
            throw new Error('El email del usuario no es válido');
        }
        
        // Verificar tamaño del archivo
        const fileSize = reportBlob.size;
        const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);
        console.log(`📊 Tamaño del archivo: ${fileSizeMB} MB`);
        
        showMessage('Subiendo reporte a la nube...', 'info', 3000);
        
        // Subir archivo a Firebase Storage
        const downloadURL = await uploadReportToStorage(reportBlob, fileName, eventName);
        
        console.log('✅ Archivo subido, generando email...');
        showMessage('Preparando email...', 'info');
        
        // Crear email con link de descarga para el usuario actual
        const emailData = {
            to: [currentUser.email], // Array con el email del usuario actual
            message: {
                subject: `Reporte Fotográfico - ${eventName}`,
                html: generateEmailHTML(
                    currentUser.displayName || 'Usuario',
                    eventName,
                    responsableNombre,
                    photoCount,
                    categoryCount,
                    downloadURL
                )
            }
        };
        
        console.log('📤 Enviando email a:', currentUser.email);
        showMessage('Enviando email...', 'info');
        
        // Agregar a Firestore - la extensión se encarga del envío
        await addDoc(collection(db, EMAIL_COLLECTION), emailData);
        
        console.log('✅ Email agregado a la cola de envío');
        showMessage(`Email enviado exitosamente a ${currentUser.email}`, 'success');
        
        return true;
        
    } catch (error) {
        console.error('❌ Error al enviar email:', error);
        showMessage(error.message || 'Error al enviar email', 'error');
        throw error;
    }
}

/**
 * Sube el reporte a Firebase Storage y devuelve la URL de descarga
 * @param {Blob} reportBlob - Blob del documento
 * @param {string} fileName - Nombre del archivo
 * @param {string} eventName - Nombre del evento
 * @returns {Promise<string>} - URL de descarga
 */
async function uploadReportToStorage(reportBlob, fileName, eventName) {
    try {
        // Crear referencia en Storage con timestamp para evitar duplicados
        const timestamp = Date.now();
        const sanitizedEventName = eventName.replace(/[^a-zA-Z0-9]/g, '_');
        const storagePath = `reportes/${sanitizedEventName}_${timestamp}/${fileName}`;
        
        const storageRef = ref(storage, storagePath);
        
        // Subir el archivo
        console.log(`📤 Subiendo a: ${storagePath}`);
        await uploadBytes(storageRef, reportBlob, {
            contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            customMetadata: {
                'evento': eventName,
                'generado': new Date().toISOString()
            }
        });
        
        // Obtener URL de descarga
        const downloadURL = await getDownloadURL(storageRef);
        console.log('✅ URL generada:', downloadURL);
        
        return downloadURL;
        
    } catch (error) {
        console.error('❌ Error al subir archivo a Storage:', error);
        throw new Error('No se pudo subir el archivo a la nube');
    }
}

/**
 * Genera el HTML del email con link de descarga
 * @param {string} userName - Nombre del usuario destinatario
 * @param {string} eventName - Nombre del evento
 * @param {string} responsableNombre - Nombre del responsable
 * @param {number} photoCount - Cantidad de fotos
 * @param {number} categoryCount - Cantidad de categorías
 * @param {string} downloadURL - URL de descarga
 * @returns {string} - HTML del email
 */
function generateEmailHTML(userName, eventName, responsableNombre, photoCount, categoryCount, downloadURL) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f3f4f6;
                }
                .container {
                    background: white;
                    border-radius: 10px;
                    overflow: hidden;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                .header {
                    background: linear-gradient(135deg, #2563eb, #1e40af);
                    color: white;
                    padding: 30px;
                    text-align: center;
                }
                .header h1 {
                    margin: 0;
                    font-size: 24px;
                }
                .header p {
                    margin: 10px 0 0 0;
                    opacity: 0.9;
                }
                .content {
                    padding: 30px;
                }
                .greeting {
                    font-size: 18px;
                    margin-bottom: 20px;
                }
                .event-info {
                    background: #f9fafb;
                    border-left: 4px solid #2563eb;
                    padding: 20px;
                    margin: 20px 0;
                    border-radius: 4px;
                }
                .event-info h3 {
                    margin: 0 0 15px 0;
                    color: #2563eb;
                }
                .info-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 8px 0;
                    border-bottom: 1px solid #e5e7eb;
                }
                .info-row:last-child {
                    border-bottom: none;
                }
                .info-label {
                    font-weight: bold;
                    color: #4b5563;
                }
                .info-value {
                    color: #1f2937;
                }
                .download-section {
                    text-align: center;
                    margin: 30px 0;
                    padding: 20px;
                    background: #eff6ff;
                    border-radius: 8px;
                }
                .download-button {
                    display: inline-block;
                    background: linear-gradient(135deg, #2563eb, #1e40af);
                    color: white;
                    padding: 15px 40px;
                    text-decoration: none;
                    border-radius: 8px;
                    font-weight: bold;
                    font-size: 16px;
                    transition: all 0.3s;
                    box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3);
                }
                .download-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 12px rgba(37, 99, 235, 0.4);
                }
                .note {
                    color: #6b7280;
                    font-size: 14px;
                    text-align: center;
                    margin-top: 15px;
                    font-style: italic;
                }
                .footer {
                    background: #f9fafb;
                    text-align: center;
                    padding: 20px;
                    border-top: 1px solid #e5e7eb;
                    color: #6b7280;
                    font-size: 14px;
                }
                .brand {
                    font-weight: bold;
                    color: #2563eb;
                }
                .alert {
                    background: #fef3c7;
                    border-left: 4px solid #f59e0b;
                    padding: 15px;
                    margin: 20px 0;
                    border-radius: 4px;
                    font-size: 14px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📸 T&C GROUP</h1>
                    <p>Reporte Fotográfico Generado</p>
                </div>
                
                <div class="content">
                    <div class="greeting">
                        Hola <strong>${userName}</strong>,
                    </div>
                    
                    <p>Tu reporte fotográfico ha sido generado exitosamente y está listo para descargar.</p>
                    
                    <div class="event-info">
                        <h3>Información del Evento</h3>
                        <div class="info-row">
                            <span class="info-label">Evento:</span>
                            <span class="info-value">${eventName}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Responsable:</span>
                            <span class="info-value">${responsableNombre}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Total de fotos:</span>
                            <span class="info-value">${photoCount} fotos</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Categorías:</span>
                            <span class="info-value">${categoryCount} categorías</span>
                        </div>
                    </div>
                    
                    <div class="download-section">
                        <p style="margin-top: 0; color: #1f2937;">
                            <strong>El reporte completo está disponible para descargar:</strong>
                        </p>
                        <a href="${downloadURL}" class="download-button">
                            📥 Descargar Reporte (Word)
                        </a>
                        <p class="note">
                            ⏰ El enlace estará disponible por 7 días
                        </p>
                    </div>
                    
                    <div class="alert">
                        <strong>💡 Nota:</strong> El reporte está en formato Word (.docx) y contiene todas las fotografías organizadas por categorías.
                    </div>
                    
                    <p>Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos.</p>
                    
                    <p style="margin-top: 30px;">
                        Saludos cordiales,<br>
                        <span class="brand">Equipo T&C Group</span>
                    </p>
                </div>
                
                <div class="footer">
                    <p>
                        <strong>T&C Group</strong><br>
                        Ángel Urraza #625 Col. Del Valle, Benito Juárez, CDMX<br>
                        📞 +52 55 9146 7500 | 🌐 tycgroup.com
                    </p>
                    <p style="font-size: 12px; color: #9ca3af; margin-top: 10px;">
                        Este es un correo automático del Sistema de Gestión Fotográfica
                    </p>
                </div>
            </div>
        </body>
        </html>
    `;
}

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
 * Separa múltiples emails (por coma, punto y coma, o espacio)
 * @param {string} emailsString - String con múltiples emails
 * @returns {Array<string>}
 */
export function parseMultipleEmails(emailsString) {
    if (!emailsString) return [];
    
    // Separar por coma, punto y coma, o espacio
    const emails = emailsString
        .split(/[,;\s]+/)
        .map(email => email.trim())
        .filter(email => email.length > 0);
    
    return emails;
}

/* ===================================
   EXPORTACIONES
   =================================== */

export default {
    sendReportByEmail,
    parseMultipleEmails
};