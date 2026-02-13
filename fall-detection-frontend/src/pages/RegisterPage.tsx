import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, Mail, Lock, UserPlus, User, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const RegisterPage = () => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await axios.post('http://localhost:3000/api/users', {
                fullName,
                email,
                password,
                role: 'MEMBER'
            });
            setSuccess(true);
        } catch (err: any) {
            setError(err.response?.data?.error || 'No se pudo crear el usuario');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-bg-primary particle-bg transition-colors">
            {/* Header con botón de tema */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-border">
                <div className="flex items-center gap-3 group">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] rounded-xl flex items-center justify-center shadow-lg glow-primary">
                        <ShieldAlert className="w-6 h-6 text-white" />
                    </div>
                    <span className="font-bold text-lg text-text-primary tracking-tight">Fall-Detect</span>
                </div>
                <button
                    onClick={toggleTheme}
                    className="flex items-center justify-center p-2 rounded-lg transition-colors hover:bg-white/10"
                    title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                >
                    {theme === 'dark' ? (
                        <Sun className="w-5 h-5 text-text-secondary" />
                    ) : (
                        <Moon className="w-5 h-5 text-text-secondary" />
                    )}
                </button>
            </div>

            {/* Contenido principal */}
            <div className="flex items-center justify-center flex-1">
                {/* Efectos de Fondo */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#6366F1] rounded-full mix-blend-multiply filter blur-[128px] opacity-10 animate-pulse"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#8B5CF6] rounded-full mix-blend-multiply filter blur-[128px] opacity-10 animate-pulse" style={{ animationDelay: '1s' }}></div>
                </div>

                {/* Formulario de Registro */}
                <div className="relative z-10 w-full max-w-lg px-6 animate-scale-in">
                    <div className="bg-bg-secondary rounded-2xl shadow-2xl border border-border overflow-hidden transition-colors">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] p-8 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl backdrop-blur-sm mb-4 glow-primary">
                                <ShieldAlert className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-2">Crear Cuenta</h2>
                            <p className="text-[#E0E7FF] text-sm">Sistema de Deteccion de Caidas</p>
                        </div>

                        {/* Formulario */}
                        <form onSubmit={handleSubmit} className="p-10 space-y-6">
                            {/* Mensaje de Error */}
                            {error && (
                                <div className="bg-red-900/30 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            {/* Mensaje de Exito */}
                            {success && (
                                <div className="bg-emerald-900/30 border border-emerald-500/50 text-emerald-200 px-4 py-3 rounded-lg text-sm">
                                    Cuenta creada. Ya puedes iniciar sesion.
                                </div>
                            )}

                            {/* Campo Nombre */}
                            <div className="space-y-3">
                                <label className="text-text-secondary text-sm font-semibold flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    Nombre completo
                                </label>
                                <input
                                    type="text"
                                    placeholder="Nombre y apellido"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                    className="w-full bg-bg-elevated border border-border text-text-primary px-5 py-4 rounded-lg text-base
                                             focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
                                             transition-all placeholder:text-text-secondary"
                                />
                            </div>

                            {/* Campo Email */}
                            <div className="space-y-3">
                                <label className="text-text-secondary text-sm font-semibold flex items-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    Email
                                </label>
                                <input
                                    type="email"
                                    placeholder="correo@ejemplo.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full bg-bg-elevated border border-border text-text-primary px-5 py-4 rounded-lg text-base
                                             focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
                                             transition-all placeholder:text-text-secondary"
                                />
                            </div>

                            {/* Campo Contraseña */}
                            <div className="space-y-3">
                                <label className="text-text-secondary text-sm font-semibold flex items-center gap-2">
                                    <Lock className="w-4 h-4" />
                                    Contrasena
                                </label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full bg-bg-elevated border border-border text-text-primary px-5 py-4 rounded-lg text-base
                                             focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
                                             transition-all placeholder:text-text-secondary"
                                />
                            </div>

                            {/* Boton Submit */}
                            <button
                                type="submit"
                                disabled={loading}
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
                                        <span>Creando...</span>
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="w-5 h-5" />
                                        <span>Registrarse</span>
                                    </>
                                )}
                            </button>

                            <div className="flex items-center justify-between text-sm">
                                <Link
                                    to="/login"
                                    className="text-text-secondary hover:text-text-primary transition-colors"
                                >
                                    Ya tienes cuenta? Inicia sesion
                                </Link>
                                {success && (
                                    <button
                                        type="button"
                                        onClick={() => navigate('/login')}
                                        className="text-text-primary hover:text-text-secondary transition-colors"
                                    >
                                        Ir a login
                                    </button>
                                )}
                            </div>
                        </form>

                        {/* Footer */}
                        <div className="px-8 pb-8 text-center">
                            <p className="text-text-secondary text-sm">
                                Sistema de Monitoreo en Tiempo Real
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
