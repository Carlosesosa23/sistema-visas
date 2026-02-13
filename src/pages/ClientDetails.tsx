import { useNavigate, useParams } from 'react-router-dom';
import { useClientStore } from '../store/clientStore';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save, Upload, FileText, Camera, Key, CheckCircle, XCircle, Clock, Trash2, MessageCircle, Eye, Download, X } from 'lucide-react';
import type { Client } from '../types';
import { useEffect, useState } from 'react';

export function ClientDetails() {
    const { id } = useParams<{ id: string }>();
    const isNew = id === 'new';
    const navigate = useNavigate();
    const { clients, updateClient, addClient, uploadFile } = useClientStore();
    const client = isNew ? null : clients.find((c) => c.id === id);

    const { register, handleSubmit, reset, setValue, watch, getValues, formState: { isDirty } } = useForm<Client>({
        defaultValues: {
            status: 'pending',
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            passportNumber: '',
            notes: '',
        }
    });

    const [isUploading, setIsUploading] = useState(false);
    const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

    useEffect(() => {
        if (client && !isNew) {
            reset(client);
        }
    }, [client, reset, isNew]);

    if (!client && !isNew) {
        return <div className="p-8 text-center text-slate-500">Cliente no encontrado</div>;
    }

    const onSubmit = (data: Client) => {
        if (isUploading) return; // Prevent submission while uploading

        if (isNew) {
            const newClient: Client = {
                ...data,
                id: crypto.randomUUID(),
                status: 'pending'
            };
            addClient(newClient);
            // alert('Cliente creado exitosamente'); // Removed for speed if desired, or keep. User said "directo".
            // Let's keep a small notification or just redirect.
            // navigate('/'); 
            navigate('/');
        } else {
            if (client) {
                updateClient(client.id, data);
            }
            alert('Cambios guardados');
        }
    };

    const generatePassword = () => {
        const name = getValues('firstName');
        if (!name) {
            alert('Por favor, asegúrese de que el campo "Nombres" tenga información.');
            return;
        }

        // Clean name: remove spaces/accents/special chars for the password base
        const cleanName = name.split(' ')[0].replace(/[^a-zA-Z0-9]/g, '');

        // Ensure strictly 15 chars: Name segment + Random Chars
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*";
        // Use up to 8 chars of name to allow space for random entropy
        const base = cleanName.slice(0, 8);
        let result = base;

        while (result.length < 15) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        setValue('password', result, { shouldValidate: true, shouldDirty: true });
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, field: keyof Client) => {
        const file = event.target.files?.[0];
        if (file) {
            // 1. Optimistic Preview (Instant)
            const objectUrl = URL.createObjectURL(file);
            setValue(field as any, objectUrl, { shouldDirty: true, shouldValidate: true });

            try {
                // 2. Background Upload
                setIsUploading(true);

                // Use client ID folder or 'new_uploads'
                const folder = client ? client.id : 'new_uploads';
                const realUrl = await uploadFile(file, folder);

                if (realUrl) {
                    // 3. Update with Real URL silently
                    setValue(field as any, realUrl, { shouldDirty: true, shouldValidate: true });
                }
            } catch (error) {
                console.error('Upload failed', error);
                alert('Error subiendo archivo a la nube. Por favor intente de nuevo.');
                // Remove the preview if upload failed so we don't save a bad link
                setValue(field as any, '', { shouldValidate: true, shouldDirty: true });
            } finally {
                setIsUploading(false);
            }
        }
    };

    const passportPhotoUrl = watch('passportPhotoUrl');
    const ds160Url = watch('ds160Url');
    const appointmentConfirmationUrl = watch('appointmentConfirmationUrl');

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors uppercase text-xs font-bold tracking-wider"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Volver
                </button>
                <div className="flex items-center gap-3">
                    <div className="flex bg-slate-100 p-1 rounded-md border border-slate-200">
                        <button
                            type="button"
                            onClick={() => {
                                setValue('status', 'pending', { shouldDirty: true });
                                if (!isNew && client) updateClient(client.id, { status: 'pending' });
                            }}
                            className={`px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all
                            ${watch('status') === 'pending' ? 'bg-amber-400 text-amber-950 shadow-sm' : 'text-slate-400 hover:text-amber-600'}`}
                            title="Marcar como Pendiente"
                        >
                            <Clock className="w-3 h-3" />
                            Pendiente
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setValue('status', 'ds160', { shouldDirty: true });
                                if (!isNew && client) updateClient(client.id, { status: 'ds160' });
                            }}
                            className={`px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all whitespace-nowrap
                            ${watch('status') === 'ds160' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-400 hover:text-blue-600'}`}
                            title="Llenando DS-160"
                        >
                            <FileText className="w-3 h-3" />
                            Llenando DS
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setValue('status', 'consulate_appointment', { shouldDirty: true });
                                if (!isNew && client) updateClient(client.id, { status: 'consulate_appointment' });
                            }}
                            className={`px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all whitespace-nowrap
                            ${watch('status') === 'consulate_appointment' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400 hover:text-emerald-600'}`}
                            title="Cita Lista"
                        >
                            <CheckCircle className="w-3 h-3" />
                            Cita Lista
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setValue('status', 'approved', { shouldDirty: true });
                                if (!isNew && client) updateClient(client.id, { status: 'approved' });
                            }}
                            className={`px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all
                            ${watch('status') === 'approved' ? 'bg-cyan-500 text-white shadow-sm' : 'text-slate-400 hover:text-cyan-600'}`}
                            title="Marcar como Aprobada"
                        >
                            <CheckCircle className="w-3 h-3" />
                            Aprobada
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setValue('status', 'rejected', { shouldDirty: true });
                                if (!isNew && client) updateClient(client.id, { status: 'rejected' });
                            }}
                            className={`px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all
                            ${watch('status') === 'rejected' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-400 hover:text-rose-600'}`}
                            title="Marcar como Rechazada"
                        >
                            <XCircle className="w-3 h-3" />
                            Rechazada
                        </button>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Personal Info Card */}
                <div className="bg-white rounded-md shadow-sm border border-slate-200 p-8">
                    <div className="flex justify-between items-start mb-8 border-b border-slate-100 pb-4">
                        <h2 className="text-lg font-bold text-slate-900 tracking-tight">Información Personal</h2>
                        <div className="flex gap-3">
                            {!isNew && client && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (confirm('¿Estás seguro de que deseas eliminar este cliente?')) {
                                            useClientStore.getState().removeClient(client.id);
                                            navigate('/clients');
                                        }
                                    }}
                                    className="px-4 py-2 border border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-sm font-bold text-sm uppercase tracking-wider flex items-center gap-2 transition-all shadow-sm"
                                    title="Eliminar Cliente"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span className="hidden sm:inline">Eliminar</span>
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={!isDirty || isUploading}
                                className="flex items-center gap-2 px-5 py-2 bg-slate-900 text-white rounded-sm hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm shadow-sm uppercase tracking-wider"
                            >
                                <Save className="w-4 h-4" />
                                {isUploading ? 'SUBIENDO...' : (isNew ? 'CREAR CLIENTE' : 'GUARDAR CAMBIOS')}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nombres</label>
                            <input
                                {...register('firstName')}
                                className="w-full px-3 py-2.5 rounded-sm border border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors bg-slate-50/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Apellidos</label>
                            <input
                                {...register('lastName')}
                                className="w-full px-3 py-2.5 rounded-sm border border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors bg-slate-50/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pasaporte</label>
                            <input
                                {...register('passportNumber')}
                                className="w-full px-3 py-2.5 rounded-sm border border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors font-mono bg-slate-50/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Teléfono</label>
                            <div className="flex gap-2">
                                <input
                                    {...register('phone')}
                                    placeholder="Teléfono"
                                    className="w-full px-3 py-2.5 rounded-sm border border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors bg-slate-50/50"
                                />
                                {client && !isNew && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const phone = getValues('phone')?.replace(/\D/g, '');
                                            if (!phone) return alert('Ingrese un teléfono');

                                            const status = getValues('status') as 'pending' | 'approved' | 'rejected' | 'consulate_appointment';
                                            const templates = useClientStore.getState().whatsappTemplates;

                                            let template = '';
                                            if (status === 'approved') template = templates.approved;
                                            else if (status === 'consulate_appointment') template = templates.ready;
                                            else template = templates.pending; // default

                                            // Replace variables
                                            const msg = template
                                                .replace(/{nombre}/g, getValues('firstName').split(' ')[0])
                                                .replace(/{agencia}/g, useClientStore.getState().agencyName)
                                                .replace(/{fecha}/g, getValues('appointmentDate') || 'fecha pendiente')
                                                .replace(/{hora}/g, getValues('appointmentTime') || 'hora pendiente');

                                            window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
                                        }}
                                        className="px-3 bg-emerald-500 text-white rounded-sm hover:bg-emerald-600 transition-colors flex items-center justify-center"
                                        title="Enviar mensaje de WhatsApp"
                                    >
                                        <MessageCircle className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Correo Electrónico</label>
                            <input
                                {...register('email')}
                                placeholder="correo@ejemplo.com"
                                type="email"
                                className="w-full px-3 py-2.5 rounded-sm border border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors bg-slate-50/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider text-amber-600">DS Aplicación</label>
                            <input
                                {...register('dsApplicationId')}
                                className="w-full px-3 py-2.5 rounded-sm border border-amber-200 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-colors bg-amber-50/30 font-mono font-bold text-slate-700"
                                placeholder="AA00..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contraseña</label>
                            <div className="flex gap-2">
                                <input
                                    {...register('password')}
                                    className="w-full px-3 py-2.5 rounded-sm border border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors font-mono"
                                />
                                <button
                                    type="button"
                                    onClick={generatePassword}
                                    title="Generar contraseña de 15 caracteres"
                                    className="px-4 bg-slate-100 border border-slate-200 text-slate-600 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 rounded-sm transition-all flex items-center gap-2 font-bold text-xs uppercase tracking-wider"
                                >
                                    <Key className="w-3 h-3" />
                                    Generar
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha Cita</label>
                            <input
                                {...register('appointmentDate')}
                                type="date"
                                className="w-full px-3 py-2.5 rounded-sm border border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hora</label>
                            <input
                                {...register('appointmentTime')}
                                className="w-full px-3 py-2.5 rounded-sm border border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                                placeholder="Ej: 9:30"
                            />
                        </div>
                    </div>
                </div>

                {/* Documents & Media */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-md shadow-sm border border-slate-200 p-6">

                        <h3 className="text-md font-bold text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-wide text-sm">
                            <Camera className="w-4 h-4 text-slate-500" />
                            Pasaporte
                        </h3>

                        {passportPhotoUrl ? (
                            <div className="aspect-video border-2 border-amber-500 bg-slate-900 rounded-sm overflow-hidden relative group shadow-md">
                                <img
                                    src={passportPhotoUrl}
                                    alt="Passport Preview"
                                    className="w-full h-full object-contain"
                                />

                                {/* Overlay Actions */}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsPhotoModalOpen(true)}
                                            className="p-2 bg-white text-slate-900 rounded-full hover:bg-amber-400 transition-colors shadow-lg"
                                            title="Ver foto completa"
                                        >
                                            <Eye className="w-5 h-5" />
                                        </button>
                                        <a
                                            href={passportPhotoUrl}
                                            download={`passport-${client?.firstName || 'client'}.jpg`}
                                            className="p-2 bg-white text-slate-900 rounded-full hover:bg-amber-400 transition-colors shadow-lg"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            title="Descargar foto"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Download className="w-5 h-5" />
                                        </a>
                                    </div>
                                    <label className="cursor-pointer px-3 py-1.5 bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-slate-700 transition-colors flex items-center gap-2 shadow-lg border border-slate-700">
                                        <Upload className="w-3 h-3" />
                                        Cambiar
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => handleFileUpload(e, 'passportPhotoUrl')}
                                        />
                                    </label>
                                </div>
                            </div>
                        ) : (
                            <label className="aspect-video border-2 border-dashed border-slate-200 bg-slate-50 hover:border-slate-900 hover:bg-slate-100 rounded-sm flex flex-col items-center justify-center cursor-pointer transition-all">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleFileUpload(e, 'passportPhotoUrl')}
                                />
                                <div className="flex flex-col items-center text-slate-400">
                                    <Upload className="w-6 h-6 mb-2" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Subir foto</span>
                                </div>
                            </label>
                        )}
                    </div>

                    <div className="bg-white rounded-md shadow-sm border border-slate-200 p-6">
                        <h3 className="text-md font-bold text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-wide text-sm">
                            <FileText className="w-4 h-4 text-slate-500" />
                            Documentos
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-sm border border-slate-100">
                                <span className="text-sm font-medium text-slate-700">Formulario DS-160</span>
                                <div className="flex items-center gap-3">
                                    {ds160Url && (
                                        <a href={ds160Url} target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline text-xs font-bold uppercase tracking-wide">
                                            Ver PDF
                                        </a>
                                    )}
                                    <label className="cursor-pointer text-slate-900 text-xs font-bold hover:underline uppercase tracking-wide">
                                        <input
                                            type="file"
                                            accept="application/pdf"
                                            className="hidden"
                                            onChange={(e) => handleFileUpload(e, 'ds160Url')}
                                        />
                                        {ds160Url ? 'Cambiar' : 'Subir PDF'}
                                    </label>
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-sm border border-slate-100">
                                <span className="text-sm font-medium text-slate-700">Confirmación de Cita</span>
                                <div className="flex items-center gap-3">
                                    {appointmentConfirmationUrl && (
                                        <a href={appointmentConfirmationUrl} target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline text-xs font-bold uppercase tracking-wide">
                                            Ver PDF
                                        </a>
                                    )}
                                    <label className="cursor-pointer text-slate-900 text-xs font-bold hover:underline uppercase tracking-wide">
                                        <input
                                            type="file"
                                            accept="application/pdf"
                                            className="hidden"
                                            onChange={(e) => handleFileUpload(e, 'appointmentConfirmationUrl')}
                                        />
                                        {appointmentConfirmationUrl ? 'Cambiar' : 'Subir PDF'}
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Timeline/Notes */}
                <div className="bg-white rounded-md shadow-sm border border-slate-200 p-6">
                    <h3 className="text-md font-bold text-slate-900 mb-4 uppercase tracking-wide text-sm">Notas y Seguimiento</h3>
                    <textarea
                        {...register('notes')}
                        rows={4}
                        className="w-full px-3 py-2 rounded-sm border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors resize-none placeholder:text-slate-300"
                        placeholder="Escribe notas sobre el proceso aquí..."
                    />
                </div>

            </form>

            {/* Photo Modal */}
            {
                isPhotoModalOpen && passportPhotoUrl && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm" onClick={() => setIsPhotoModalOpen(false)}>
                        <div className="relative max-w-7xl max-h-[95vh] w-full flex flex-col items-center animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                            <button
                                onClick={() => setIsPhotoModalOpen(false)}
                                className="absolute -top-12 right-0 text-white/70 hover:text-amber-400 transition-colors p-2"
                            >
                                <X className="w-8 h-8" />
                            </button>

                            <img
                                src={passportPhotoUrl}
                                alt="Passport Full Size"
                                className="max-w-full max-h-[85vh] object-contain rounded-md shadow-2xl bg-black border border-white/10"
                            />

                            <div className="mt-6 flex gap-4">
                                <a
                                    href={passportPhotoUrl}
                                    download={`passport-${client?.firstName || 'client'}.jpg`}
                                    className="px-6 py-2 bg-amber-500 text-white font-bold uppercase tracking-wider rounded-sm hover:bg-amber-600 transition-colors flex items-center gap-2 shadow-lg shadow-amber-900/20"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Download className="w-5 h-5" />
                                    Descargar Original
                                </a>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
}
