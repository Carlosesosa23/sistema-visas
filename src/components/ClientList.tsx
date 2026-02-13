import { useClientStore } from '../store/clientStore';
import { Search, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const ITEMS_PER_PAGE = 50;

export function ClientList() {
    const { clients, removeClients } = useClientStore();
    const [searchParams] = useSearchParams();
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const navigate = useNavigate();

    // ... (useMemo filteredClients logic remains same, just need to make sure I don't lose it)
    // Wait, replace_file_content requires me to match EXACTLY or I can't look inside useMemo if I don't replace it.
    // I should use a smaller chunk for the imports and the component start to add state.
    // And then another chunk for the JSX.

    // Actually, I'll rewrite the component start to add `selectedIds` and `removeClients` destructuring.


    // Optimize filtering and sorting with useMemo
    const filteredClients = useMemo(() => {
        return clients.filter(c =>
            c.firstName.toLowerCase().includes(search.toLowerCase()) ||
            c.lastName.toLowerCase().includes(search.toLowerCase()) ||
            (c.dsApplicationId && c.dsApplicationId.toLowerCase().includes(search.toLowerCase())) ||
            (c.passportNumber && c.passportNumber.includes(search)) ||
            (c.tags && c.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))) ||
            (search.toLowerCase() === 'pending' && (c.status === 'pending' || c.status === 'ds160')) ||
            (c.status === search.toLowerCase())
        ).sort((a, b) => {
            // Sort Priority: 
            // 1. Consulate Appointment (Green) - "Listos para cita"
            // 2. Approved (Cyan) 
            // 3. DS-160 (Blue) - In Progress
            // 4. Pending (Yellow/Purple)
            // 5. Rejected (Red)
            // 6. Others

            const getPriority = (status: string) => {
                switch (status) {
                    case 'consulate_appointment': return 0; // Top Priority
                    case 'approved': return 1;
                    case 'ds160': return 2;
                    case 'pending': return 3;
                    case 'rejected': return 4;
                    default: return 5;
                }
            };

            const priorityA = getPriority(a.status);
            const priorityB = getPriority(b.status);

            if (priorityA !== priorityB) {
                return priorityA - priorityB;
            }

            // Secondary sort: Name
            return a.firstName.localeCompare(b.firstName);
        });
    }, [clients, search]);

    // Pagination Safety Check
    const totalPages = Math.ceil(filteredClients.length / ITEMS_PER_PAGE) || 1;

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [totalPages, currentPage]);

    // Pagination Logic
    // const totalPages = Math.ceil(filteredClients.length / ITEMS_PER_PAGE); // Removed duplicate
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedClients = filteredClients.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const handleSearch = (val: string) => {
        setSearch(val);
        setCurrentPage(1); // Reset to page 1 on search
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === paginatedClients.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(paginatedClients.map(c => c.id)));
        }
    };

    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const handleBulkDelete = () => {
        if (confirm(`¿Estás seguro de que deseas eliminar ${selectedIds.size} clientes seleccionados?`)) {
            removeClients(Array.from(selectedIds));
            setSelectedIds(new Set());
        }
    };

    return (
        <div className="w-full bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden relative group flex flex-col h-full">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-slate-900 via-amber-500 to-slate-900 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-white sticky top-0 z-10">
                {selectedIds.size > 0 ? (
                    <div className="w-full flex items-center justify-between bg-rose-50 border border-rose-100 px-4 py-2 rounded-sm text-rose-700">
                        <span className="font-bold text-sm tracking-wide">{selectedIds.size} seleccionados</span>
                        <button
                            onClick={handleBulkDelete}
                            className="flex items-center gap-2 px-3 py-1 bg-rose-600 text-white rounded-sm hover:bg-rose-700 transition-colors text-xs font-bold uppercase tracking-wider shadow-sm"
                        >
                            <Trash2 className="w-4 h-4" />
                            Eliminar Selección
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="relative flex-1 w-full max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Buscar cliente, pasaporte, tag..."
                                className="w-full pl-10 pr-4 py-2 rounded-sm border border-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all text-sm placeholder:text-slate-400 bg-slate-50 focus:bg-white"
                                value={search}
                                onChange={(e) => handleSearch(e.target.value)}
                            />
                        </div>
                        <div className="text-xs sm:text-sm text-slate-500 font-medium ml-auto flex items-center gap-2 whitespace-nowrap">
                            <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                            {filteredClients.length} Resultados
                        </div>
                    </>
                )}
            </div>

            <div className="overflow-auto flex-1">
                <table className="w-full text-xs text-left table-fixed min-w-[600px] md:min-w-0">
                    <thead className="text-[10px] text-slate-500 uppercase bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
                        <tr>
                            <th className="px-3 py-2 sm:py-3 w-8 text-center">
                                <input
                                    type="checkbox"
                                    checked={paginatedClients.length > 0 && selectedIds.size === paginatedClients.length}
                                    onChange={toggleSelectAll}
                                    className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                                />
                            </th>
                            <th className="px-1 py-2 sm:py-3 font-bold text-center tracking-wider text-slate-700 w-12">Ver</th>
                            <th className="px-2 py-2 sm:py-3 font-bold tracking-wider text-slate-700 w-32 md:w-auto">Nombre</th>
                            <th className="px-2 py-2 sm:py-3 font-bold tracking-wider text-slate-700 w-24">Cita</th>
                            <th className="px-2 py-2 sm:py-3 font-bold tracking-wider text-slate-700 w-24">DS-160</th>
                            <th className="px-2 py-2 sm:py-3 font-bold tracking-wider text-slate-700 w-32 hidden lg:table-cell">Email</th>
                            <th className="px-2 py-2 sm:py-3 font-bold tracking-wider text-slate-700 w-24">Estado</th>
                            <th className="px-2 py-2 sm:py-3 font-bold tracking-wider text-slate-700 w-24 hidden xl:table-cell">Pass</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {paginatedClients.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-6 py-12 text-center text-slate-400 italic">
                                    No hay clientes que coincidan con la búsqueda.
                                </td>
                            </tr>
                        ) : paginatedClients.map((client) => (
                            <tr key={client.id || Math.random()} className={`transition-colors group border-l-2 hover:border-amber-500 ${selectedIds.has(client.id) ? 'bg-amber-50 border-amber-500' : 'hover:bg-amber-50/10 border-transparent'}`}>
                                <td className="px-3 py-1.5 text-center">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.has(client.id)}
                                        onChange={() => toggleSelect(client.id)}
                                        className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                                    />
                                </td>
                                <td className="px-1 py-1.5 text-center">
                                    <button
                                        onClick={() => navigate(`/clients/${client.id}`)}
                                        className="text-slate-400 hover:text-amber-600 font-bold text-[10px] px-2 py-1 rounded-sm transition-all hover:bg-amber-50 uppercase"
                                    >
                                        VER
                                    </button>
                                </td>
                                <td className="px-2 py-1.5 font-bold text-slate-900 group-hover:text-black truncate text-[11px]" title={`${client.firstName || ''} ${client.lastName || ''}`}>
                                    {String(client.firstName || '')} {String(client.lastName || '')}
                                    {Array.isArray(client.tags) && client.tags.length > 0 && (
                                        <div className="flex gap-1 mt-0.5 opacity-70">
                                            {client.tags.slice(0, 2).map((tag, i) => (
                                                <span key={i} className="px-1 py-px bg-slate-100 rounded-[2px] text-[9px] text-slate-500 border border-slate-200">
                                                    {String(tag)}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </td>
                                <td className="px-2 py-1.5 text-slate-600 font-medium truncate text-[10px]">
                                    {typeof client.appointmentDate === 'string' ? client.appointmentDate : '—'}
                                    {client.appointmentTime && typeof client.appointmentTime === 'string' && (
                                        <span className="text-amber-700 font-bold ml-1 block sm:inline">{client.appointmentTime}</span>
                                    )}
                                </td>
                                <td className="px-2 py-1.5 font-mono text-slate-600 font-bold truncate text-[10px]" title={String(client.dsApplicationId || '')}>
                                    {String(client.dsApplicationId || '—')}
                                </td>
                                <td className="px-2 py-1.5 text-slate-500 truncate text-[10px] hidden lg:table-cell" title={String(client.email || '')}>
                                    {String(client.email || '—')}
                                </td>
                                <td className="px-2 py-1.5">
                                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-[2px] text-[9px] font-bold uppercase tracking-wider border
                                    ${client.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                            client.status === 'approved' ? 'bg-cyan-50 text-cyan-700 border-cyan-200' :
                                                client.status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                                    client.status === 'consulate_appointment' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                        client.status === 'ds160' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                            'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                        {client.status === 'pending' ? 'Pendiente' :
                                            client.status === 'approved' ? 'Aprobada' :
                                                client.status === 'rejected' ? 'Rechazada' :
                                                    client.status === 'consulate_appointment' ? 'Cita Lista' :
                                                        client.status === 'ds160' ? 'Llenando DS' : String(client.status || '—')}
                                    </span>
                                </td>
                                <td className="px-2 py-1.5 font-mono text-slate-400 truncate text-[10px] hidden xl:table-cell">
                                    {String(client.password || '—')}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-1 px-3 text-xs font-medium bg-white border border-slate-200 rounded-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                        <ChevronLeft className="w-3 h-3" />
                        Anterior
                    </button>
                    <span className="text-xs text-slate-500">
                        Página {currentPage} de {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-1 px-3 text-xs font-medium bg-white border border-slate-200 rounded-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                        Siguiente
                        <ChevronRight className="w-3 h-3" />
                    </button>
                </div>
            )}
        </div>
    );
}
