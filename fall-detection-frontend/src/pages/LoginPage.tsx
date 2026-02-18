import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { Link } from 'react-router-dom';
import { Mail, Lock, LogIn, UserPlus, Sun, Moon } from 'lucide-react';
import { buildApiUrl } from '../config/api';
import fallguardLogo from '../assets/fallguard-logo-escudo-pulso.svg';

export const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const { theme, toggleTheme } = useTheme();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await axios.post(buildApiUrl('/auth/login'), { email, password });
            const { token, user } = res.data;
            login(token, user.role, user.id, user.fullName, user.email);
            // Redirigir según el rol
            window.location.href = user.role === 'ADMIN' ? '/dashboard' : '/my-protection';
        } catch (error) {
            setError("Credenciales incorrectas");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
        setGoogleLoading(true);
        setError('');
        try {
            const token = credentialResponse.credential;
            const res = await axios.post(buildApiUrl('/auth/google-login'), { 
                token 
            });
            const { token: authToken, user } = res.data;
            login(authToken, user.role, user.id, user.fullName, user.email);
            // Redirigir según el rol
            window.location.href = user.role === 'ADMIN' ? '/dashboard' : '/my-protection';
        } catch (error: any) {
            setError(error.response?.data?.error || "Error en la autenticación de Google");
        } finally {
            setGoogleLoading(false);
        }
    };

    const handleGoogleError = () => {
        setError("Error al procesar el login de Google");
    };

    return (
        <div className="min-h-screen flex flex-col particle-bg transition-colors" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
            {/* Header con botón de tema */}
            <div className="flex justify-between items-center px-6 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
                <div className="flex items-center gap-3 group">
                    <img
                        src={fallguardLogo}
                        alt="FallGuard logo"
                        className="w-10 h-10 object-contain drop-shadow-[0_8px_20px_rgba(99,102,241,0.35)]"
                    />
                    <span className="font-bold text-lg tracking-tight" style={{ color: 'var(--color-text-primary)' }}>FallGuard</span>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleTheme();
                        }}
                        className="flex items-center justify-center p-2 rounded-lg transition-all"
                        style={{ 
                            backgroundColor: 'var(--color-bg-secondary)',
                            color: 'var(--color-text-secondary)',
                            border: `1px solid var(--color-border)`,
                            cursor: 'pointer',
                            pointerEvents: 'auto',
                            zIndex: 50
                        }}
                        title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                    >
                        {theme === 'dark' ? (
                            <Sun className="w-5 h-5" />
                        ) : (
                            <Moon className="w-5 h-5" />
                        )}
                    </button>
                </div>
            </div>

            {/* Contenido principal */}
            <div className="flex items-center justify-center flex-1">
                {/* Efectos de Fondo */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#6366F1] rounded-full mix-blend-multiply filter blur-[128px] opacity-10 animate-pulse"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#8B5CF6] rounded-full mix-blend-multiply filter blur-[128px] opacity-10 animate-pulse" style={{ animationDelay: '1s' }}></div>
                </div>

                {/* Formulario de Login */}
                <div className="relative z-10 w-full max-w-lg px-6 animate-scale-in">
                    <div className="rounded-2xl shadow-2xl overflow-hidden transition-colors" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)', borderWidth: '1px' }}>
                        {/* Header */}
                        <div className="bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] p-8 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl backdrop-blur-sm mb-4 glow-primary">
                                <img src={fallguardLogo} alt="FallGuard logo" className="w-12 h-12 object-contain" />
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-2">FallGuard</h2>
                            <p className="text-[#E0E7FF] text-sm">Sistema de Detección de Caídas</p>
                        </div>

                        {/* Formulario */}
                        <form onSubmit={handleSubmit} className="p-10 space-y-6">
                            {/* Mensaje de Error */}
                            {error && (
                                <div className="px-4 py-3 rounded-lg text-sm" style={{ 
                                    backgroundColor: 'rgba(127, 29, 29, 0.2)',
                                    borderColor: 'rgba(239, 68, 68, 0.5)',
                                    borderWidth: '1px',
                                    color: '#fca5a5'
                                }}>
                                    {error}
                                </div>
                            )}

                            {/* Campo Email */}
                            <div className="space-y-3">
                                <label className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--color-text-secondary)' }}>
                                    <Mail className="w-4 h-4" />
                                    Email
                                </label>
                                <input 
                                    type="email" 
                                    placeholder="correo@ejemplo.com" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full px-5 py-4 rounded-lg text-base focus:outline-none focus:ring-2 transition-all"
                                    style={{ 
                                        backgroundColor: 'var(--color-bg-elevated)',
                                        borderColor: 'var(--color-border)',
                                        borderWidth: '1px',
                                        color: 'var(--color-text-primary)'
                                    }}
                                />
                            </div>

                            {/* Campo Contraseña */}
                            <div className="space-y-3">
                                <label className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--color-text-secondary)' }}>
                                    <Lock className="w-4 h-4" />
                                    Contraseña
                                </label>
                                <input 
                                    type="password" 
                                    placeholder="••••••••" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full px-5 py-4 rounded-lg text-base focus:outline-none focus:ring-2 transition-all"
                                    style={{ 
                                        backgroundColor: 'var(--color-bg-elevated)',
                                        borderColor: 'var(--color-border)',
                                        borderWidth: '1px',
                                        color: 'var(--color-text-primary)'
                                    }}
                                />
                            </div>

                            {/* Botón Submit */}
                            <button 
                                type="submit"
                                disabled={loading || googleLoading}
                                className="w-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white py-3 px-4 rounded-lg 
                                         font-semibold flex items-center justify-center gap-2
                                         hover:from-[#818CF8] hover:to-[#A78BFA] 
                                         focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:ring-offset-2 focus:ring-offset-bg-secondary
                                         transition-all duration-300 hover-lift shadow-lg glow-primary
                                         disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Verificando...</span>
                                    </>
                                ) : (
                                    <>
                                        <LogIn className="w-5 h-5" />
                                        <span>Iniciar Sesión</span>
                                    </>
                                )}
                            </button>

                            {/* Boton Registrar */}
                            <Link
                                to="/register"
                                className="w-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white py-3 px-4 rounded-lg 
                                         font-semibold flex items-center justify-center gap-2
                                         hover:from-[#818CF8] hover:to-[#A78BFA] 
                                         focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:ring-offset-2 focus:ring-offset-bg-secondary
                                         transition-all duration-300 hover-lift shadow-lg glow-primary"
                            >
                                <UserPlus className="w-5 h-5" />
                                <span>Registrarse</span>
                            </Link>

                            {/* Divider */}
                            <div className="flex items-center gap-4 my-6">
                                <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-border)' }}></div>
                                <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>O continúa con</span>
                                <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-border)' }}></div>
                            </div>

                            {/* Google Login Button */}
                            <div className="flex justify-center">
                                <GoogleLogin
                                    onSuccess={handleGoogleSuccess}
                                    onError={handleGoogleError}
                                    text="signin_with"
                                    locale="es_ES"
                                    width="320"
                                />
                            </div>
                        </form>

                        {/* Footer */}
                        <div className="px-8 pb-8 text-center">
                            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                                Sistema de Monitoreo en Tiempo Real
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
