/* ===================================
   MÓDULO DE REPORTES - T&C GROUP
   Generación de documentos Word con fotos
   Versión simplificada sin marcas de agua
   =================================== */

import { getEventById } from './storage.js';
import { filterPhotosByCategory } from './photos.js';
import { showMessage } from './utils.js';

/* ===================================
   HELPER: ESPERAR DOCX EN window
   =================================== */

/**
 * Espera activa a que la librería docx (UMD) esté disponible en window.
 * @param {number} maxMs - Tiempo máximo de espera en milisegundos
 * @param {number} intervalMs - Intervalo entre chequeos en milisegundos
 */
async function waitForDocx(maxMs = 6000, intervalMs = 150) {
    const t0 = Date.now();
    while (!window.docx) {
        await new Promise(res => setTimeout(res, intervalMs));
        if (Date.now() - t0 > maxMs) {
            throw new Error('La librería docx no se cargó correctamente. Verifica el <script src=".../docx..."> en app.html o tu conexión.');
        }
    }
}

/* ===================================
   GENERACIÓN DE REPORTE WORD
   =================================== */

/**
 * Genera un reporte en Word para un evento
 * @param {string} eventId - ID del evento
 * @returns {Promise<Blob>} - Documento Word como Blob
 */
export async function generateWordReport(eventId) {
    try {
        console.log('📄 Generando reporte para evento:', eventId);

        // Esperar a que la librería docx esté lista en window
        await waitForDocx();

        // Obtener datos del evento
        const event = await getEventById(eventId);

        if (!event) {
            throw new Error('Evento no encontrado');
        }

        // Validar que tenga fotos
        if (!event.fotos || event.fotos.length === 0) {
            throw new Error('El evento no tiene fotos para generar reporte');
        }

        showMessage('Generando reporte Word...', 'info');

        // Crear documento usando docx.js
        const doc = await createWordDocument(event);

        // Convertir a Blob
        const blob = await window.docx.Packer.toBlob(doc);

        console.log('✅ Reporte generado correctamente');

        return blob;

    } catch (error) {
        console.error('❌ Error al generar reporte:', error);
        throw error;
    }
}

/**
 * Crea el documento Word con la estructura completa
 * @param {Object} event - Datos del evento
 * @returns {Promise<Document>} - Documento docx
 */
