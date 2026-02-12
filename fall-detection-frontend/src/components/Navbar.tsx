import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, LogOut } from 'lucide-react';

export const Navbar = () => {
    const { user } = useAuth();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('userId');
        localStorage.removeItem('userFullName');
        localStorage.removeItem('userEmail');
        window.location.replace('/');
    };

    if (!user) return null;

    return (
        <nav className="bg-[#1A1F26] border-b border-[#1E293B] backdrop-blur-sm sticky top-0 z-50 animate-fade-in">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo y Navegación Principal */}
                    <div className="flex items-center gap-8">
                        {/* Logo */}
                        <Link to={user.role === 'ADMIN' ? '/dashboard' : '/my-protection'} className="flex items-center gap-2 group">
                            <div className="bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] p-2 rounded-lg shadow-lg glow-primary">
                                <ShieldAlert className="w-6 h-6 text-white" />
                            </div>
                            <span className="font-black text-xl tracking-tight text-[#F1F5F9] group-hover:text-[#818CF8] transition-colors">
                                FALL-DETECT
                            </span>
                        </Link>
                        
                        {/* Admin Panel Link */}
                        {user.role === 'ADMIN' && (
                            <Link to="/dashboard" className="ml-4 px-4 py-2 bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:shadow-lg hover:shadow-[#6366F1]/50 text-white text-sm font-semibold rounded-lg transition-all">
                                Panel de Administración
                            </Link>
                        )}
                        
                        {/* Navegación según el rol */}
                        {user.role === 'ADMIN' ? (
                            <div className="flex gap-4 border-l pl-4 border-blue-700">
                                <Link to="/admin/users" className="hover:text-blue-300 text-sm">Usuarios</Link>
                                <Link to="/admin/patients" className="hover:text-blue-300 text-sm">Pacientes</Link>
                                <Link to="/admin/devices" className="hover:text-blue-300 text-sm">Dispositivos</Link>
                                <Link to="/admin/events" className="hover:text-blue-300 text-sm">Eventos</Link>
                                <Link to="/admin?tab=podium" className="hover:text-blue-300 text-sm">Podium</Link>
                            </div>
                        ) : (
                            <div className="flex gap-4 border-l pl-4 border-blue-700">
                                <Link to="/my-protection" className="hover:text-blue-300 text-sm">Mi Protección</Link>
                            </div>
                        )}
                    </div>

                    {/* Usuario y Logout */}
                    <div className="flex items-center gap-4">
                        {/* Badge de Rol */}
                        <span className="hidden sm:block px-3 py-1.5 bg-[#252B35] text-[#06B6D4] text-xs font-semibold rounded-full border border-[#1E293B]">
                            {user.role}
                        </span>
                        
                        {/* Botón de Logout */}
                        <button 
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 bg-[#252B35] hover:bg-[#EF4444] text-[#94A3B8] hover:text-white rounded-lg transition-all hover-lift"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="hidden sm:inline font-medium">Salir</span>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};
