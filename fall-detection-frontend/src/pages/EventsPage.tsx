import React, { useEffect, useState } from 'react';
import { AdminService } from '../services/adminService';
import { FallEvent, PaginationMeta } from '../types';
import { Calendar, HardDrive, UserCheck, Activity, Search, AlertTriangle, X, Grid3x3, List } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '../context/AuthContext';

export const EventsPage: React.FC = () => {
    const { user } = useAuth();
    const [events, setEvents] = useState<FallEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<FallEvent | null>(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [reviewStatus, setReviewStatus] = useState<'CONFIRMED_FALL' | 'FALSE_ALARM'>('CONFIRMED_FALL');
    const [reviewComment, setReviewComment] = useState('');
    const [savingReview, setSavingReview] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
    const [pagination, setPagination] = useState<PaginationMeta>({
        page: 1,
        pageSize: 20,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false
    });

    useEffect(() => {
        loadEvents();
    }, [page, pageSize]);

    const closeModal = () => {
        setSelectedEvent(null);
        setModalLoading(false);
        setSavingReview(false);
    };

    const loadEvents = async () => {
        try {
            const response = await AdminService.getEvents({ page, pageSize });
            setEvents(response.data);
            setPagination(response.pagination);
            if (response.pagination.page !== page) {
                setPage(response.pagination.page);
            }
            setError(null);
        } catch (loadError) {
            console.error('Error cargando eventos', loadError);
            setError('No se pudieron cargar los eventos. Verifica tu conexion.');
        } finally {
            setLoading(false);
        }
    };

    const getReviewerLabel = (reviewedBy?: string | null) => {
        if (!reviewedBy) return null;
        if (user?.id && reviewedBy === user.id) return user.fullName;
        return reviewedBy;
    };

    const loadEventDetails = async (eventId: string) => {
        setModalLoading(true);
        try {
            const response = await AdminService.getEventById(eventId);
            const event = response.data;
            setSelectedEvent(event);
            setReviewStatus(event.status === 'FALSE_ALARM' ? 'FALSE_ALARM' : 'CONFIRMED_FALL');
            setReviewComment(event.reviewComment || '');
        } catch (loadError) {
            console.error('Error cargando detalles del evento', loadError);
            alert('No se pudieron cargar los detalles del evento');
            closeModal();
        } finally {
            setModalLoading(false);
        }
    };

    const handleSaveReview = async () => {
        if (!selectedEvent) return;

        setSavingReview(true);
        try {
            await AdminService.updateEvent(selectedEvent.id, {
                status: reviewStatus,
                reviewedBy: user?.id || localStorage.getItem('userId') || undefined,
                reviewedAt: new Date().toISOString(),
                reviewComment: reviewComment.trim() || null
            });

            await loadEvents();
            await loadEventDetails(selectedEvent.id);
        } catch (saveError) {
            console.error('Error guardando revision del evento', saveError);
            alert('No se pudo guardar la revision del evento');
        } finally {
            setSavingReview(false);
        }
    };

    const filteredEvents = events.filter((event) => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        const reviewer = getReviewerLabel(event.reviewedBy)?.toLowerCase() || '';
        const patient = event.patientName?.toLowerCase() || '';
        const device = (event.deviceAlias || event.deviceId || '').toLowerCase();
        return (
            device.includes(search) ||
            patient.includes(search) ||
            event.eventType?.toLowerCase().includes(search) ||
            event.status?.toLowerCase().includes(search) ||
            reviewer.includes(search)
        );
    });

    const exportToPDF = () => {
        const doc = new jsPDF();

        doc.text('Historial de Eventos de Caidas', 14, 15);
        doc.setFontSize(10);
        doc.text(`Generado el: ${new Date().toLocaleString()}`, 14, 22);

        const tableColumn = ['Fecha', 'Paciente', 'Dispositivo', 'Estado', 'Revisado Por', 'Comentario'];
        const tableRows = filteredEvents.map((event) => [
            event.occurredAt ? new Date(event.occurredAt).toLocaleString() : '-',
            event.patientName || 'Sin paciente',
            event.deviceAlias || event.deviceId,
            event.status,
            getReviewerLabel(event.reviewedBy) || 'Pendiente',
            event.reviewComment || '-'
        ]);

        autoTable(doc, {
            startY: 28,
            head: [tableColumn],
            body: tableRows,
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229] }
        });

        doc.save(`eventos-caidas-${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'OPEN':
                return 'bg-red-500/10 text-red-400 border-red-500/20';
            case 'CONFIRMED_FALL':
                return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
            case 'FALSE_ALARM':
                return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
            case 'RESOLVED':
                return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            default:
                return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto reveal">
            <header className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                <div>
                    <h1 className="text-5xl font-bold tracking-tight mb-2 text-white">Historial</h1>
                    <p className="text-xl text-[#94A3B8]">Registro detallado de todos los incidentes detectados.</p>
                </div>
                <div className="flex gap-3">
                    <div className="flex gap-2 glass-panel p-1 rounded-full">
                        <button
                            onClick={() => setViewMode('cards')}
                            title="Vista de tarjetas"
                            className={`p-3 rounded-full transition-all ${
                                viewMode === 'cards'
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            <Grid3x3 size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            title="Vista de tabla"
                            className={`p-3 rounded-full transition-all ${
                                viewMode === 'table'
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            <List size={18} />
                        </button>
                    </div>
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
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
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
                    <div className="relative mb-8">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                        <input
                            type="text"
                            placeholder="Filtrar por paciente, dispositivo, estado o revisor..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#1A1F26] border-none rounded-2xl py-4 pl-12 pr-6 focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-lg text-white"
                        />
                    </div>

                    {viewMode === 'cards' ? (
                        <>
                            {filteredEvents.length === 0 ? (
                                <div className="glass-panel p-12 text-center">
                                    <Activity size={48} className="mx-auto mb-4 opacity-20" />
                                    <p className="text-xl text-[#64748B]">
                                        {searchTerm ? 'No se encontraron eventos con ese criterio.' : 'No hay eventos registrados en el sistema.'}
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredEvents.map((event) => (
                                        <div
                                            key={event.id}
                                            onClick={() => loadEventDetails(event.id)}
                                            className="glass-panel p-6 cursor-pointer hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/20 transition-all duration-300 group"
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex-1">
                                                    <p className="text-sm text-[#94A3B8] mb-1">
                                                        {event.occurredAt ? new Date(event.occurredAt).toLocaleDateString('es-ES', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric'
                                                        }) : '-'}
                                                    </p>
                                                    <p className="text-xs text-[#64748B]">
                                                        {event.occurredAt ? new Date(event.occurredAt).toLocaleTimeString('es-ES', {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        }) : '-'}
                                                    </p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadge(event.status || '')}`}>
                                                    {event.status}
                                                </span>
                                            </div>

                                            <div className="space-y-3 mb-4">
                                                <div>
                                                    <p className="text-xs text-[#64748B] mb-1">Paciente</p>
                                                    <p className="text-white font-semibold text-sm truncate">
                                                        {event.patientName || 'Sin paciente'}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-xs text-[#64748B] mb-1">Dispositivo</p>
                                                    <div className="flex items-center gap-2">
                                                        <HardDrive size={14} className="text-cyan-400" />
                                                        <p className="text-white font-semibold text-sm truncate">
                                                            {event.deviceAlias || event.deviceId}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div>
                                                    <p className="text-xs text-[#64748B] mb-1">Tipo de Evento</p>
                                                    <p className="text-white font-semibold text-sm">{event.eventType}</p>
                                                </div>
                                            </div>

                                            {event.reviewedBy && (
                                                <div className="border-t border-white/10 pt-3 mt-3">
                                                    <div className="flex items-center gap-2">
                                                        <UserCheck size={14} className="text-emerald-400" />
                                                        <p className="text-xs text-emerald-300 font-semibold">
                                                            Revisado por {getReviewerLabel(event.reviewedBy)}
                                                        </p>
                                                    </div>
                                                    {event.reviewComment && (
                                                        <p className="text-xs text-[#94A3B8] italic mt-2 truncate">
                                                            "{event.reviewComment}"
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            <div className="mt-4 pt-4 border-t border-white/10">
                                                <p className="text-xs text-[#64748B] group-hover:text-indigo-400 transition-colors">
                                                    Haz clic para ver detalles →
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="mt-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <p className="text-sm text-[#94A3B8]">
                                    Mostrando {events.length} de {pagination.total} eventos
                                </p>

                                <div className="flex items-center gap-3">
                                    <select
                                        value={pageSize}
                                        onChange={(e) => {
                                            setPageSize(Number(e.target.value));
                                            setPage(1);
                                        }}
                                        className="bg-[#1A1F26] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none"
                                    >
                                        <option value={10}>10 / pag</option>
                                        <option value={20}>20 / pag</option>
                                        <option value={50}>50 / pag</option>
                                    </select>

                                    <button
                                        onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                                        disabled={!pagination.hasPrevPage || loading}
                                        className="px-3 py-2 text-sm rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-white"
                                    >
                                        Anterior
                                    </button>

                                    <span className="text-sm text-[#CBD5E1] min-w-[120px] text-center">
                                        Pag {pagination.page} / {Math.max(pagination.totalPages, 1)}
                                    </span>

                                    <button
                                        onClick={() => setPage((prev) => prev + 1)}
                                        disabled={!pagination.hasNextPage || loading}
                                        className="px-3 py-2 text-sm rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-white"
                                    >
                                        Siguiente
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="glass-panel overflow-hidden border border-white/5">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-white/5 bg-white/5">
                                            <th className="px-8 py-5 text-sm font-bold text-[#94A3B8] uppercase tracking-widest">Fecha y Hora</th>
                                            <th className="px-8 py-5 text-sm font-bold text-[#94A3B8] uppercase tracking-widest">Paciente</th>
                                            <th className="px-8 py-5 text-sm font-bold text-[#94A3B8] uppercase tracking-widest">Dispositivo</th>
                                            <th className="px-8 py-5 text-sm font-bold text-[#94A3B8] uppercase tracking-widest">Estado</th>
                                            <th className="px-8 py-5 text-sm font-bold text-[#94A3B8] uppercase tracking-widest">Revision</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredEvents.map((event) => (
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
                                                    <p className="text-white font-semibold">{event.patientName || 'Sin paciente'}</p>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <HardDrive size={18} className="text-cyan-400 opacity-70" />
                                                        <p className="text-cyan-100 font-medium">{event.deviceAlias || event.deviceId}</p>
                                                    </div>
                                                    {event.deviceAlias && (
                                                        <p className="text-xs text-[#64748B] mt-1">{event.deviceId}</p>
                                                    )}
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
                                                                <p className="text-white font-bold text-sm">{getReviewerLabel(event.reviewedBy)}</p>
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

                            <div className="border-t border-white/5 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <p className="text-sm text-[#94A3B8]">
                                    Mostrando {events.length} de {pagination.total} eventos
                                </p>

                                <div className="flex items-center gap-3">
                                    <select
                                        value={pageSize}
                                        onChange={(e) => {
                                            setPageSize(Number(e.target.value));
                                            setPage(1);
                                        }}
                                        className="bg-[#1A1F26] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none"
                                    >
                                        <option value={10}>10 / pag</option>
                                        <option value={20}>20 / pag</option>
                                        <option value={50}>50 / pag</option>
                                    </select>

                                    <button
                                        onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                                        disabled={!pagination.hasPrevPage || loading}
                                        className="px-3 py-2 text-sm rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-white"
                                    >
                                        Anterior
                                    </button>

                                    <span className="text-sm text-[#CBD5E1] min-w-[120px] text-center">
                                        Pag {pagination.page} / {Math.max(pagination.totalPages, 1)}
                                    </span>

                                    <button
                                        onClick={() => setPage((prev) => prev + 1)}
                                        disabled={!pagination.hasNextPage || loading}
                                        className="px-3 py-2 text-sm rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-white"
                                    >
                                        Siguiente
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {selectedEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Overlay con desenfoque suave */}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
                    
                    {/* Contenedor del Modal */}
                    <div
                        className="glass-panel w-full max-w-2xl relative z-10 overflow-hidden reveal bg-[var(--color-bg-secondary)]/90 max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {modalLoading ? (
                            <div className="flex justify-center py-12">
                                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : (
                            <div className="p-8">
                                <div className="flex justify-between items-center mb-8">
                                    <h2 className="text-3xl font-bold tracking-tight text-white">
                                        Detalles del <span className="text-[var(--color-text-secondary)]">Evento</span>
                                    </h2>
                                    <button
                                        onClick={closeModal}
                                        className="p-2 hover:bg-white/5 rounded-full text-gray-400 transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <p className="text-sm text-[#94A3B8] mb-2">Paciente</p>
                                            <p className="text-white font-semibold bg-white/5 px-3 py-2 rounded-lg">
                                                {selectedEvent.patientName || 'Sin paciente asignado'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-[#94A3B8] mb-2">Dispositivo</p>
                                            <p className="text-white font-semibold bg-white/5 px-3 py-2 rounded-lg">
                                                {selectedEvent.deviceAlias || selectedEvent.deviceId}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <p className="text-sm text-[#94A3B8] mb-2">Tipo de Evento</p>
                                            <p className="text-white font-semibold">{selectedEvent.eventType}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-[#94A3B8] mb-2">Estado actual</p>
                                            <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold border ${getStatusBadge(selectedEvent.status || '')}`}>
                                                {selectedEvent.status}
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-sm text-[#94A3B8] mb-2">Fecha de Ocurrencia</p>
                                        <p className="text-white font-semibold">
                                            {selectedEvent.occurredAt
                                                ? new Date(selectedEvent.occurredAt).toLocaleString('es-ES', {
                                                      dateStyle: 'full',
                                                      timeStyle: 'long'
                                                  })
                                                : 'No disponible'}
                                        </p>
                                    </div>

                                    <div className="border-t border-white/10 pt-6 space-y-4">
                                        <h3 className="text-xl font-bold text-white">Registrar revision</h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm text-[#94A3B8] mb-2 block">Resultado</label>
                                                <select
                                                    value={reviewStatus}
                                                    onChange={(e) => setReviewStatus(e.target.value as 'CONFIRMED_FALL' | 'FALSE_ALARM')}
                                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:ring-2 focus:ring-indigo-500"
                                                >
                                                    <option value="CONFIRMED_FALL">Confirmada</option>
                                                    <option value="FALSE_ALARM">Falsa alarma</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="text-sm text-[#94A3B8] mb-2 block">Revisado por</label>
                                                <input
                                                    value={user?.fullName || user?.email || 'Administrador'}
                                                    readOnly
                                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[#CBD5E1]"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-sm text-[#94A3B8] mb-2 block">Comentario</label>
                                            <textarea
                                                value={reviewComment}
                                                onChange={(e) => setReviewComment(e.target.value)}
                                                maxLength={255}
                                                rows={4}
                                                placeholder="Anade detalles de la revision..."
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                            />
                                            <p className="text-xs text-[#64748B] mt-1">{reviewComment.length}/255</p>
                                        </div>

                                        <button
                                            onClick={handleSaveReview}
                                            disabled={savingReview}
                                            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-all"
                                        >
                                            {savingReview ? 'Guardando revision...' : 'Guardar revision'}
                                        </button>
                                    </div>

                                    {selectedEvent.reviewedBy && (
                                        <div className="border-t border-white/10 pt-6 space-y-4">
                                            <div>
                                                <p className="text-sm text-[#94A3B8] mb-2">Ultima revision por</p>
                                                <p className="text-white font-semibold">{getReviewerLabel(selectedEvent.reviewedBy)}</p>
                                            </div>

                                            {selectedEvent.reviewedAt && (
                                                <div>
                                                    <p className="text-sm text-[#94A3B8] mb-2">Fecha de revision</p>
                                                    <p className="text-white">{new Date(selectedEvent.reviewedAt).toLocaleString()}</p>
                                                </div>
                                            )}

                                            {selectedEvent.reviewComment && (
                                                <div>
                                                    <p className="text-sm text-[#94A3B8] mb-2">Comentario guardado</p>
                                                    <p className="text-white bg-white/5 px-4 py-3 rounded-lg italic">"{selectedEvent.reviewComment}"</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={closeModal}
                                    className="mt-8 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold transition-all"
                                >
                                    Cerrar
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
