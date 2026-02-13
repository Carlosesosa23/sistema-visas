import { Link, useLocation } from 'react-router-dom';
import { useClientStore } from '../store/clientStore';
import { LayoutDashboard, Users, Calendar, Settings } from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const location = useLocation();
    const links = [
        { href: '/', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/clients', label: 'Clientes', icon: Users },
        { href: '/schedule', label: 'Agenda', icon: Calendar },
        { href: '/settings', label: 'Configuración', icon: Settings },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={cn(
                    "fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            {/* Sidebar */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-slate-900 to-black border-r border-slate-800 transition-transform duration-200 shadow-2xl",
                "lg:static lg:translate-x-0",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="h-full flex flex-col">
                    <div className="h-48 flex flex-col items-center justify-center px-6 border-b border-white/5 bg-black/20 relative overflow-hidden">
                        {/* Decorative glow */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                        {/* Logo & Name */}
                        <div className="flex flex-col items-center relative z-10">
                            {useClientStore().agencyLogo ? (
                                <img
                                    src={useClientStore().agencyLogo}
                                    alt={useClientStore().agencyName}
                                    className="w-24 h-24 mb-3 object-contain drop-shadow-2xl transform hover:scale-105 transition-transform duration-500 rounded-lg p-1"
                                />
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" className="w-20 h-20 mb-3 drop-shadow-2xl transform hover:scale-105 transition-transform duration-500">
                                    <defs>
                                        <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" style={{ stopColor: '#FCD34D', stopOpacity: 1 }} />
                                            <stop offset="50%" style={{ stopColor: '#D97706', stopOpacity: 1 }} />
                                            <stop offset="100%" style={{ stopColor: '#B45309', stopOpacity: 1 }} />
                                        </linearGradient>
                                        <filter id="shadow">
                                            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.5" />
                                        </filter>
                                    </defs>
                                    <rect width="200" height="200" rx="40" fill="#0f172a" stroke="url(#goldGradient)" strokeWidth="2" />
                                    <text x="100" y="130" fontFamily="serif" fontWeight="900" fontSize="120" textAnchor="middle" fill="url(#goldGradient)" filter="url(#shadow)" letterSpacing="-5">DK</text>
                                </svg>
                            )}

                            <h1 className="text-xl font-bold text-white tracking-widest uppercase text-center leading-tight px-2">
                                {useClientStore().agencyName}
                            </h1>
                            <span className="text-[10px] text-amber-400 tracking-[0.3em] font-bold uppercase mt-1 opacity-90">Visa Services</span>
                        </div>
                    </div>

                    <nav className="flex-1 px-4 py-8 space-y-2">
                        {links.map((link) => {
                            const Icon = link.icon;
                            const isActive = location.pathname === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    to={link.href}
                                    onClick={() => window.innerWidth < 1024 && onClose()}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3.5 rounded-md text-sm font-medium transition-all duration-300 group relative overflow-hidden",
                                        isActive
                                            ? "text-white shadow-md shadow-black/20"
                                            : "text-slate-400 hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    {isActive && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-amber-500 opacity-90" />
                                    )}
                                    <Icon className={cn("w-5 h-5 relative z-10 transition-colors", isActive ? "text-white" : "text-slate-500 group-hover:text-amber-400")} />
                                    <span className="relative z-10">{link.label}</span>
                                </Link>
                            )
                        })}
                    </nav>

                    <div className="p-4 border-t border-slate-800 bg-slate-950/30">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-md bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-xs border border-slate-700">
                                AM
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-200 truncate">Admin User</p>
                                <p className="text-xs text-slate-500 truncate">admin@visas.com</p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
