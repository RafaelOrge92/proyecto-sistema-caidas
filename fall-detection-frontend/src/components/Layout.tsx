import { ReactElement } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { ShieldAlert, LayoutDashboard, Users, LogOut } from 'lucide-react';

const Layout = (): ReactElement => {
  const location = useLocation();

  const handleLogout = (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    localStorage.removeItem('userFullName');
    localStorage.removeItem('userEmail');
    window.location.replace('/');
  };

  const isActive = (path: string): string => 
    location.pathname === path ? 'bg-[#6366F1] text-white' : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#252B35]';

  return (
    <div className="flex h-screen bg-[#0F1419] overflow-hidden font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#1A1F26] text-[#F1F5F9] flex flex-col shadow-xl border-r border-[#1E293B]">
        <div className="p-6 text-2xl font-bold border-b border-[#1E293B] flex items-center gap-2">
          <div className="bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] p-2 rounded-lg shadow-lg glow-primary">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <span>Fall-Detect</span>
        </div>

        <nav className="flex-grow p-4 space-y-2">
          <Link 
            to="/dashboard" 
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all hover-lift font-medium ${isActive('/dashboard')}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </Link>

          <Link 
            to="/admin" 
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all hover-lift font-medium ${isActive('/admin')}`}
          >
            <Users className="w-5 h-5" />
            <span>Gestión Usuarios</span>
          </Link>
        </nav>

        {/* LOGOUT */}
        <div className="p-4 border-t border-[#1E293B]">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 hover:bg-[#DC2626]/20 hover:text-[#EF4444] rounded-lg transition-all font-medium text-left text-[#94A3B8]"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* ÁREA DE CONTENIDO */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        
        <header className="bg-[#1A1F26] border-b border-[#1E293B] shadow-sm p-6 flex justify-end items-center">
          <div className="flex items-center gap-4 px-4 border-l border-[#1E293B]">
            <span className="text-sm font-medium text-[#F1F5F9]">Usuario (Admin)</span>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center text-white text-xs font-bold">
              UA
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 bg-[#0F1419] overflow-auto">
          <Outlet /> 
        </main>
      </div>
    </div>
  );
};

export default Layout;