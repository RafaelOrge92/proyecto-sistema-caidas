import React, { useEffect, useState } from 'react';
import { AdminService } from '../services/adminService';
import { FallEvent } from '../types';
import { Calendar, HardDrive, UserCheck, Activity, Search } from 'lucide-react';

export const EventsPage: React.FC = () => {
    const [events, setEvents] = useState<FallEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        try {
            const response = await AdminService.getEvents();
            setEvents(response.data);
        } catch (error) {
            console.error("Error cargando eventos", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'OPEN': return 'bg-red-500/10 text-red-400 border-red-500/20';
            case 'CONFIRMED_FALL': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
            case 'FALSE_ALARM': return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
            case 'RESOLVED': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto reveal">
            {/* Header Estilo Apple */}
            <header className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                <div>
                    <h1 className="text-5xl font-bold tracking-tight mb-2 text-white">Historial</h1>
                    <p className="text-xl text-[#94A3B8]">Registro detallado de todos los incidentes detectados.</p>
                </div>
                <div className="flex gap-3">
                    <button className="glass-panel px-6 py-3 rounded-full font-semibold text-white hover:bg-[#252B35] transition-all flex items-center gap-2">
                        <Activity size={18} /> Exportar Log
                    </button>
                </div>
            </header>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Barra de Búsqueda Minimalista */}
                    <div className="relative mb-8">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                        <input 
                            type="text" 
                            placeholder="Filtrar por dispositivo o paciente..." 
                            className="w-full bg-[#1A1F26] border-none rounded-2xl py-4 pl-12 pr-6 focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-lg text-white"
                        />
                    </div>

                    {/* Tabla transformada en Lista Pro */}
                    <div className="glass-panel overflow-hidden border border-white/5">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/5">
                                        <th className="px-8 py-5 text-sm font-bold text-[#94A3B8] uppercase tracking-widest">Fecha y Hora</th>
                                        <th className="px-8 py-5 text-sm font-bold text-[#94A3B8] uppercase tracking-widest">Dispositivo</th>
                                        <th className="px-8 py-5 text-sm font-bold text-[#94A3B8] uppercase tracking-widest">Tipo</th>
                                        <th className="px-8 py-5 text-sm font-bold text-[#94A3B8] uppercase tracking-widest">Estado</th>
                                        <th className="px-8 py-5 text-sm font-bold text-[#94A3B8] uppercase tracking-widest">Revisión</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {events.map(event => (
                                        <tr key={event.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <Calendar size={18} className="text-indigo-400 opacity-70" />
                                                    <span className="text-white font-medium">
                                                        {event.occurredAt ? new Date(event.occurredAt).toLocaleString() : '-'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <HardDrive size={18} className="text-cyan-400 opacity-70" />
                                                    <code className="bg-white/5 px-3 py-1 rounded-lg text-sm text-cyan-100">
                                                        {event.deviceId}
                                                    </code>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-[#94A3B8] font-semibold tracking-tight">{event.eventType}</span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`px-4 py-1.5 rounded-full text-xs font-bold border ${getStatusBadge(event.status || '')}`}>
                                                    {event.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                {event.reviewedBy ? (
                                                    <div className="flex items-center gap-3">
                                                        <UserCheck size={18} className="text-emerald-400" />
                                                        <div>
                                                            <p className="text-white font-bold text-sm">{event.reviewedBy}</p>
                                                            {event.reviewComment && (
                                                                <p className="text-xs text-[#94A3B8] italic truncate max-w-[150px]">
                                                                    "{event.reviewComment}"
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-[#64748B] text-sm italic">Pendiente</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {events.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="py-20 text-center text-[#64748B]">
                                                <Activity size={48} className="mx-auto mb-4 opacity-20" />
                                                <p className="text-xl">No hay eventos registrados en el sistema.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};