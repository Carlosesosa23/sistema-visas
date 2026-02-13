import { Routes, Route, useNavigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ExcelImporter } from './components/ExcelImporter';
import { ClientList } from './components/ClientList';
import { ClientDetails } from './pages/ClientDetails';
import { Agenda } from './pages/Agenda';
import { Settings } from './pages/Settings';

import { useClientStore } from './store/clientStore';

import { useEffect } from 'react'; // Added import

function Dashboard() {
  const { clients, agencyName, fetchClients } = useClientStore(); // Destructure fetchClients
  const navigate = useNavigate();

  // Load clients from Supabase on mount
  useEffect(() => {
    fetchClients();
  }, []); // Only run once


  const totalClients = clients.length;
  // Logic for upcoming appointments (clients with future dates)
  const upcomingAppointments = clients.filter(c => {
    if (!c.appointmentCas && !c.appointmentConsulate && !c.appointmentDate) return false;
    const today = new Date();
    // Check standard date field first
    if (c.appointmentDate) {
      const appDate = new Date(c.appointmentDate);
      if (appDate >= today) return true;
    }
    const casDate = c.appointmentCas ? new Date(c.appointmentCas) : null;
    const consulateDate = c.appointmentConsulate ? new Date(c.appointmentConsulate) : null;
    return (casDate && casDate >= today) || (consulateDate && consulateDate >= today);
  }).length;

  const pendingPayments = clients.filter(c => c.status === 'pending' || c.status === 'ds160').length;

  return (
    <div className="space-y-8">
      {/* Header with decorative background */}
      <div className="relative">
        <div className="absolute -left-8 -top-8 w-64 h-64 bg-slate-200/50 rounded-full blur-3xl pointer-events-none -z-10" />
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{agencyName}</h1>
        <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
          <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
          Resumen de trámites y actividades recientes.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div
          onClick={() => navigate('/clients')}
          className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 hover:shadow-xl hover:border-amber-200 transition-all duration-300 group relative overflow-hidden cursor-pointer"
        >
          <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-bl from-slate-100 to-transparent opacity-50 rounded-bl-full transition-transform group-hover:scale-110" />
          <h3 className="text-slate-400 text-xs uppercase tracking-widest font-bold">Clientes Totales</h3>
          <p className="text-4xl font-black text-slate-900 mt-2 tracking-tight group-hover:text-slate-800 transition-colors">{totalClients}</p>
        </div>
        <div
          onClick={() => navigate('/schedule')}
          className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-lg shadow-lg border border-slate-700 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 relative overflow-hidden group cursor-pointer"
        >
          <div className="absolute -right-4 -top-4 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl group-hover:bg-amber-500/30 transition-all" />
          <h3 className="text-amber-500/80 text-xs uppercase tracking-widest font-bold">Citas Próximas</h3>
          <p className="text-4xl font-black text-white mt-2 tracking-tight">{upcomingAppointments}</p>
        </div>
        <div
          onClick={() => navigate('/clients?search=pending')}
          className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 hover:shadow-xl hover:border-amber-200 transition-all duration-300 group cursor-pointer"
        >
          <h3 className="text-slate-400 text-xs uppercase tracking-widest font-bold">Pendientes</h3>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-black text-slate-900 mt-2 tracking-tight">{pendingPayments}</p>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Acción Requerida</span>
          </div>
          <p className="text-xs text-slate-400 mt-2 font-medium">DS-160 / Pagos</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="text-lg font-bold text-slate-900 mb-4 tracking-tight">Clientes Recientes</h2>
          <ClientList />
        </div>
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-4 tracking-tight">Acciones Rápidas</h2>
            <ExcelImporter />
          </div>
        </div>
      </div>
    </div>
  );
}

function ClientsPage() {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gestión de Clientes</h1>
          <p className="text-slate-500 text-sm mt-1">Administra y da seguimiento a tus trámites.</p>
        </div>
        <button
          onClick={() => navigate('/clients/new')}
          className="bg-slate-900 text-white px-4 py-2 rounded-sm hover:bg-slate-800 font-medium text-sm transition-all border border-transparent shadow-sm hover:shadow-md"
        >
          Nuevo Cliente
        </button>
      </div>
      <ClientList />
    </div>
  )
}

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/clients/:id" element={<ClientDetails />} />
        <Route path="/schedule" element={<Agenda />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  )
}

export default App

