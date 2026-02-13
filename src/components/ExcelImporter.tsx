import { Upload, FileSpreadsheet, AlertCircle, Loader2 } from 'lucide-react';
import ExcelJS from 'exceljs';
import { useClientStore } from '../store/clientStore';
import React from 'react';
import { useDropzone } from 'react-dropzone';
import type { Client, ClientStatus } from '../types';

export function ExcelImporter() {
    const { addClients } = useClientStore();
    const [error, setError] = React.useState<string | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [previewData, setPreviewData] = React.useState<Client[]>([]);

    // Helper to convert Excel Serial Date to ISO String (YYYY-MM-DD)
    const excelDateToJSDate = (serial: number): string => {
        if (!serial || isNaN(serial)) return '';
        // Excel base date is Dec 30, 1899 for Mac/Windows compatibility usually, but 1900 system is common
        // ExcelJS usually handles values, but if raw serial:
        const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
        return date.toISOString().split('T')[0];
    };

    // Helper to convert Excel Fractional Time to HH:MM
    const excelTimeToHHMM = (fraction: number): string => {
        if (fraction === undefined || fraction === null) return '';
        const totalSeconds = Math.round(fraction * 86400);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };

    const handleFileUpload = async (file: File) => {
        if (!file) return;
        setError(null);
        setIsLoading(true);
        setPreviewData([]);

        try {
            const arrayBuffer = await file.arrayBuffer();
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(arrayBuffer);

            const newClients: Client[] = [];

            workbook.eachSheet((worksheet) => {
                // Skip ignored sheets
                const sheetName = worksheet.name.toLowerCase();
                if (sheetName.includes('info incompleta')) return;

                worksheet.eachRow((row, rowNumber) => {
                    if (rowNumber <= 1) return; // Skip headers

                    // Cell Mapping (Based on Analysis)
                    // Col 1 (A): NAME (and Color Code)
                    // Col 2 (B): FECHA CITA
                    // Col 3 (C): HORA
                    // Col 4 (D): CELULAR
                    // Col 5 (E): DS APLICACION
                    // Col 6 (F): CORREO
                    // Col 7 (G): LISTADO
                    // Col 8 (H): CONTRASEÑA
                    // Col 9 (I): OBSERVACION

                    const nameCell = row.getCell(1);
                    const nameVal = nameCell.text || nameCell.value?.toString() || '';
                    if (!nameVal) return;

                    // Parse Name
                    let firstName = 'Unknown';
                    let lastName = '';
                    const parts = nameVal.trim().split(' ');
                    if (parts.length > 0) firstName = parts[0];
                    if (parts.length > 1) lastName = parts.slice(1).join(' ');

                    // Color Analysis for Status
                    let status: ClientStatus = 'pending';
                    const tags: string[] = [];

                    const fill = nameCell.fill;
                    let argb = '';
                    if (fill && fill.type === 'pattern' && fill.fgColor && fill.fgColor.argb) {
                        argb = fill.fgColor.argb;
                    }

                    // Strict ARGB Mapping
                    if (argb === 'FF00FF00') { // Green
                        status = 'consulate_appointment';
                        tags.push('Lista para Entrevista');
                    } else if (argb === 'FFFF0000') { // Red
                        status = 'rejected';
                    } else if (argb === 'FFFF00FF') { // Purple/Magenta
                        status = 'pending';
                        tags.push('Falta Formulario');
                    } else if (argb === 'FFFFFF00' || argb === 'FFFF9900') { // Yellow / Orange
                        status = 'pending';
                        tags.push('Revisar');
                    } else if (argb === 'FF00FFFF' || argb === 'FFC9DAF8') { // Cyan / Pale Blue
                        status = 'approved';
                    } else if (argb === 'FF4A86E8') { // Darker Blue
                        status = 'ds160';
                        tags.push('Llenando Formulario');
                    }


                    // Date & Time
                    const dateVal = row.getCell(2).value;
                    let appointmentDate = '';
                    if (typeof dateVal === 'number') {
                        appointmentDate = excelDateToJSDate(dateVal);
                    } else if (dateVal instanceof Date) {
                        appointmentDate = dateVal.toISOString().split('T')[0];
                    }

                    const timeVal = row.getCell(3).value;
                    let appointmentTime = '';
                    if (typeof timeVal === 'number') {
                        appointmentTime = excelTimeToHHMM(timeVal);
                    } else if (typeof timeVal === 'string') {
                        appointmentTime = timeVal;
                    }

                    // Other Fields
                    const phone = row.getCell(4).text || '';
                    const dsAppId = row.getCell(5).text || '';
                    const email = row.getCell(6).text || '';
                    const listadoTag = row.getCell(7).text || '';
                    if (listadoTag) tags.push(listadoTag); // 'DK6' etc

                    const password = row.getCell(8).text || '';
                    const observacion = row.getCell(9).text || '';

                    // Construct Notes
                    const notesParts = [];
                    if (dsAppId) notesParts.push(`DS App: ${dsAppId}`);
                    if (observacion) notesParts.push(observacion);
                    if (password) notesParts.push(`Pass: ${password}`); // Save password in notes for safety if field is full
                    // actually we have password field

                    newClients.push({
                        id: crypto.randomUUID(),
                        firstName,
                        lastName,
                        passportNumber: '—', // Placeholder
                        phone,
                        email,
                        status,
                        notes: notesParts.join('\n'),
                        appointmentDate,
                        appointmentTime,
                        password, // Map explicit field
                        tags,
                        createdAt: new Date().toISOString(),
                        // rawExcelData: row, // Removed to save space
                    });
                });
            });

            console.log('Processed clients:', newClients.length);
            setPreviewData(newClients);

        } catch (err: any) {
            console.error("Error parsing excel", err);
            setError("Error al procesar el archivo. " + (err.message || ''));
        } finally {
            setIsLoading(false);
        }
    };

    const onDrop = React.useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            handleFileUpload(acceptedFiles[0]);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
        },
        multiple: false,
    });

    const handleImport = () => {
        if (previewData.length > 0) {
            addClients(previewData);
            alert(`¡Éxito! Se importaron ${previewData.length} clientes correctamente.`);
            setPreviewData([]); // Clear preview after import
            setError(null);
        }
    };

    return (
        <div className="bg-white rounded-md shadow-sm border border-slate-200 p-6">
            <h3 className="text-md font-bold text-slate-900 mb-4 tracking-tight flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Importar Excel (2026)
            </h3>

            <div
                {...getRootProps()}
                className={`
          border-2 border-dashed rounded-md p-8 text-center cursor-pointer transition-all
          ${isDragActive
                        ? 'border-slate-900 bg-slate-50'
                        : 'border-slate-200 hover:border-slate-400 hover:bg-slate-50/50'
                    }
        `}
            >
                <input {...getInputProps()} />
                <div className="space-y-2">
                    <div className="mx-auto w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 text-slate-600 animate-spin" />
                        ) : (
                            <FileSpreadsheet className="w-5 h-5 text-slate-600" />
                        )}
                    </div>
                    {isDragActive ? (
                        <p className="text-sm font-medium text-slate-900">Suelta el archivo aquí...</p>
                    ) : (
                        <div>
                            <p className="text-sm font-medium text-slate-900">
                                {isLoading ? 'Procesando...' : 'Arrastra tu archivo Excel 2026'}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                                Detecta colores y hojas automáticamente
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-md flex items-center gap-2 border border-red-100">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                </div>
            )}

            {previewData.length > 0 && (
                <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">
                            {previewData.length} clientes encontrados
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPreviewData([])}
                                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-sm hover:bg-slate-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleImport}
                                className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-sm transition-colors shadow-sm"
                            >
                                Importar {previewData.length} Clientes
                            </button>
                        </div>
                    </div>

                    {/* Tiny Preview Table */}
                    <div className="border rounded-md overflow-hidden text-xs">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b">
                                <tr>
                                    <th className="px-2 py-1">Nombre</th>
                                    <th className="px-2 py-1">Fecha</th>
                                    <th className="px-2 py-1">Estado (Color)</th>
                                    <th className="px-2 py-1">Tags</th>
                                </tr>
                            </thead>
                            <tbody>
                                {previewData.slice(0, 5).map((c, i) => (
                                    <tr key={i} className="border-b last:border-0 hover:bg-slate-50">
                                        <td className="px-2 py-1">{c.firstName} {c.lastName}</td>
                                        <td className="px-2 py-1">{c.appointmentDate}</td>
                                        <td className="px-2 py-1 font-semibold">
                                            {c.status === 'consulate_appointment' && <span className="text-green-600">Verde (Cita)</span>}
                                            {c.status === 'rejected' && <span className="text-red-600">Rojo (Rechazada)</span>}
                                            {c.status === 'approved' && <span className="text-blue-400">Celeste (Aprobada)</span>}
                                            {c.status === 'pending' && <span className="text-yellow-600">Amarillo/Morado</span>}
                                            {c.status === 'ds160' && <span className="text-blue-700">Azul (Proceso)</span>}
                                        </td>
                                        <td className="px-2 py-1 text-slate-500">{c.tags?.join(', ')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {previewData.length > 5 && (
                            <div className="px-2 py-1 text-slate-400 italic text-center bg-slate-50">
                                ... y {previewData.length - 5} más
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
