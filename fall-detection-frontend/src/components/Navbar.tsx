import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, LayoutDashboard, Users, HardDrive, LogOut } from 'lucide-react';

export const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!user) return null;

    return (
        <nav className="bg-[#1A1F26] border-b border-[#1E293B] backdrop-blur-sm sticky top-0 z-50 animate-fade-in">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo y Navegación Principal */}
                    <div className="flex items-center gap-8">
                        {/* Logo */}
                        <Link to="/dashboard" className="flex items-center gap-2 group">
                            <div className="bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] p-2 rounded-lg shadow-lg glow-primary">
                                <ShieldAlert className="w-6 h-6 text-white" />
                            </div>
                            <span className="font-black text-xl tracking-tight text-[#F1F5F9] group-hover:text-[#818CF8] transition-colors">
                                FALL-DETECT
                            </span>
                        </Link>

                        {/* Links de Navegación */}
                        <div className="hidden md:flex items-center gap-6">
                            <Link 
                                to="/dashboard" 
                                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#252B35] text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#2D3440] transition-all hover-lift"
                            >
                                <LayoutDashboard className="w-4 h-4" />
                                <span className="font-medium">Dashboard</span>
                            </Link>
                            
                            {user.role === 'ADMIN' && (
                                <>
                                    <Link 
                                        to="/admin" 
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white hover:from-[#818CF8] hover:to-[#A78BFA] transition-all hover-lift shadow-lg"
                                    >
                                        <Users className="w-4 h-4" />
                                        <span className="font-semibold">Panel Admin</span>
                                    </Link>
                                    
                                    <div className="flex items-center gap-4 pl-6 border-l border-[#1E293B]">
                                        <Link 
                                            to="/admin/users" 
                                            className="px-4 py-2 text-sm text-[#94A3B8] hover:text-[#06B6D4] transition-colors font-medium"
                                        >
                                            Usuarios
                                        </Link>
                                        <Link 
                                            to="/admin/devices" 
                                            className="px-4 py-2 text-sm text-[#94A3B8] hover:text-[#06B6D4] transition-colors font-medium flex items-center gap-1"
                                        >
                                            <HardDrive className="w-3 h-3" />
                                            Dispositivos
                                        </Link>
                                    </div>
                                </>
                            )}
                        </div>
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