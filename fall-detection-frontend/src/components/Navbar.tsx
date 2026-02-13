import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ShieldAlert, LogOut, Sun, Moon } from 'lucide-react';

export const Navbar = () => {
    const { user } = useAuth();
    const { theme, toggleTheme } = useTheme();

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
        <nav className="bg-bg-secondary border-b border-border backdrop-blur-sm sticky top-0 z-50 animate-fade-in transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center gap-8">
                        <Link to={user.role === 'ADMIN' ? '/dashboard' : '/my-protection'} className="flex items-center gap-2 group">
                            <div className="bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] p-2 rounded-lg shadow-lg glow-primary">
                                <ShieldAlert className="w-6 h-6 text-white" />
                            </div>
                            <span className="font-black text-xl tracking-tight text-text-primary group-hover:text-primary-hover transition-colors">
                                FALL-DETECT
                            </span>
                        </Link>

                        {user.role === 'ADMIN' && (
                            <Link to="/dashboard" className="ml-4 px-4 py-2 bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:shadow-lg hover:shadow-[#6366F1]/50 text-white text-sm font-semibold rounded-lg transition-all">
                                Panel de Administracion
                            </Link>
                        )}

                        {user.role === 'ADMIN' ? (
                            <div className="flex gap-4 border-l pl-4 border-primary/30">
                                <Link to="/admin/users" className="hover:text-primary text-text-secondary text-sm transition-colors">Usuarios</Link>
                                <Link to="/admin/patients" className="hover:text-primary text-text-secondary text-sm transition-colors">Pacientes</Link>
                                <Link to="/admin/devices" className="hover:text-primary text-text-secondary text-sm transition-colors">Dispositivos</Link>
                                <Link to="/admin/events" className="hover:text-primary text-text-secondary text-sm transition-colors">Eventos</Link>
                                <Link to="/admin?tab=podium" className="hover:text-primary text-text-secondary text-sm transition-colors">Podium</Link>
                            </div>
                        ) : (
                            <div className="flex gap-4 border-l pl-4 border-primary/30">
                                <Link to="/my-protection" className="hover:text-primary text-text-secondary text-sm transition-colors">Mi Proteccion</Link>
                                <Link to="/member/events" className="hover:text-primary text-text-secondary text-sm transition-colors">Eventos</Link>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="hidden sm:block px-3 py-1.5 bg-bg-elevated text-primary text-xs font-semibold rounded-full border border-border transition-colors">
                            {user.role}
                        </span>

                        <button
                            onClick={toggleTheme}
                            className="flex items-center justify-center p-2 bg-bg-elevated hover:bg-primary text-text-secondary hover:text-white rounded-lg transition-all hover-lift"
                            title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                        >
                            {theme === 'dark' ? (
                                <Sun className="w-5 h-5" />
                            ) : (
                                <Moon className="w-5 h-5" />
                            )}
                        </button>

                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 bg-bg-elevated hover:bg-[#EF4444] text-text-secondary hover:text-white rounded-lg transition-all hover-lift"
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
