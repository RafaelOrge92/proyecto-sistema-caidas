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
        <nav className="border-b backdrop-blur-sm sticky top-0 z-50 animate-fade-in transition-colors" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center gap-8">
                        <Link to={user.role === 'ADMIN' ? '/dashboard' : '/my-protection'} className="flex items-center gap-2 group">
                            <div className="bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] p-2 rounded-lg shadow-lg glow-primary">
                                <ShieldAlert className="w-6 h-6 text-white" />
                            </div>
                            <span className="font-black text-xl tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
                                FALL-DETECT
                            </span>
                        </Link>

                        {user.role === 'ADMIN' && (
                            <Link to="/dashboard" className="ml-4 px-4 py-2 bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:shadow-lg hover:shadow-[#6366F1]/50 text-white text-sm font-semibold rounded-lg transition-all">
                                Panel de Administracion
                            </Link>
                        )}

                        {user.role === 'ADMIN' ? (
                            <div className="flex gap-4 border-l pl-4" style={{ borderColor: 'rgba(99, 102, 241, 0.3)' }}>
                                <Link to="/admin/users" className="text-sm transition-colors" style={{ color: 'var(--color-text-secondary)' }}>Usuarios</Link>
                                <Link to="/admin/patients" className="text-sm transition-colors" style={{ color: 'var(--color-text-secondary)' }}>Pacientes</Link>
                                <Link to="/admin/devices" className="text-sm transition-colors" style={{ color: 'var(--color-text-secondary)' }}>Dispositivos</Link>
                                <Link to="/admin/events" className="text-sm transition-colors" style={{ color: 'var(--color-text-secondary)' }}>Eventos</Link>
                                <Link to="/admin?tab=podium" className="text-sm transition-colors" style={{ color: 'var(--color-text-secondary)' }}>Podium</Link>
                            </div>
                        ) : (
                            <div className="flex gap-4 border-l pl-4" style={{ borderColor: 'rgba(99, 102, 241, 0.3)' }}>
                                <Link to="/my-protection" className="text-sm transition-colors" style={{ color: 'var(--color-text-secondary)' }}>Mi Proteccion</Link>
                                <Link to="/member/events" className="text-sm transition-colors" style={{ color: 'var(--color-text-secondary)' }}>Eventos</Link>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="hidden sm:block px-3 py-1.5 text-xs font-semibold rounded-full" style={{ backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-primary)', borderColor: 'var(--color-border)', borderWidth: '1px' }}>
                            {user.role}
                        </span>

                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleTheme();
                            }}
                            className="flex items-center justify-center p-2 rounded-lg transition-all"
                            style={{ 
                                backgroundColor: 'var(--color-bg-elevated)',
                                color: 'var(--color-text-secondary)',
                                border: `1px solid var(--color-border)`,
                                cursor: 'pointer'
                            }}
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
                            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium"
                            style={{ 
                                backgroundColor: 'var(--color-bg-elevated)',
                                color: 'var(--color-text-secondary)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#EF4444';
                                e.currentTarget.style.color = 'white';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated)';
                                e.currentTarget.style.color = 'var(--color-text-secondary)';
                            }}
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="hidden sm:inline">Salir</span>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};
