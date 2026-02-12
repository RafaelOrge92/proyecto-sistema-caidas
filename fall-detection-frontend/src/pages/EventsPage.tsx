import React, { useEffect, useState } from 'react';
import { AdminService } from '../services/adminService';
import { FallEvent } from '../types';
import { Calendar, HardDrive, UserCheck, Activity, Search, AlertTriangle, X } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const EventsPage: React.FC = () => {
    const [events, setEvents] = useState<FallEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<FallEvent | null>(null);
    const [modalLoading, setModalLoading] = useState(false);

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        try {
            const response = await AdminService.getEvents();
            setEvents(response.data);
            setError(null);
        } catch (error) {
            console.error("Error cargando eventos", error);
            setError("No se pudieron cargar los eventos. Verifica tu conexión.");
        } finally {
            setLoading(false);
        }
    };

    const loadEventDetails = async (eventId: string) => {
        setModalLoading(true);
        try {
            const response = await AdminService.getEventById(eventId);
            setSelectedEvent(response.data);
        } catch (error) {
            console.error("Error cargando detalles del evento", error);
            alert("No se pudieron cargar los detalles del evento");
        } finally {
            setModalLoading(false);
        }
    };

    // Filtrar eventos según el término de búsqueda
    const filteredEvents = events.filter(event => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            event.deviceId?.toLowerCase().includes(search) ||
            event.eventType?.toLowerCase().includes(search) ||
            event.status?.toLowerCase().includes(search) ||
            event.reviewedBy?.toLowerCase().includes(search)
        );
    });

    const exportToPDF = () => {
        const doc = new jsPDF();
        
        doc.text("Historial de Eventos de Caídas", 14, 15);
        doc.setFontSize(10);
        doc.text(`Generado el: ${new Date().toLocaleString()}`, 14, 22);

        const tableColumn = ["Fecha", "Dispositivo", "Tipo", "Estado", "Revisado Por", "Comentario"];
        const tableRows = filteredEvents.map(event => [
            event.occurredAt ? new Date(event.occurredAt).toLocaleString() : '-',
            event.deviceId,
            event.eventType,
            event.status,
            event.reviewedBy || 'Pendiente',
            event.reviewComment || '-'
        ]);

        autoTable(doc, {
            startY: 28,
            head: [tableColumn],
            body: tableRows,
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229] }, // Indigo-600
        });

        doc.save(`eventos-caidas-${new Date().toISOString().split('T')[0]}.pdf`);
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
                    <button 
                        onClick={exportToPDF}
                        title="Descargar reporte en PDF"
                        className="glass-panel px-6 py-3 rounded-full font-semibold text-white hover:scale-105 hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-500/30 transition-all duration-300 flex items-center gap-2 group"
                    >
                        <Activity size={18} className="group-hover:animate-bounce" /> Exportar a PDF
                    </button>
                </div>
            </header>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : error ? (
                <div className="glass-panel p-8 text-center">
                    <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <p className="text-xl text-red-400 mb-4">{error}</p>
                    <button 
                        onClick={loadEvents}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-all"
                    >
                        Reintentar
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Barra de Búsqueda Minimalista */}
                    <div className="relative mb-8">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                        <input 
                            type="text" 
                            placeholder="Filtrar por dispositivo, tipo, estado o revisor..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
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
                                    {filteredEvents.map(event => (
                                        <tr 
                                            key={event.id} 
                                            className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                                            onClick={() => loadEventDetails(event.id)}
                                        >
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
                                    {filteredEvents.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="py-20 text-center text-[#64748B]">
                                                <Activity size={48} className="mx-auto mb-4 opacity-20" />
                                                <p className="text-xl">
                                                    {searchTerm ? 'No se encontraron eventos con ese criterio.' : 'No hay eventos registrados en el sistema.'}
                                                </p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Detalles del Evento */}
            {selectedEvent && (
                <div 
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedEvent(null)}
                >
                    <div 
                        className="bg-[#1A1F26] rounded-2xl max-w-2xl w-full p-8 border border-white/10 relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button 
                            onClick={() => setSelectedEvent(null)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                        >
                            <X size={24} />
                        </button>

                        {modalLoading ? (
                            <div className="flex justify-center py-12">
                                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : (
                            <>
                                <h2 className="text-3xl font-bold text-white mb-6">Detalles del Evento</h2>
                                
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <p className="text-sm text-[#94A3B8] mb-2">ID del Evento</p>
                                            <p className="text-white font-mono text-sm bg-white/5 px-3 py-2 rounded-lg">{selectedEvent.id}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-[#94A3B8] mb-2">Dispositivo</p>
                                            <p className="text-white font-mono text-sm bg-white/5 px-3 py-2 rounded-lg">{selectedEvent.deviceId}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <p className="text-sm text-[#94A3B8] mb-2">Tipo de Evento</p>
                                            <p className="text-white font-semibold">{selectedEvent.eventType}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-[#94A3B8] mb-2">Estado</p>
                                            <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold border ${getStatusBadge(selectedEvent.status || '')}`}>
                                                {selectedEvent.status}
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-sm text-[#94A3B8] mb-2">Fecha de Ocurrencia</p>
                                        <p className="text-white font-semibold">
                                            {selectedEvent.occurredAt ? new Date(selectedEvent.occurredAt).toLocaleString('es-ES', {
                                                dateStyle: 'full',
                                                timeStyle: 'long'
                                            }) : 'No disponible'}
                                        </p>
                                    </div>

                                    {selectedEvent.reviewedBy && (
                                        <>
                                            <div className="border-t border-white/10 pt-6">
                                                <p className="text-sm text-[#94A3B8] mb-2">Revisado Por</p>
                                                <p className="text-white font-semibold">{selectedEvent.reviewedBy}</p>
                                            </div>

                                            {selectedEvent.reviewedAt && (
                                                <div>
                                                    <p className="text-sm text-[#94A3B8] mb-2">Fecha de Revisión</p>
                                                    <p className="text-white">
                                                        {new Date(selectedEvent.reviewedAt).toLocaleString()}
                                                    </p>
                                                </div>
                                            )}

                                            {selectedEvent.reviewComment && (
                                                <div>
                                                    <p className="text-sm text-[#94A3B8] mb-2">Comentario</p>
                                                    <p className="text-white bg-white/5 px-4 py-3 rounded-lg italic">
                                                        "{selectedEvent.reviewComment}"
                                                    </p>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                <button 
                                    onClick={() => setSelectedEvent(null)}
                                    className="mt-8 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold transition-all"
                                >
                                    Cerrar
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};