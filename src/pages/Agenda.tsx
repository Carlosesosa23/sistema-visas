import { useState } from 'react';
import { useClientStore } from '../store/clientStore';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X, Clock } from 'lucide-react';

export function Agenda() {
    const { clients } = useClientStore();
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(); // 0 = Sun

    const monthName = currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    // Helper to check matches
    const getAppointmentsForDay = (day: number) => {
        return clients.filter(client => {
            if (!client.appointmentDate) return false;
            if (client.appointmentDate.includes('-')) {
                const [y, m, d] = client.appointmentDate.split('-').map(Number);
                return y === currentDate.getFullYear() && (m - 1) === currentDate.getMonth() && d === day;
            }
            return false;
        }).sort((a, b) => (a.appointmentTime || '').localeCompare(b.appointmentTime || ''));
    };

    const handleDayClick = (day: number) => {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        setSelectedDay(date);
    };

    const selectedDayAppointments = selectedDay ? clients.filter(client => {
        if (!client.appointmentDate) return false;
        const [y, m, d] = client.appointmentDate.split('-').map(Number);
        return y === selectedDay.getFullYear() && (m - 1) === selectedDay.getMonth() && d === selectedDay.getDate();
    }).sort((a, b) => (a.appointmentTime || '').localeCompare(b.appointmentTime || '')) : [];

    const renderCalendarDays = () => {
        const days = [];
        const empties = firstDayOfMonth;

        // Empty cells
        for (let i = 0; i < empties; i++) {
            days.push(<div key={`empty-${i}`} className="bg-slate-50/50 min-h-[100px] border border-slate-100 hidden sm:block"></div>);
        }

        // Days
        for (let d = 1; d <= daysInMonth; d++) {
            const appointments = getAppointmentsForDay(d);
            const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), d).toDateString();
            const MAX_VISIBLE = 3;
            const remaining = appointments.length - MAX_VISIBLE;

            days.push(
                <div
                    key={d}
                    onClick={() => handleDayClick(d)}
                    className={`min-h-[80px] sm:min-h-[120px] bg-white border border-slate-100 p-1 sm:p-2 relative group hover:bg-slate-50 transition-colors cursor-pointer ${isToday ? 'bg-amber-50/30' : ''}`}
                >
                    <div className="flex justify-between items-start">
                        <span className={`text-xs sm:text-sm font-bold ${isToday ? 'text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full' : 'text-slate-700'}`}>
                            {d}
                        </span>
                        {appointments.length > 0 && (
                            <span className="sm:hidden text-[10px] bg-slate-100 text-slate-600 px-1 rounded-full font-medium">
                                {appointments.length}
                            </span>
                        )}
                    </div>

                    <div className="mt-1 space-y-1 hidden sm:block">
                        {appointments.slice(0, MAX_VISIBLE).map(client => (
                            <div
                                key={client.id}
                                className={`
                                    w-full text-left border rounded px-1 py-0.5 text-[9px] truncate transition-colors flex items-center gap-1
                                    ${client.status === 'consulate_appointment' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                        client.status === 'approved' ? 'bg-cyan-50 text-cyan-700 border-cyan-100' :
                                            client.status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                                'bg-amber-50 text-amber-700 border-amber-100'}
                                `}
                                title={`${client.firstName} ${client.lastName} - ${client.appointmentTime}`}
                            >
                                <span className="font-bold shrink-0">{client.appointmentTime}</span>
                                <span className="truncate">{client.firstName}</span>
                            </div>
                        ))}
                        {remaining > 0 && (
                            <div className="text-[10px] text-slate-500 font-medium text-center bg-slate-50 rounded py-0.5">
                                +{remaining} más...
                            </div>
                        )}
                    </div>
                </div>
            );
        }
        return days;
    };

    return (
        <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col relative">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <CalendarIcon className="w-6 h-6 text-slate-400" />
                        Agenda
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Gestión de citas y entrevistas.</p>
                </div>
                <div className="flex items-center gap-2 sm:gap-4 bg-white p-1 rounded-md border border-slate-200 shadow-sm">
                    <button onClick={prevMonth} className="p-1 hover:bg-slate-100 rounded-sm text-slate-500 hover:text-slate-900 transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm font-bold text-slate-900 w-24 sm:w-32 text-center capitalize select-none">
                        {capitalize(monthName)}
                    </span>
                    <button onClick={nextMonth} className="p-1 hover:bg-slate-100 rounded-sm text-slate-500 hover:text-slate-900 transition-colors">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
                <button
                    onClick={goToToday}
                    className="text-xs font-bold text-amber-600 hover:text-amber-700 hover:underline uppercase tracking-wider hidden sm:block"
                >
                    Hoy
                </button>
            </div>

            <div className="flex-1 bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
                    {['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'].map(day => (
                        <div key={day} className="py-2 text-center text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 flex-1 auto-rows-fr overflow-y-auto">
                    {renderCalendarDays()}
                </div>
            </div>

            {/* DAY DETAIL MODAL */}
            {selectedDay && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setSelectedDay(null)}>
                    <div
                        className="bg-white rounded-lg shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">
                                    {selectedDay.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </h3>
                                <p className="text-xs text-slate-500">
                                    {selectedDayAppointments.length} citas programadas
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedDay(null)}
                                className="p-1 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 space-y-2">
                            {selectedDayAppointments.length === 0 ? (
                                <div className="text-center py-8 text-slate-400 italic">
                                    No hay citas para este día.
                                </div>
                            ) : (
                                selectedDayAppointments.map(client => (
                                    <div
                                        key={client.id}
                                        onClick={() => navigate(`/clients/${client.id}`)}
                                        className="flex items-center gap-3 p-3 rounded-md border border-slate-100 hover:border-amber-200 hover:bg-amber-50 cursor-pointer group transition-all"
                                    >
                                        <div className={`
                                            w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-xs
                                            ${client.status === 'consulate_appointment' ? 'bg-emerald-100 text-emerald-700' :
                                                client.status === 'approved' ? 'bg-cyan-100 text-cyan-700' :
                                                    client.status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                                                        'bg-amber-100 text-amber-700'}
                                        `}>
                                            {client.appointmentTime || '--:--'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-900 truncate group-hover:text-amber-800">
                                                {client.firstName} {client.lastName}
                                            </p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {client.appointmentTime ? `${client.appointmentTime} hrs` : 'Sin hora'}
                                                </span>
                                                {client.tags && client.tags.length > 0 && (
                                                    <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 border border-slate-200 truncate max-w-[120px]">
                                                        {client.tags[0]}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-slate-300 group-hover:text-amber-400">
                                            <ChevronRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
