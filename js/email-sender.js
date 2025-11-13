/* ===================================
   MÓDULO DE ENVÍO DE EMAILS - T&C GROUP
   Envío de reportes por correo usando Firebase Storage
   =================================== */

import { db, storage } from './storage.js';
import { collection, addDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';
import { showMessage } from './utils.js';

/* ===================================
   CONFIGURACIÓN
   =================================== */

// Nombre de la colección que usa la extensión de Firebase
const EMAIL_COLLECTION = 'mail';

/* ===================================
   ENVÍO DE EMAILS
   =================================== */

/**
 * Envía un email con link de descarga del reporte
 * @param {Array<string>} recipients - Array de emails destinatarios
 * @param {string} eventName - Nombre del evento
 * @param {Blob} reportBlob - Blob del documento Word
 * @param {string} fileName - Nombre del archivo
 * @returns {Promise<boolean>}
 */
export async function sendReportByEmail(recipients, eventName, reportBlob, fileName) {
    try {
        console.log('📧 Preparando envío de email...');
        
        // Validar destinatarios
        if (!recipients || recipients.length === 0) {
            throw new Error('Debes agregar al menos un destinatario');
        }
        
        // Validar emails
        const validEmails = recipients.filter(email => isValidEmail(email));
        if (validEmails.length === 0) {
            throw new Error('Ningún email es válido');
        }
        
        // Verificar tamaño del archivo
        const fileSize = reportBlob.size;
        console.log(`📊 Tamaño del archivo: ${(fileSize / 1024).toFixed(2)} KB`);
        
        showMessage('Subiendo reporte a la nube...', 'info', 3000);
        
        // Subir archivo a Firebase Storage
        const downloadURL = await uploadReportToStorage(reportBlob, fileName, eventName);
        
        console.log('✅ Archivo subido, generando email...');
        showMessage('Preparando email...', 'info');
        
        // Crear email con link de descarga
        const emailData = {
            to: validEmails,
            message: {
                subject: `Reporte Fotográfico - ${eventName}`,
                html: generateEmailHTML(eventName, downloadURL)
            }
        };
        
        console.log('📤 Enviando email a:', validEmails);
        showMessage('Enviando email...', 'info');
        
        // Agregar a Firestore - la extensión se encarga del envío
        await addDoc(collection(db, EMAIL_COLLECTION), emailData);
        
        console.log('✅ Email agregado a la cola de envío');
        
        return true;
        
    } catch (error) {
        console.error('❌ Error al enviar email:', error);
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
 * @param {string} eventName - Nombre del evento
 * @param {string} downloadURL - URL de descarga
 * @returns {string} - HTML del email
 */
function generateEmailHTML(eventName, downloadURL) {
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
                }
                .header {
                    background: linear-gradient(135deg, #2563eb, #1e40af);
                    color: white;
                    padding: 30px;
                    text-align: center;
                    border-radius: 10px 10px 0 0;
                }
                .header h1 {
                    margin: 0;
                    font-size: 24px;
                }
                .content {
                    background: #f9fafb;
                    padding: 30px;
                    border-radius: 0 0 10px 10px;
                }
                .download-section {
                    text-align: center;
                    margin: 30px 0;
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
                    transition: transform 0.2s;
                }
                .download-button:hover {
                    transform: scale(1.05);
                }
                .note {
                    color: #6b7280;
                    font-size: 14px;
                    text-align: center;
                    margin-top: 15px;
                }
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #e5e7eb;
                    color: #6b7280;
                    font-size: 14px;
                }
                .brand {
                    font-weight: bold;
                    color: #2563eb;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>T&C GROUP</h1>
                <p>Reporte Fotográfico</p>
            </div>
            <div class="content">
                <h2>Hola,</h2>
                <p>Te compartimos el reporte fotográfico del evento:</p>
                <h3 style="color: #2563eb;">${eventName}</h3>
                <p>Haz clic en el botón de abajo para descargar el reporte completo con todas las fotografías organizadas por categorías.</p>
                
                <div class="download-section">
                    <a href="${downloadURL}" class="download-button">
                        📥 Descargar Reporte
                    </a>
                    <p class="note">El link estará disponible por 7 días</p>
                </div>
                
                <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
                <p>Saludos cordiales,<br><span class="brand">T&C Group</span></p>
            </div>
            <div class="footer">
                <p>
                    Ángel Urraza #625 Col. Del Valle, Benito Juárez, CDMX.<br>
                    +52 55 9146 7500 | tycgroup.com
                </p>
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