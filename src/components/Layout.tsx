
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Menu } from 'lucide-react';

interface LayoutProps {
    children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-slate-50 text-slate-900 font-sans selection:bg-slate-900 selection:text-white">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header for Mobile */}
                <header className="lg:hidden h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 shrink-0">
                    <span className="text-lg font-bold text-white tracking-tight">DK Asesorias</span>
                    <button onClick={() => setSidebarOpen(true)} className="p-2 text-slate-400 hover:text-white">
                        <Menu className="w-6 h-6" />
                    </button>
                </header>

                <main className="flex-1 overflow-auto p-4 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
