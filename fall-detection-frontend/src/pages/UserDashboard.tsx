import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AdminService } from '../services/adminService';
import { Device, EventSample, FallEvent, Patient } from '../types';
import { HardDrive, Clock, Shield, MessageSquare, X, Download, Plus, Users } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const [myDevices, setMyDevices] = useState<Device[]>([]);
  const [myEvents, setMyEvents] = useState<FallEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedEvent, setSelectedEvent] = useState<FallEvent | null>(null);
  const [selectedEventSamples, setSelectedEventSamples] = useState<EventSample[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [samplesLoading, setSamplesLoading] = useState(false);
  const [samplesError, setSamplesError] = useState<string | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'CONFIRMED_FALL' | 'FALSE_ALARM'>('CONFIRMED_FALL');
  const [reviewComment, setReviewComment] = useState('');
  const [savingReview, setSavingReview] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'CONFIRMED_FALL' | 'FALSE_ALARM' | 'RESOLVED'>('ALL');
  const [patientFilter, setPatientFilter] = useState('ALL');
  const [availableDevices, setAvailableDevices] = useState<Device[]>([]);
  const [availablePatients, setAvailablePatients] = useState<Patient[]>([]);
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [assigningDeviceId, setAssigningDeviceId] = useState<string | null>(null);
  const [assigningPatientId, setAssigningPatientId] = useState<string | null>(null);
  const [assignError, setAssignError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      if (!user?.id) {
        return;
      }

      const devRes = await AdminService.getDevicesByUser(user.id);
      setMyDevices(devRes.data);

      const deviceIds = devRes.data.map((d) => d.id);
      if (deviceIds.length > 0) {
        const eventPromises = deviceIds.map((id) => AdminService.getEventsByDevice(id));
        const eventResults = await Promise.all(eventPromises);
        const allEvents = eventResults.flatMap((res) => res.data);
        allEvents.sort((a, b) => {
          const left = new Date(a.occurredAt || a.createdAt || 0).getTime();
          const right = new Date(b.occurredAt || b.createdAt || 0).getTime();
          return right - left;
        });
        setMyEvents(allEvents);
      } else {
        setMyEvents([]);
      }
    } catch (error) {
      console.error('Error al cargar datos del usuario', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableDevices = async () => {
    try {
      const response = await AdminService.getAvailableDevices();
      setAvailableDevices(response.data);
    } catch (error) {
      console.error('Error cargando dispositivos disponibles', error);
      setAvailableDevices([]);
    }
  };

  const loadAvailablePatients = async () => {
    try {
      const response = await AdminService.getAvailablePatients();
      setAvailablePatients(response.data);
    } catch (error) {
      console.error('Error cargando pacientes disponibles', error);
      setAvailablePatients([]);
    }
  };

  const openDeviceModal = async () => {
    setAssignError(null);
    setIsDeviceModalOpen(true);
    await loadAvailableDevices();
  };

  const openPatientModal = async () => {
    setAssignError(null);
    setIsPatientModalOpen(true);
    await loadAvailablePatients();
  };

  const handleAssignDeviceToMe = async (deviceId: string) => {
    setAssignError(null);
    setAssigningDeviceId(deviceId);

    try {
      await AdminService.assignDeviceToMe(deviceId);
      await loadData();
      await loadAvailableDevices();
    } catch (error: any) {
      const message = error?.response?.data?.error || 'No se pudo asignar el dispositivo.';
      setAssignError(message);
    } finally {
      setAssigningDeviceId(null);
    }
  };

  const handleAssignPatientToMe = async (patientId: string) => {
    setAssignError(null);
    setAssigningPatientId(patientId);

    try {
      await AdminService.assignPatientToMe(patientId);
      await loadData();
      await loadAvailablePatients();
    } catch (error: any) {
      const message = error?.response?.data?.error || 'No se pudo asignar el paciente.';
      setAssignError(message);
    } finally {
      setAssigningPatientId(null);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await loadData();
    };

    fetchData();
  }, [user]);

  const myOpenEvents = useMemo(() => myEvents.filter((event) => event.status === 'OPEN'), [myEvents]);
  const patientFilterOptions = useMemo(
    () => Array.from(new Set(myEvents.map((event) => event.patientName || 'Sin paciente'))).sort((a, b) => a.localeCompare(b)),
    [myEvents]
  );
  const filteredEvents = useMemo(() => {
    return myEvents.filter((event) => {
      const statusOk = statusFilter === 'ALL' || event.status === statusFilter;
      const patientName = event.patientName || 'Sin paciente';
      const patientOk = patientFilter === 'ALL' || patientName === patientFilter;
      return statusOk && patientOk;
    });
  }, [myEvents, statusFilter, patientFilter]);

  const openReviewModal = async (event: FallEvent) => {
    setSelectedEvent(event);
    setReviewStatus(event.status === 'FALSE_ALARM' ? 'FALSE_ALARM' : 'CONFIRMED_FALL');
    setReviewComment(event.reviewComment || '');
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
      setReviewStatus(detailRes.data.status === 'FALSE_ALARM' ? 'FALSE_ALARM' : 'CONFIRMED_FALL');
      setReviewComment(detailRes.data.reviewComment || '');
      setSelectedEventSamples(detailRes.data.eventType === 'FALL' ? samplesRes.data : []);
    } catch (error) {
      console.error('Error cargando detalle del evento en my-protection:', error);
      setSamplesError('No se pudo cargar el detalle del evento.');
    } finally {
      setSamplesLoading(false);
      setModalLoading(false);
    }
  };

  const closeReviewModal = () => {
    setSelectedEvent(null);
    setSelectedEventSamples([]);
    setSamplesError(null);
    setSamplesLoading(false);
    setModalLoading(false);
    setReviewStatus('CONFIRMED_FALL');
    setReviewComment('');
    setSavingReview(false);
  };

  const handleSaveReview = async () => {
    if (!selectedEvent) return;

    setSavingReview(true);
    try {
      await AdminService.updateEvent(selectedEvent.id, {
        status: reviewStatus,
        reviewComment: reviewComment.trim() || null
      });
      await loadData();
      closeReviewModal();
    } catch (error) {
      console.error('Error revisando evento en my-protection:', error);
      alert('No se pudo guardar la revision del evento.');
    } finally {
      setSavingReview(false);
    }
  };

  const statusVariant = (status?: FallEvent['status']) => {
    switch (status) {
      case 'OPEN':
        return 'error' as const;
      case 'CONFIRMED_FALL':
        return 'warning' as const;
      case 'FALSE_ALARM':
      case 'RESOLVED':
        return 'success' as const;
      default:
        return 'default' as const;
    }
  };

  const statusLabel = (status?: FallEvent['status']) => {
    switch (status) {
      case 'OPEN':
        return 'Alerta';
      case 'CONFIRMED_FALL':
        return 'Confirmada';
      case 'FALSE_ALARM':
        return 'Falsa alarma';
      case 'RESOLVED':
        return 'Resuelto';
      default:
        return status || 'N/A';
    }
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

  const exportActivityToPDF = () => {
    const doc = new jsPDF();
    doc.text('Log de actividad del usuario', 14, 15);
    doc.setFontSize(10);
    doc.text(`Generado por: ${user?.fullName || user?.email || 'usuario'}`, 14, 22);
    doc.text(`Fecha: ${new Date().toLocaleString()}`, 14, 28);

    const tableColumn = ['Fecha', 'Paciente', 'Dispositivo', 'Tipo', 'Estado', 'Comentario'];
    const tableRows = filteredEvents.map((event) => [
      event.occurredAt ? new Date(event.occurredAt).toLocaleString() : '-',
      event.patientName || 'Sin paciente',
      event.deviceAlias || event.deviceId || '-',
      event.eventType || '-',
      statusLabel(event.status),
      event.reviewComment || '-'
    ]);

    autoTable(doc, {
      startY: 34,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] }
    });

    doc.save(`actividad-usuario-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) {
    return <div className="min-h-screen bg-bg-primary flex items-center justify-center" style={{ color: 'var(--color-text-primary)' }}>Cargando tu proteccion...</div>;
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 reveal">
      <div className="max-w-6xl mx-auto">
        <header className="mb-16">
          <h1 className="text-5xl font-bold tracking-tighter mb-4" style={{ color: 'var(--color-text-primary)' }}>
            Hola, <span className="text-indigo-400">{user?.fullName.split(' ')[0]}</span>.
          </h1>
          <p className="text-xl font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            Tu sistema de proteccion esta activo y vigilando.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          <button
            onClick={openDeviceModal}
            className="glass-panel px-6 py-4 rounded-2xl font-semibold hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/20 transition-all duration-300 flex items-center gap-3"
            style={{ color: 'var(--color-text-primary)' }}
          >
            <Plus size={18} className="text-indigo-300" />
            Agregar dispositivo
          </button>
          <button
            onClick={openPatientModal}
            className="glass-panel px-6 py-4 rounded-2xl font-semibold hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/20 transition-all duration-300 flex items-center gap-3"
            style={{ color: 'var(--color-text-primary)' }}
          >
            <Users size={18} className="text-indigo-300" />
            Agregar paciente
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <HardDrive className="text-indigo-400" /> Mis Dispositivos
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myDevices.length > 0 ? (
                myDevices.map((device) => (
                  <Card key={device.id} hover className="bg-bg-secondary/50 border-white/5">
                    <div className="flex justify-between items-start mb-10">
                      <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400">
                        <Shield size={28} />
                      </div>
                      <Badge variant="success">En linea</Badge>
                    </div>
                    <h3 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>{device.alias || 'Dispositivo'}</h3>
                    <p className="text-sm font-mono uppercase tracking-widest" style={{ color: 'var(--color-text-secondary)' }}>ID: {device.deviceId || device.id}</p>
                  </Card>
                ))
              ) : (
                <Card className="col-span-2 text-center py-12 border-dashed border-white/10 bg-transparent">
                  <p style={{ color: 'var(--color-text-secondary)' }}>No tienes dispositivos vinculados todavia.</p>
                </Card>
              )}
            </div>
          </div>

          <div className="space-y-8">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <Clock className="text-indigo-400" /> Actividad
              </h2>
              <button
                onClick={exportActivityToPDF}
                disabled={filteredEvents.length === 0}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold flex items-center gap-2 transition-colors"
                style={{ color: 'white' }}
              >
                <Download size={16} />
                Exportar PDF
              </button>
            </div>

            <Card className="bg-bg-secondary/30 border-white/5">
              <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-secondary)' }}>Eventos pendientes</p>
              <p className="text-4xl font-black" style={{ color: 'var(--color-text-primary)' }}>{myOpenEvents.length}</p>
              <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Click en un evento para revisar y confirmar/falsa alarma.</p>
            </Card>

            <Card className="bg-bg-secondary/30 border-white/5">
              <p className="text-xs uppercase tracking-widest mb-4" style={{ color: 'var(--color-text-secondary)' }}>Filtros de actividad</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'OPEN' | 'CONFIRMED_FALL' | 'FALSE_ALARM' | 'RESOLVED')}
                  className="w-full rounded-xl py-2.5 px-3 outline-none border"
                  style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', borderColor: 'var(--color-border)' }}
                >
                  <option value="ALL">Todos los estados</option>
                  <option value="OPEN">OPEN</option>
                  <option value="CONFIRMED_FALL">CONFIRMED_FALL</option>
                  <option value="FALSE_ALARM">FALSE_ALARM</option>
                  <option value="RESOLVED">RESOLVED</option>
                </select>

                <select
                  value={patientFilter}
                  onChange={(e) => setPatientFilter(e.target.value)}
                  className="w-full rounded-xl py-2.5 px-3 outline-none border"
                  style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', borderColor: 'var(--color-border)' }}
                >
                  <option value="ALL">Todos los pacientes</option>
                  {patientFilterOptions.map((patientName) => (
                    <option key={patientName} value={patientName}>
                      {patientName}
                    </option>
                  ))}
                </select>
              </div>
            </Card>

            <Card noPadding className="bg-bg-secondary/30 border-white/5">
              <div className="divide-y divide-white/5">
                {filteredEvents.length > 0 ? (
                  filteredEvents.slice(0, 8).map((event) => (
                    <button
                      key={event.id}
                      onClick={() => openReviewModal(event)}
                      className="w-full text-left p-6 flex items-center justify-between group hover:bg-white/2 transition-colors"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`w-2 h-2 rounded-full ${event.status === 'OPEN' ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                        <div>
                          <p className="font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>{event.eventType}</p>
                          <p className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>{new Date(event.occurredAt || '').toLocaleTimeString()}</p>
                          <p className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>Paciente: {event.patientName || 'Sin paciente'}</p>
                          {event.reviewComment && (
                            <p className="text-xs italic truncate max-w-[220px]" style={{ color: 'var(--color-text-secondary)' }}>"{event.reviewComment}"</p>
                          )}
                        </div>
                      </div>
                      <Badge variant={statusVariant(event.status)}>{statusLabel(event.status)}</Badge>
                    </button>
                  ))
                ) : myEvents.length > 0 ? (
                  <div className="p-10 text-center" style={{ color: 'var(--color-text-secondary)' }}>No hay eventos para el filtro seleccionado.</div>
                ) : (
                  <div className="p-10 text-center" style={{ color: 'var(--color-text-secondary)' }}>Sin eventos recientes.</div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {isDeviceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsDeviceModalOpen(false)} />
          <div className="glass-panel w-full max-w-2xl relative z-10 p-8 border border-white/10 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsDeviceModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              aria-label="Cerrar"
            >
              <X size={24} />
            </button>

            <div className="mb-6">
              <h3 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Agregar dispositivo</h3>
              <p className="text-[var(--color-text-secondary)]">Selecciona un dispositivo disponible para vincularlo a tu cuenta.</p>
            </div>

            {assignError && (
              <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {assignError}
              </div>
            )}

            <div className="space-y-3">
              {availableDevices.length > 0 ? (
                availableDevices.map((device) => (
                  <button
                    key={device.id}
                    onClick={() => handleAssignDeviceToMe(device.id)}
                    disabled={assigningDeviceId === device.id}
                    className="w-full text-left p-4 rounded-xl border transition-colors disabled:opacity-50"
                    style={{
                      borderColor: 'var(--color-border)',
                      backgroundColor: 'var(--color-bg-primary)',
                      color: 'var(--color-text-primary)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-primary)'}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{device.alias || 'Dispositivo'}</p>
                        <p className="text-xs font-mono" style={{ color: 'var(--color-text-secondary)' }}>ID: {device.id}</p>
                        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Paciente: {device.patientName || 'Sin paciente'}</p>
                      </div>
                      {assigningDeviceId === device.id && (
                        <div className="w-5 h-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-8 text-center" style={{ color: 'var(--color-text-secondary)' }}>No hay dispositivos disponibles.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {isPatientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsPatientModalOpen(false)} />
          <div className="glass-panel w-full max-w-2xl relative z-10 p-8 border border-white/10 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsPatientModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              aria-label="Cerrar"
            >
              <X size={24} />
            </button>

            <div className="mb-6">
              <h3 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Agregar paciente</h3>
              <p className="text-[var(--color-text-secondary)]">Selecciona un paciente disponible para vincularlo a tu cuenta.</p>
            </div>

            {assignError && (
              <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {assignError}
              </div>
            )}

            <div className="space-y-3">
              {availablePatients.length > 0 ? (
                availablePatients.map((patient) => (
                  <button
                    key={patient.patientId}
                    onClick={() => handleAssignPatientToMe(patient.patientId)}
                    disabled={assigningPatientId === patient.patientId}
                    className="w-full text-left p-4 rounded-xl border transition-colors disabled:opacity-50"
                    style={{
                      borderColor: 'var(--color-border)',
                      backgroundColor: 'var(--color-bg-primary)',
                      color: 'var(--color-text-primary)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-primary)'}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{patient.patientName}</p>
                        {patient.nif && <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>NIF: {patient.nif}</p>}
                        {patient.city && <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Ciudad: {patient.city}</p>}
                        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Dispositivos: {patient.deviceCount ?? 0}</p>
                      </div>
                      {assigningPatientId === patient.patientId && (
                        <div className="w-5 h-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-8 text-center" style={{ color: 'var(--color-text-secondary)' }}>No hay pacientes disponibles.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeReviewModal} />

          <div className="glass-panel w-full max-w-4xl relative z-10 p-8 border border-white/10 max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeReviewModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              aria-label="Cerrar"
            >
              <X size={24} />
            </button>

            {modalLoading ? (
              <div className="py-20 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
              </div>
            ) : (
              <>
                <h3 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-text-primary)' }}>Detalle y revision del evento</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)', borderWidth: '1px' }}>
                    <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-secondary)' }}>Paciente</p>
                    <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{selectedEvent.patientName || 'Sin paciente'}</p>
                  </div>
                  <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)', borderWidth: '1px' }}>
                    <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-secondary)' }}>Dispositivo</p>
                    <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{selectedEvent.deviceAlias || selectedEvent.deviceId}</p>
                  </div>
                  <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)', borderWidth: '1px' }}>
                    <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-secondary)' }}>Tipo</p>
                    <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{selectedEvent.eventType || '-'}</p>
                  </div>
                  <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)', borderWidth: '1px' }}>
                    <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-secondary)' }}>Estado</p>
                    <Badge variant={statusVariant(selectedEvent.status)}>{statusLabel(selectedEvent.status)}</Badge>
                  </div>
                  <div className="rounded-xl p-4 md:col-span-2" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)', borderWidth: '1px' }}>
                    <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-secondary)' }}>Ocurrido</p>
                    <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                      {selectedEvent.occurredAt ? new Date(selectedEvent.occurredAt).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                </div>

                {selectedEvent.eventType === 'FALL' && (
                  <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <h4 className="text-lg font-bold text-white mb-2">Muestras de aceleracion</h4>
                    {samplesLoading ? (
                      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Cargando muestras...</p>
                    ) : samplesError ? (
                      <p className="text-sm text-red-400">{samplesError}</p>
                    ) : selectedEventSamples.length > 0 ? (
                      <div className="h-72">
                        <Line data={sampleChartData} options={sampleChartOptions} />
                      </div>
                    ) : (
                      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Este evento no tiene muestras de aceleracion guardadas.</p>
                    )}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="text-sm mb-2 block" style={{ color: 'var(--color-text-secondary)' }}>Resultado</label>
                    <select
                      value={reviewStatus}
                      onChange={(e) => setReviewStatus(e.target.value as 'CONFIRMED_FALL' | 'FALSE_ALARM')}
                      className="w-full bg-[var(--color-bg-secondary)] rounded-xl py-3 px-3 outline-none text-white border border-white/10"
                    >
                      <option value="CONFIRMED_FALL">Confirmada</option>
                      <option value="FALSE_ALARM">Falsa alarma</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm mb-2 block flex items-center gap-2" style={{ color: 'var(--color-text-secondary)' }}>
                      <MessageSquare size={14} />
                      Comentario
                    </label>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      maxLength={255}
                      rows={4}
                      placeholder="Anade observaciones de la revision..."
                      className="w-full bg-[var(--color-bg-secondary)] rounded-xl py-3 px-3 outline-none text-white border border-white/10 resize-none"
                    />
                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>{reviewComment.length}/255</p>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={closeReviewModal}
                    className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveReview}
                    disabled={savingReview}
                    className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-colors"
                  >
                    {savingReview ? 'Guardando...' : 'Guardar revision'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
