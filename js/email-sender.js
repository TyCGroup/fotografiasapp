/* ===================================
   MÓDULO DE ENVÍO DE EMAILS - T&C GROUP
   Envío de reportes por correo usando Firebase
   =================================== */

import { db } from './storage.js';
import { collection, addDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
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
 * Envía un email con el reporte adjunto
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
        
        showMessage('Preparando email...', 'info');
        
        // Convertir Blob a Base64 para adjuntar
        const base64Report = await blobToBase64(reportBlob);
        
        // Crear documento en la colección 'mail'
        // La extensión de Firebase lo detectará y enviará el email
        const emailData = {
            to: validEmails,
            message: {
                subject: `Reporte Fotográfico - ${eventName}`,
                html: generateEmailHTML(eventName),
                attachments: [
                    {
                        filename: fileName,
                        content: base64Report.split(',')[1], // Remover el prefijo data:...
                        encoding: 'base64'
                    }
                ]
            }
        };
        
        console.log('📤 Enviando email a:', validEmails);
        
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
 * Genera el HTML del email
 * @param {string} eventName - Nombre del evento
 * @returns {string} - HTML del email
 */
function generateEmailHTML(eventName) {
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
                <p>En el archivo adjunto encontrarás todas las fotografías organizadas por categorías.</p>
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
 * Convierte un Blob a Base64
 * @param {Blob} blob - Blob a convertir
 * @returns {Promise<string>} - String Base64
 */
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
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
        .split(/[,;\\s]+/)
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