async function createWordDocument(event) {
    // Defensa adicional: asegúrate de que docx esté disponible
    await waitForDocx();

    const { Document, Paragraph, TextRun, ImageRun, AlignmentType, Table, TableRow, TableCell, WidthType } = window.docx;

    // Descargar imágenes como buffers
    const imageBuffers = await downloadAllImages(event.fotos);

    // Array para todos los elementos del documento
    const children = [];

    // PORTADA
    // Espaciado superior
    children.push(new Paragraph({ text: "" }));
    children.push(new Paragraph({ text: "" }));
    children.push(new Paragraph({ text: "" }));

    // Título del evento
    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: event.nombre,
                    size: 48,
                    bold: true,
                    color: "1E40AF"
                })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
        })
    );

    // Subtítulo
    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: "REPORTE FOTOGRÁFICO",
                    size: 28,
                    color: "64748B"
                })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 800 }
        })
    );

    // Información del evento
    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: "Responsable: ",
                    size: 24,
                    bold: true
                }),
                new TextRun({
                    text: event.responsableNombre,
                    size: 24
                })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 }
        })
    );

    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: "Fecha: ",
                    size: 24,
                    bold: true
                }),
                new TextRun({
                    text: formatDate(event.fechaCreacion),
                    size: 24
                })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 }
        })
    );

    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: "Total de fotos: ",
                    size: 24,
                    bold: true
                }),
                new TextRun({
                    text: event.fotos.length.toString(),
                    size: 24
                })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 800 }
        })
    );

    // Separador
    children.push(new Paragraph({ text: "" }));
    children.push(new Paragraph({ text: "" }));

    // CATEGORÍAS CONTINUAS (sin saltos de página)
    if (event.categorias && event.categorias.length > 0) {
        for (const category of event.categorias) {
            const categoryPhotos = filterPhotosByCategory(event.fotos, category.id);

            if (categoryPhotos.length > 0) {
                // Título de la categoría
                children.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: category.nombre.toUpperCase(),
                                size: 36,
                                bold: true,
                                color: "1E40AF"
                            })
                        ],
                        spacing: { before: 600, after: 400 },
                        alignment: AlignmentType.LEFT
                    })
                );

                // Agregar fotos en grid de 3 columnas
                for (let i = 0; i < categoryPhotos.length; i += 3) {
                    const photo1 = categoryPhotos[i];
                    const photo2 = categoryPhotos[i + 1];
                    const photo3 = categoryPhotos[i + 2];

                    const cells = [];

                    // Primera foto
                    if (photo1 && imageBuffers.has(photo1.id)) {
                        cells.push(
                            new TableCell({
                                children: [
                                    new Paragraph({
                                        children: [
                                            new ImageRun({
                                                data: imageBuffers.get(photo1.id),
                                                transformation: {
                                                    width: 180,
                                                    height: 180
                                                }
                                            })
                                        ],
                                        alignment: AlignmentType.CENTER
                                    })
                                ],
                                width: { size: 33.33, type: WidthType.PERCENTAGE },
                                borders: {
                                    top: { style: 'none', size: 0, color: 'FFFFFF' },
                                    bottom: { style: 'none', size: 0, color: 'FFFFFF' },
                                    left: { style: 'none', size: 0, color: 'FFFFFF' },
                                    right: { style: 'none', size: 0, color: 'FFFFFF' }
                                }
                            })
                        );
                    }

                    // Segunda foto (si existe)
                    if (photo2 && imageBuffers.has(photo2.id)) {
                        cells.push(
                            new TableCell({
                                children: [
                                    new Paragraph({
                                        children: [
                                            new ImageRun({
                                                data: imageBuffers.get(photo2.id),
                                                transformation: {
                                                    width: 180,
                                                    height: 180
                                                }
                                            })
                                        ],
                                        alignment: AlignmentType.CENTER
                                    })
                                ],
                                width: { size: 33.33, type: WidthType.PERCENTAGE },
                                borders: {
                                    top: { style: 'none', size: 0, color: 'FFFFFF' },
                                    bottom: { style: 'none', size: 0, color: 'FFFFFF' },
                                    left: { style: 'none', size: 0, color: 'FFFFFF' },
                                    right: { style: 'none', size: 0, color: 'FFFFFF' }
                                }
                            })
                        );
                    } else if (photo1) {
                        // Celda vacía si no hay segunda foto
                        cells.push(
                            new TableCell({
                                children: [new Paragraph({ text: "" })],
                                width: { size: 33.33, type: WidthType.PERCENTAGE },
                                borders: {
                                    top: { style: 'none', size: 0, color: 'FFFFFF' },
                                    bottom: { style: 'none', size: 0, color: 'FFFFFF' },
                                    left: { style: 'none', size: 0, color: 'FFFFFF' },
                                    right: { style: 'none', size: 0, color: 'FFFFFF' }
                                }
                            })
                        );
                    }

                    // Tercera foto (si existe)
                    if (photo3 && imageBuffers.has(photo3.id)) {
                        cells.push(
                            new TableCell({
                                children: [
                                    new Paragraph({
                                        children: [
                                            new ImageRun({
                                                data: imageBuffers.get(photo3.id),
                                                transformation: {
                                                    width: 180,
                                                    height: 180
                                                }
                                            })
                                        ],
                                        alignment: AlignmentType.CENTER
                                    })
                                ],
                                width: { size: 33.33, type: WidthType.PERCENTAGE },
                                borders: {
                                    top: { style: 'none', size: 0, color: 'FFFFFF' },
                                    bottom: { style: 'none', size: 0, color: 'FFFFFF' },
                                    left: { style: 'none', size: 0, color: 'FFFFFF' },
                                    right: { style: 'none', size: 0, color: 'FFFFFF' }
                                }
                            })
                        );
                    } else if (photo1 || photo2) {
                        // Celda vacía si no hay tercera foto
                        cells.push(
                            new TableCell({
                                children: [new Paragraph({ text: "" })],
                                width: { size: 33.33, type: WidthType.PERCENTAGE },
                                borders: {
                                    top: { style: 'none', size: 0, color: 'FFFFFF' },
                                    bottom: { style: 'none', size: 0, color: 'FFFFFF' },
                                    left: { style: 'none', size: 0, color: 'FFFFFF' },
                                    right: { style: 'none', size: 0, color: 'FFFFFF' }
                                }
                            })
                        );
                    }

                    children.push(
                        new Table({
                            rows: [
                                new TableRow({
                                    children: cells
                                })
                            ],
                            width: { size: 100, type: WidthType.PERCENTAGE }
                        })
                    );

                    // Espaciado entre filas
                    children.push(new Paragraph({ text: "" }));
                }

                // Espaciado después de cada categoría
                children.push(new Paragraph({ text: "" }));
            }
        }
    }

    // Crear documento con una sola sección
    return new Document({
        sections: [{
            properties: {
                page: {
                    margin: {
                        top: 1000,
                        right: 1000,
                        bottom: 1000,
                        left: 1000
                    }
                }
            },
            children: children
        }]
    });
}

/**
 * Descarga todas las imágenes y las convierte a ArrayBuffer
 * @param {Array} photos - Array de fotos
 * @returns {Promise<Map>} - Map de photoId -> ArrayBuffer
 */
async function downloadAllImages(photos) {
    const imageBuffers = new Map();

    showMessage(`Descargando ${photos.length} imágenes...`, 'info');

    for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];

        try {
            const response = await fetch(photo.url);
            const blob = await response.blob();
            const arrayBuffer = await blob.arrayBuffer();

            imageBuffers.set(photo.id, arrayBuffer);

            if ((i + 1) % 5 === 0) {
                showMessage(`Descargadas ${i + 1}/${photos.length} imágenes...`, 'info', 1000);
            }
        } catch (error) {
            console.error(`Error descargando imagen ${photo.id}:`, error);
        }
    }

    return imageBuffers;
}

/**
 * Descarga el reporte generado
 * @param {Blob} blob - Blob del documento
 * @param {string} fileName - Nombre del archivo
 */
export function downloadReport(blob, fileName) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

/**
 * Formatea una fecha
 * @param {any} date - Fecha a formatear
 * @returns {string}
 */
function formatDate(date) {
    if (!date) return 'Fecha no disponible';

    let d;
    if (date && typeof date.toDate === 'function') {
        d = date.toDate();
    } else if (date && date.seconds) {
        d = new Date(date.seconds * 1000);
    } else if (typeof date === 'string') {
        d = new Date(date);
    } else if (date instanceof Date) {
        d = date;
    } else {
        return 'Fecha no disponible';
    }

    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };

    return d.toLocaleDateString('es-MX', options);
}

/* ===================================
   EXPORTACIONES
   =================================== */

export default {
    generateWordReport,
    downloadReport
};