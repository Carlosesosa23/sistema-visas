import { useClientStore } from '../store/clientStore';
import { useRef } from 'react';
import { Upload, Download, Database, Settings as SettingsIcon, MessageCircle } from 'lucide-react';

export function Settings() {
    const { clients, agencyName, whatsappTemplates, setWhatsappTemplate, availableTags, importData } = useClientStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExportJSON = () => {
        const dataStr = JSON.stringify({
            clients,
            agencyName,
            availableTags,
            exportDate: new Date().toISOString()
        }, null, 2);

        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_visas_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleExportExcel = async () => {
        const ExcelJS = await import('exceljs');
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Clientes');

        // Headers
        sheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Nombres', key: 'firstName', width: 15 },
            { header: 'Apellidos', key: 'lastName', width: 15 },
            { header: 'Pasaporte', key: 'passportNumber', width: 15 },
            { header: 'Email', key: 'email', width: 25 },
            { header: 'Celular', key: 'phone', width: 15 },
            { header: 'Fecha Cita', key: 'appointmentDate', width: 15 },
            { header: 'Hora', key: 'appointmentTime', width: 10 },
            { header: 'Estado', key: 'status', width: 15 },
            { header: 'DS-160 ID', key: 'dsApplicationId', width: 15 },
            { header: 'Contraseña', key: 'password', width: 15 },
            { header: 'Etiquetas', key: 'tags', width: 20 },
            { header: 'Notas', key: 'notes', width: 30 },
            { header: 'Creado', key: 'createdAt', width: 15 },
        ];

        // Style Header
        sheet.getRow(1).font = { bold: true };
        sheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };

        // Add Data
        clients.forEach(client => {
            const row = sheet.addRow({
                ...client,
                tags: client.tags ? client.tags.join(', ') : '',
                status: client.status === 'pending' ? 'Pendiente' :
                    client.status === 'approved' ? 'Aprobada' :
                        client.status === 'rejected' ? 'Rechazada' :
                            client.status === 'consulate_appointment' ? 'Cita Lista' :
                                client.status === 'ds160' ? 'Llenando DS' : client.status
            });

            // Colorize Status
            const statusCell = row.getCell('status');
            if (client.status === 'approved') statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC9DAF8' } };
            if (client.status === 'consulate_appointment') statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00FF00' } };
            if (client.status === 'rejected') statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF0000' } };
            if (client.status === 'pending') statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };
            if (client.status === 'ds160') statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4A86E8' } };
        });

        // Write
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `Reporte_Clientes_${new Date().toISOString().slice(0, 10)}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const content = event.target?.result as string;
                if (content) {
                    if (confirm('Importar datos reemplazará tu base de datos actual. ¿Estás seguro?')) {
                        importData(content);
                    }
                }
            };
            reader.readAsText(file);
        }
        // Reset input
        if (e.target) e.target.value = '';
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <SettingsIcon className="w-6 h-6 text-slate-400" />
                    Configuraciones
                </h1>
                <p className="text-slate-500 text-sm mt-1">Personaliza tu sistema y gestiona tus datos.</p>
            </div>

            {/* WhatsApp Configuration */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-emerald-50 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    <h2 className="font-bold text-emerald-800 text-sm uppercase tracking-wide">Plantillas de WhatsApp</h2>
                </div>
                <div className="p-6 space-y-6">
                    <div className="space-y-2 pb-4 border-b border-slate-100">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre de la Agencia (Variable {'{agencia}'})</label>
                        <input
                            value={agencyName}
                            onChange={(e) => useClientStore.getState().setAgencyName(e.target.value)}
                            className="w-full px-3 py-2 rounded-sm border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors text-sm font-medium text-slate-900"
                            placeholder="Ej: DK Asesorias"
                        />
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex justify-between">
                                Mensaje de Pendiente
                                <span className="text-[10px] text-slate-400 font-normal lowercase">{`{nombre}, {agencia}`}</span>
                            </label>
                            <textarea
                                value={whatsappTemplates?.pending || ''}
                                onChange={(e) => setWhatsappTemplate('pending', e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 rounded-sm border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors text-sm"
                                placeholder="Hola {nombre}, recordatorio..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex justify-between">
                                Mensaje de Cita Lista
                                <span className="text-[10px] text-slate-400 font-normal lowercase">{`{nombre}, {fecha}, {hora}`}</span>
                            </label>
                            <textarea
                                value={whatsappTemplates?.ready || ''}
                                onChange={(e) => setWhatsappTemplate('ready', e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 rounded-sm border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors text-sm"
                                placeholder="Tu cita está lista..."
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex justify-between">
                                Mensaje de Aprobación
                                <span className="text-[10px] text-slate-400 font-normal lowercase">{`{nombre}`}</span>
                            </label>
                            <textarea
                                value={whatsappTemplates?.approved || ''}
                                onChange={(e) => setWhatsappTemplate('approved', e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 rounded-sm border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors text-sm"
                                placeholder="¡Felicidades!"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Data Management */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                    <Database className="w-4 h-4 text-slate-500" />
                    <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Base de Datos</h2>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-sm text-slate-500 mb-4">
                        Gestiona tus copias de seguridad. Se recomienda exportar tus datos semanalmente.
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <button
                            onClick={handleExportJSON}
                            className="flex-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-3 rounded-sm hover:bg-emerald-100 font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                        >
                            <Download className="w-4 h-4" /> Exportar JSON (Backup Completo)
                        </button>
                        <button
                            onClick={handleExportExcel}
                            className="flex-1 bg-green-50 text-green-700 border border-green-200 px-4 py-3 rounded-sm hover:bg-green-100 font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                        >
                            <Download className="w-4 h-4" /> Exportar Excel (Reporte)
                        </button>
                        <button
                            onClick={handleImportClick}
                            className="flex-1 bg-blue-50 text-blue-700 border border-blue-200 px-4 py-3 rounded-sm hover:bg-blue-100 font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                        >
                            <Upload className="w-4 h-4" /> Importar / Restaurar
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept=".json"
                            onChange={handleFileChange}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
