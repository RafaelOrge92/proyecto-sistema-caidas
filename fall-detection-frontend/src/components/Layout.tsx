import { ReactElement } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';

const Layout = (): ReactElement => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  const isActive = (path: string): string => 
    location.pathname === path ? 'bg-blue-700' : 'hover:bg-blue-600';

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-blue-800 text-white flex flex-col shadow-xl">
        <div className="p-6 text-2xl font-bold border-b border-blue-700 flex items-center gap-2">
          <span>🚨</span>
          <span>FallDetect</span>
        </div>

        <nav className="flex-grow p-4 space-y-2">
          <Link 
            to="/dashboard" 
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive('/dashboard')}`}
          >
            <span>📊</span>
            <span>Dashboard</span>
          </Link>

          <Link 
            to="/admin" 
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive('/admin')}`}
          >
            <span>👥</span>
            <span>Gestión Usuarios</span>
          </Link>
        </nav>

        {/* LOGOUT */}
        <div className="p-4 border-t border-blue-700">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full p-3 hover:bg-red-600 rounded-lg transition-colors text-left"
          >
            <span>🚪</span>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* ÁREA DE CONTENIDO */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        
        <header className="bg-white shadow-sm p-4 flex justify-end items-center">
          <div className="flex items-center gap-4 px-4 border-l">
            <span className="text-sm font-medium text-gray-700">Rafa (Admin)</span>
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
              RA
            </div>
          </div>
        </header>

        <main className="p-6">
          <Outlet /> 
        </main>
      </div>
    </div>
  );
};

export default Layout;