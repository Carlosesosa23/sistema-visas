import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

// Sample data
const neighbors = [
    { Nombre: "Juan", Apellido: "Pérez", Pasaporte: "A12345678", Telefono: "555-0101", Email: "juan.perez@email.com", Estado: "Pendiente" },
    { Nombre: "Maria", Apellido: "García", Pasaporte: "B87654321", Telefono: "555-0102", Email: "maria.garcia@email.com", Estado: "DS-160" },
    { Nombre: "Carlos", Apellido: "López", Pasaporte: "C11223344", Telefono: "555-0103", Email: "carlos.lopez@email.com", Estado: "Cita Programada" },
    { Nombre: "Ana", Apellido: "Martínez", Pasaporte: "D44332211", Telefono: "555-0104", Email: "ana.martinez@email.com", Estado: "Aprobada" },
    { Nombre: "Luis", Apellido: "Rodríguez", Pasaporte: "E99887766", Telefono: "555-0105", Email: "luis.r@email.com", Estado: "Pendiente" },
    { Nombre: "Elena", Apellido: "Sánchez", Pasaporte: "F55667788", Telefono: "555-0106", Email: "elena.s@email.com", Estado: "Pagado" }
];

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(neighbors);

// Adjust column widths
const wscols = [
    { wch: 15 }, // Nombre
    { wch: 15 }, // Apellido
    { wch: 15 }, // Pasaporte
    { wch: 15 }, // Telefono
    { wch: 25 }, // Email
    { wch: 15 }  // Estado
];
ws['!cols'] = wscols;

XLSX.utils.book_append_sheet(wb, ws, "Clientes");

const outputPath = path.resolve('clientes_ejemplo.xlsx');
XLSX.writeFile(wb, outputPath);

console.log(`Archivo creado exitosamente en: ${outputPath}`);
