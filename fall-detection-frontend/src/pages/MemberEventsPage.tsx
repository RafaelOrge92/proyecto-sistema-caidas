import React, { useEffect, useMemo, useState } from 'react';
import { AdminService } from '../services/adminService';
import { EventSample, FallEvent, PaginationMeta } from '../types';
import { Calendar, HardDrive, UserCheck, Activity, Search, AlertTriangle, X } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export const MemberEventsPage: React.FC = () => {
  const [events, setEvents] = useState<FallEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'CONFIRMED_FALL' | 'FALSE_ALARM' | 'RESOLVED'>('ALL');
  const [patientFilter, setPatientFilter] = useState('ALL');
  const [selectedEvent, setSelectedEvent] = useState<FallEvent | null>(null);
  const [selectedEventSamples, setSelectedEventSamples] = useState<EventSample[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [samplesLoading, setSamplesLoading] = useState(false);
  const [samplesError, setSamplesError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  useEffect(() => {
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
        console.error('Error cargando eventos de miembro', loadError);
        setError('No se pudieron cargar los eventos.');
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [page, pageSize]);

  const patientOptions = useMemo(
    () => Array.from(new Set(events.map((event) => event.patientName || 'Sin paciente'))).sort((a, b) => a.localeCompare(b)),
    [events]
  );

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const text = searchTerm.trim().toLowerCase();
      const patient = (event.patientName || 'Sin paciente');
      const statusOk = statusFilter === 'ALL' || event.status === statusFilter;
      const patientOk = patientFilter === 'ALL' || patient === patientFilter;
      const textOk =
        !text ||
        (event.deviceAlias || event.deviceId || '').toLowerCase().includes(text) ||
        patient.toLowerCase().includes(text) ||
        (event.eventType || '').toLowerCase().includes(text) ||
        (event.status || '').toLowerCase().includes(text);

      return statusOk && patientOk && textOk;
    });
  }, [events, patientFilter, searchTerm, statusFilter]);

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

  const openEventDetails = async (event: FallEvent) => {
    setSelectedEvent(event);
    setSelectedEventSamples([]);
    setSamplesError(null);
    setModalLoading(true);
    setSamplesLoading(true);

    try {
      const [detailRes, samplesRes] = await Promise.all([
        AdminService.getEventById(event.id),
        AdminService.getEventSamples(event.id)
      ]);
      setSelectedEvent(detailRes.data);
      setSelectedEventSamples(samplesRes.data);
    } catch (loadError) {
      console.error('Error cargando detalle o muestras del evento', loadError);
      setSamplesError('No se pudieron cargar las muestras del evento.');
      try {
        const detailRes = await AdminService.getEventById(event.id);
        setSelectedEvent(detailRes.data);
      } catch {
        // no-op, dejamos el evento base ya seleccionado
      }
    } finally {
      setSamplesLoading(false);
      setModalLoading(false);
    }
  };

  const closeEventDetails = () => {
    setSelectedEvent(null);
    setSelectedEventSamples([]);
    setSamplesError(null);
    setSamplesLoading(false);
    setModalLoading(false);
  };

  const sampleChartData = useMemo(
    () => ({
      labels: selectedEventSamples.map((sample) => `${sample.tMs} ms`),
      datasets: [
        {
          label: 'Acc X',
          data: selectedEventSamples.map((sample) => sample.accX),
          borderColor: '#38bdf8',
          backgroundColor: 'rgba(56, 189, 248, 0.2)',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.25
        },
        {
          label: 'Acc Y',
          data: selectedEventSamples.map((sample) => sample.accY),
          borderColor: '#f97316',
          backgroundColor: 'rgba(249, 115, 22, 0.2)',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.25
        },
        {
          label: 'Acc Z',
          data: selectedEventSamples.map((sample) => sample.accZ),
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.2)',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.25
        }
      ]
    }),
    [selectedEventSamples]
  );

  const sampleChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: '#e2e8f0'
          }
        },
        tooltip: {
          mode: 'index' as const,
          intersect: false
        }
      },
      interaction: {
        mode: 'index' as const,
        intersect: false
      },
      scales: {
        x: {
          ticks: {
            color: '#94a3b8',
            maxTicksLimit: 6
          },
          grid: {
            color: 'rgba(148, 163, 184, 0.15)'
          },
          title: {
            display: true,
            text: 'Tiempo (ms)',
            color: '#cbd5e1'
          }
        },
        y: {
          ticks: {
            color: '#94a3b8'
          },
          grid: {
            color: 'rgba(148, 163, 184, 0.15)'
          },
          title: {
            display: true,
            text: 'Aceleracion',
            color: '#cbd5e1'
          }
        }
      }
    }),
    []
  );

  return (
    <div className="p-8 max-w-7xl mx-auto reveal">
      <header className="mb-10">
        <h1 className="text-5xl font-bold tracking-tight mb-2 text-white">Eventos</h1>
        <p className="text-xl text-[#94A3B8]">Eventos de tus pacientes asignados.</p>
      </header>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="glass-panel p-8 text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-xl text-red-400">{error}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            <div className="relative md:col-span-2">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
              <input
                type="text"
                placeholder="Buscar por paciente, dispositivo, tipo o estado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#1A1F26] border-none rounded-2xl py-4 pl-12 pr-6 focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-lg text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'OPEN' | 'CONFIRMED_FALL' | 'FALSE_ALARM' | 'RESOLVED')}
                className="bg-[#1A1F26] border border-white/10 rounded-xl px-3 py-3 text-white outline-none"
              >
                <option value="ALL">Todos</option>
                <option value="OPEN">OPEN</option>
                <option value="CONFIRMED_FALL">CONFIRMED</option>
                <option value="FALSE_ALARM">FALSE</option>
                <option value="RESOLVED">RESOLVED</option>
              </select>

              <select
                value={patientFilter}
                onChange={(e) => setPatientFilter(e.target.value)}
                className="bg-[#1A1F26] border border-white/10 rounded-xl px-3 py-3 text-white outline-none"
              >
                <option value="ALL">Pacientes</option>
                {patientOptions.map((patientName) => (
                  <option key={patientName} value={patientName}>
                    {patientName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="glass-panel overflow-hidden border border-white/5">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/5">
                    <th className="px-8 py-5 text-sm font-bold text-[#94A3B8] uppercase tracking-widest">Fecha y hora</th>
                    <th className="px-8 py-5 text-sm font-bold text-[#94A3B8] uppercase tracking-widest">Paciente</th>
                    <th className="px-8 py-5 text-sm font-bold text-[#94A3B8] uppercase tracking-widest">Dispositivo</th>
                    <th className="px-8 py-5 text-sm font-bold text-[#94A3B8] uppercase tracking-widest">Tipo</th>
                    <th className="px-8 py-5 text-sm font-bold text-[#94A3B8] uppercase tracking-widest">Estado</th>
                    <th className="px-8 py-5 text-sm font-bold text-[#94A3B8] uppercase tracking-widest">Revision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredEvents.map((event) => (
                    <tr
                      key={event.id}
                      className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                      onClick={() => openEventDetails(event)}
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <Calendar size={18} className="text-indigo-400 opacity-70" />
                          <span className="text-white font-medium">
                            {event.occurredAt ? new Date(event.occurredAt).toLocaleString() : '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-white font-semibold">{event.patientName || 'Sin paciente'}</td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <HardDrive size={18} className="text-cyan-400 opacity-70" />
                          <p className="text-cyan-100 font-medium">{event.deviceAlias || event.deviceId}</p>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-white">{event.eventType || '-'}</td>
                      <td className="px-8 py-6">
                        <span className={`px-4 py-1.5 rounded-full text-xs font-bold border ${getStatusBadge(event.status || '')}`}>
                          {event.status || '-'}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        {event.reviewedBy ? (
                          <div className="flex items-center gap-3">
                            <UserCheck size={18} className="text-emerald-400" />
                            <div>
                              <p className="text-white font-bold text-sm">{event.reviewedBy}</p>
                              {event.reviewComment && (
                                <p className="text-xs text-[#94A3B8] italic truncate max-w-[180px]">"{event.reviewComment}"</p>
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
                      <td colSpan={6} className="py-20 text-center text-[#64748B]">
                        <Activity size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="text-xl">No hay eventos para los filtros seleccionados.</p>
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
        </div>
      )}

      {selectedEvent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeEventDetails}>
          <div className="bg-[#1A1F26] rounded-2xl max-w-4xl w-full p-8 border border-white/10 relative max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button onClick={closeEventDetails} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
              <X size={24} />
            </button>

            {modalLoading ? (
              <div className="py-20 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
              </div>
            ) : (
              <>
                <h3 className="text-2xl font-bold text-white mb-5">Detalle del evento</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-xs text-[#94A3B8] uppercase tracking-wider mb-1">Paciente</p>
                    <p className="text-white font-semibold">{selectedEvent.patientName || 'Sin paciente'}</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-xs text-[#94A3B8] uppercase tracking-wider mb-1">Dispositivo</p>
                    <p className="text-white font-semibold">{selectedEvent.deviceAlias || selectedEvent.deviceId}</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-xs text-[#94A3B8] uppercase tracking-wider mb-1">Tipo</p>
                    <p className="text-white font-semibold">{selectedEvent.eventType || '-'}</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-xs text-[#94A3B8] uppercase tracking-wider mb-1">Estado</p>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadge(selectedEvent.status || '')}`}>
                      {selectedEvent.status || '-'}
                    </span>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:col-span-2">
                    <p className="text-xs text-[#94A3B8] uppercase tracking-wider mb-1">Ocurrido</p>
                    <p className="text-white font-semibold">
                      {selectedEvent.occurredAt ? new Date(selectedEvent.occurredAt).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:col-span-2">
                    <p className="text-xs text-[#94A3B8] uppercase tracking-wider mb-1">Comentario de revision</p>
                    <p className="text-white">{selectedEvent.reviewComment || 'Sin comentario'}</p>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <h4 className="text-lg font-bold text-white mb-2">Muestras de aceleracion</h4>
                  {samplesLoading ? (
                    <p className="text-sm text-[#94A3B8]">Cargando muestras...</p>
                  ) : samplesError ? (
                    <p className="text-sm text-red-400">{samplesError}</p>
                  ) : selectedEventSamples.length > 0 ? (
                    <div className="h-72">
                      <Line data={sampleChartData} options={sampleChartOptions} />
                    </div>
                  ) : (
                    <p className="text-sm text-[#94A3B8]">Este evento no tiene muestras de aceleracion guardadas.</p>
                  )}
                </div>

                <button
                  onClick={closeEventDetails}
                  className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold transition-all"
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
