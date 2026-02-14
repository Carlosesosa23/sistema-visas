import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Client } from '../types/index'; // Fixed import path
import { supabase } from '../lib/supabase';

interface ClientState {
    clients: Client[];
    agencyName: string;
    agencyLogo?: string;
    whatsappTemplates: {
        pending: string;
        ready: string;
        approved: string;
    };
    availableTags: string[];
    // Async Actions
    fetchClients: () => Promise<void>;
    addClient: (client: Client) => Promise<void>;
    addClients: (clients: Client[]) => Promise<void>;
    updateClient: (id: string, updates: Partial<Client>) => Promise<void>;
    removeClient: (id: string) => Promise<void>;
    removeClients: (ids: string[]) => Promise<void>;

    // Local Settings (Keep Sync)
    setAgencyName: (name: string) => void;
    setAgencyLogo: (logo: string) => void;
    setWhatsappTemplate: (key: 'pending' | 'ready' | 'approved', template: string) => void;
    addTag: (tag: string) => void;
    removeTag: (tag: string) => void;
    importData: (data: string) => void;
    uploadFile: (file: File, folder: string) => Promise<string | null>;
}

export const useClientStore = create<ClientState>()(
    persist(
        (set) => ({
            clients: [],
            agencyName: 'DK Asesorias',
            agencyLogo: '',
            whatsappTemplates: {
                pending: 'Hola {nombre}, le saludamos de {agencia}. Le recordamos que su trámite está pendiente de pago/información.',
                ready: 'Hola {nombre}, buenas noticias. Su cita para la visa ya está programada para el {fecha} a las {hora}.',
                approved: '¡Felicidades {nombre}! Su visa ha sido aprobada. Le avisaremos cuando llegue su pasaporte.'
            },
            availableTags: ['Renovación', 'Primera Vez', 'Urgente', 'VIP'],

            fetchClients: async () => {
                const { data, error } = await supabase
                    .from('clients')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('Error fetching clients:', error);
                    return;
                }

                // Map database columns (snake_case) to application types (camelCase)
                const mappedClients: Client[] = data.map((row: any) => ({
                    id: row.id,
                    firstName: row.first_name,
                    lastName: row.last_name,
                    email: row.email,
                    phone: row.phone,
                    passportNumber: row.passport_number,
                    status: row.status,
                    tags: row.tags || [],
                    notes: row.notes,
                    appointmentDate: row.appointment_date,
                    appointmentTime: row.appointment_time,
                    appointmentCas: row.appointment_cas, // If exists in DB
                    appointmentConsulate: row.appointment_consulate, // If exists in DB
                    dsApplicationId: row.ds_application_id,
                    ds160Url: row.ds160_url,
                    appointmentConfirmationUrl: row.appointment_confirmation_url,
                    passportPhotoUrl: row.passport_photo_url,
                    role: row.role, // If enabled later
                    createdAt: row.created_at,
                    appointmentLocation: row.appointment_location,
                    password: row.password
                }));
                set({ clients: mappedClients });
            },

            addClient: async (client) => {
                // Optimistic Update
                set((state) => ({ clients: [client, ...state.clients] }));

                const { error } = await supabase.from('clients').insert({
                    id: client.id,
                    first_name: client.firstName,
                    last_name: client.lastName,
                    email: client.email || null,
                    phone: client.phone || null,
                    passport_number: client.passportNumber || null,
                    status: client.status,
                    tags: client.tags,
                    notes: client.notes || null,
                    appointment_date: client.appointmentDate || null,
                    appointment_time: client.appointmentTime || null,
                    appointment_location: (client as any).appointmentLocation || null,
                    ds_application_id: client.dsApplicationId || null,
                    ds160_url: client.ds160Url || null,
                    appointment_confirmation_url: client.appointmentConfirmationUrl || null,
                    passport_photo_url: client.passportPhotoUrl || null,
                    password: client.password || null
                });

                if (error) {
                    console.error('Error adding client:', error);
                    alert(`Error: ${error.message || JSON.stringify(error)}`);
                }
            },

            addClients: async (newClients) => {
                // Optimistic
                set((state) => ({ clients: [...newClients, ...state.clients] }));

                const rows = newClients.map(client => ({
                    id: client.id,
                    first_name: client.firstName,
                    last_name: client.lastName,
                    email: client.email || null,
                    phone: client.phone || null,
                    passport_number: client.passportNumber || null,
                    status: client.status,
                    tags: client.tags || [],
                    notes: client.notes || 'Importado desde Excel',
                    appointment_date: client.appointmentDate || null,
                    appointment_time: client.appointmentTime || null,
                    ds_application_id: client.dsApplicationId || null,
                    password: client.password || null
                }));

                const { error } = await supabase.from('clients').insert(rows);
                if (error) console.error('Error importing clients:', error);
            },

            updateClient: async (id, updates) => {
                // Optimistic
                set((state) => ({
                    clients: state.clients.map((c) => (c.id === id ? { ...c, ...updates } : c)),
                }));

                // Map updates to snake_case
                const dbUpdates: any = {};
                // Helper to treat empty strings as null if needed, or just pass value.
                // For updates, we usually want to explicitly set null if cleared.
                if (updates.firstName !== undefined) dbUpdates.first_name = updates.firstName;
                if (updates.lastName !== undefined) dbUpdates.last_name = updates.lastName;
                if (updates.email !== undefined) dbUpdates.email = updates.email || null;
                if (updates.phone !== undefined) dbUpdates.phone = updates.phone || null;
                if (updates.passportNumber !== undefined) dbUpdates.passport_number = updates.passportNumber || null;
                if (updates.status !== undefined) dbUpdates.status = updates.status;
                if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
                if (updates.notes !== undefined) dbUpdates.notes = updates.notes || null;
                if (updates.appointmentDate !== undefined) dbUpdates.appointment_date = updates.appointmentDate || null;
                if (updates.appointmentTime !== undefined) dbUpdates.appointment_time = updates.appointmentTime || null;
                if ((updates as any).appointmentLocation !== undefined) dbUpdates.appointment_location = (updates as any).appointmentLocation || null;
                if (updates.dsApplicationId !== undefined) dbUpdates.ds_application_id = updates.dsApplicationId || null;
                if (updates.ds160Url !== undefined) dbUpdates.ds160_url = updates.ds160Url || null;
                if (updates.appointmentConfirmationUrl !== undefined) dbUpdates.appointment_confirmation_url = updates.appointmentConfirmationUrl || null;
                if (updates.passportPhotoUrl !== undefined) dbUpdates.passport_photo_url = updates.passportPhotoUrl || null;
                if (updates.password !== undefined) dbUpdates.password = updates.password || null;

                const { error } = await supabase.from('clients').update(dbUpdates).eq('id', id);
                if (error) {
                    console.error('Error updating client:', error);
                    alert(`Error guardando: ${error.message}`);
                }
            },

            removeClient: async (id) => {
                set((state) => ({ clients: state.clients.filter((c) => c.id !== id) }));
                const { error } = await supabase.from('clients').delete().eq('id', id);
                if (error) console.error('Error deleting client:', error);
            },

            removeClients: async (ids) => {
                set((state) => ({ clients: state.clients.filter((c) => !ids.includes(c.id)) }));
                const { error } = await supabase.from('clients').delete().in('id', ids);
                if (error) console.error('Error deleting clients:', error);
            },

            setAgencyName: (name) => set({ agencyName: name }),
            setAgencyLogo: (logo) => set({ agencyLogo: logo }),
            setWhatsappTemplate: (key, template) => set((state) => ({ whatsappTemplates: { ...state.whatsappTemplates, [key]: template } })),
            addTag: (tag) => set((state) => ({ availableTags: [...state.availableTags, tag] })),
            removeTag: (tag) => set((state) => ({ availableTags: state.availableTags.filter(t => t !== tag) })),
            importData: (data) => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.clients) {
                        alert('La importación JSON solo afecta la sesión actual. Usa "Importar Excel" para guardar en la nube.');
                    }
                } catch (e) {
                    console.error(e);
                }
            },

            uploadFile: async (file: File, folder: string) => {
                try {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
                    const filePath = `${folder}/${fileName}`;

                    const { error: uploadError } = await supabase.storage
                        .from('client-files')
                        .upload(filePath, file);

                    if (uploadError) {
                        throw uploadError;
                    }

                    const { data } = supabase.storage
                        .from('client-files')
                        .getPublicUrl(filePath);

                    return data.publicUrl;
                } catch (error) {
                    console.error('Error uploading file:', error);
                    alert('Error subiendo archivo. Asegúrate de haber creado el bucket "client-files" en Supabase como público.');
                    return null;
                }
            }
        }),
        {
            name: 'visa-client-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                // Only persist settings locally. Clients are now fetched from DB!
                agencyName: state.agencyName,
                agencyLogo: state.agencyLogo,
                whatsappTemplates: state.whatsappTemplates,
                availableTags: state.availableTags
            }),
        }
    )
);
