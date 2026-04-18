import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, HandCoins, FileText, BarChart3, 
  Bell, Menu, X, ChevronRight, LogOut, Wallet, Calculator, RefreshCw, ScrollText, ClipboardList
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_69b62672be45da00af3df17b/0d96f8146_LogodeinversionesCTEC.png";

const navItems = [
  { path: '/Dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/Clients', icon: Users, label: 'Clientes' },
  { path: '/Loans', icon: HandCoins, label: 'Préstamos' },
  { path: '/Payments', icon: FileText, label: 'Pagos' },
  { path: '/Reports', icon: BarChart3, label: 'Reportes' },
  { path: '/Alerts', icon: Bell, label: 'Alertas' },
  { path: '/Caja', icon: Wallet, label: 'Caja' },
  { path: '/Calculadora', icon: Calculator, label: 'Calculadora' },
  { path: '/Contracts', icon: ScrollText, label: 'Contratos' },
  { path: '/ClientStatement', icon: ClipboardList, label: 'Estado de Cuenta' },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#0a0e17] text-gray-100 flex">
      <style>{`
        :root {
          --ctec-gold: #d4a533;
          --ctec-emerald: #10b981;
          --ctec-dark: #0a0e17;
          --ctec-card: #111827;
          --ctec-border: #1e293b;
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0a0e17; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #334155; }
      `}</style>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-[#111827] border-r border-[#1e293b]
        flex flex-col transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-5 flex items-center gap-3 border-b border-[#1e293b]">
          <img src={LOGO_URL} alt="CTEC" className="w-10 h-10 rounded-lg object-contain" />
          <div>
            <h1 className="text-sm font-bold text-[#d4a533] tracking-wide">INVERSIONES</h1>
            <p className="text-xs text-emerald-400 font-semibold tracking-widest">CTEC</p>
          </div>
          <button className="lg:hidden ml-auto" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-all duration-200 group
                  ${isActive 
                    ? 'bg-gradient-to-r from-[#d4a533]/15 to-emerald-500/10 text-[#d4a533] border border-[#d4a533]/20' 
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}
                `}
              >
                <item.icon className={`w-4.5 h-4.5 ${isActive ? 'text-[#d4a533]' : 'text-gray-500 group-hover:text-gray-300'}`} />
                {item.label}
                {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-[#1e293b]">
          <button 
            onClick={() => base44.auth.logout()}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:text-red-400 hover:bg-red-500/5 w-full transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-[#111827]/80 backdrop-blur-xl border-b border-[#1e293b] flex items-center px-4 lg:px-6 sticky top-0 z-30">
          <button className="lg:hidden mr-3" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5 text-gray-400" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <button onClick={() => window.location.reload()} title="Actualizar" className="p-2 rounded-lg hover:bg-white/5 transition-colors text-gray-400 hover:text-[#d4a533]">
              <RefreshCw className="w-4 h-4" />
            </button>
            <Link to="/Alerts" className="relative p-2 rounded-lg hover:bg-white/5 transition-colors">
              <Bell className="w-4 h-4 text-gray-400" />
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}