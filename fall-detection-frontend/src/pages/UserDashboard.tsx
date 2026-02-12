import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AdminService } from '../services/adminService';
import { Device, FallEvent } from '../types';
import { HardDrive, Clock, Shield, MessageSquare, X } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

export const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const [myDevices, setMyDevices] = useState<Device[]>([]);
  const [myEvents, setMyEvents] = useState<FallEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedEvent, setSelectedEvent] = useState<FallEvent | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'CONFIRMED_FALL' | 'FALSE_ALARM'>('CONFIRMED_FALL');
  const [reviewComment, setReviewComment] = useState('');
  const [savingReview, setSavingReview] = useState(false);

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

  useEffect(() => {
    const fetchData = async () => {
      await loadData();
    };

    fetchData();
  }, [user]);

  const myOpenEvents = useMemo(() => myEvents.filter((event) => event.status === 'OPEN'), [myEvents]);

  const openReviewModal = (event: FallEvent) => {
    setSelectedEvent(event);
    setReviewStatus(event.status === 'FALSE_ALARM' ? 'FALSE_ALARM' : 'CONFIRMED_FALL');
    setReviewComment(event.reviewComment || '');
  };

  const closeReviewModal = () => {
    setSelectedEvent(null);
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

  if (loading) {
    return <div className="min-h-screen bg-bg-primary flex items-center justify-center text-white">Cargando tu proteccion...</div>;
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 reveal">
      <div className="max-w-6xl mx-auto">
        <header className="mb-16">
          <h1 className="text-5xl font-bold tracking-tighter text-white mb-4">
            Hola, <span className="text-indigo-400">{user?.fullName.split(' ')[0]}</span>.
          </h1>
          <p className="text-xl text-text-secondary font-medium">
            Tu sistema de proteccion esta activo y vigilando.
          </p>
        </header>

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
                    <h3 className="text-2xl font-bold text-white mb-1">{device.alias || 'Dispositivo'}</h3>
                    <p className="text-sm text-text-secondary font-mono uppercase tracking-widest">ID: {device.deviceId || device.id}</p>
                  </Card>
                ))
              ) : (
                <Card className="col-span-2 text-center py-12 border-dashed border-white/10 bg-transparent">
                  <p className="text-text-secondary">No tienes dispositivos vinculados todavia.</p>
                </Card>
              )}
            </div>
          </div>

          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Clock className="text-indigo-400" /> Actividad
            </h2>

            <Card className="bg-bg-secondary/30 border-white/5">
              <p className="text-xs text-text-secondary uppercase tracking-widest mb-3">Eventos pendientes</p>
              <p className="text-4xl font-black text-white">{myOpenEvents.length}</p>
              <p className="text-sm text-text-secondary mt-1">Click en un evento para revisar y confirmar/falsa alarma.</p>
            </Card>

            <Card noPadding className="bg-bg-secondary/30 border-white/5">
              <div className="divide-y divide-white/5">
                {myEvents.length > 0 ? (
                  myEvents.slice(0, 8).map((event) => (
                    <button
                      key={event.id}
                      onClick={() => openReviewModal(event)}
                      className="w-full text-left p-6 flex items-center justify-between group hover:bg-white/2 transition-colors"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`w-2 h-2 rounded-full ${event.status === 'OPEN' ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                        <div>
                          <p className="text-white font-bold text-sm">{event.eventType}</p>
                          <p className="text-text-secondary text-xs truncate">{new Date(event.occurredAt || '').toLocaleTimeString()}</p>
                          {event.reviewComment && (
                            <p className="text-[#94A3B8] text-xs italic truncate max-w-[220px]">"{event.reviewComment}"</p>
                          )}
                        </div>
                      </div>
                      <Badge variant={statusVariant(event.status)}>{statusLabel(event.status)}</Badge>
                    </button>
                  ))
                ) : (
                  <div className="p-10 text-center text-text-secondary">Sin eventos recientes.</div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeReviewModal} />

          <div className="glass-panel w-full max-w-xl relative z-10 overflow-hidden bg-[var(--color-bg-secondary)]/90 p-8 border border-white/10">
            <button
              onClick={closeReviewModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              aria-label="Cerrar"
            >
              <X size={24} />
            </button>

            <h3 className="text-2xl font-bold text-white mb-3">Revisar evento</h3>
            <p className="text-sm text-[#94A3B8] mb-2">Dispositivo: {selectedEvent.deviceAlias || selectedEvent.deviceId}</p>
            <p className="text-sm text-[#94A3B8] mb-6">
              Ocurrido: {selectedEvent.occurredAt ? new Date(selectedEvent.occurredAt).toLocaleString() : 'N/A'}
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-[#94A3B8] mb-2 block">Resultado</label>
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
                <label className="text-sm text-[#94A3B8] mb-2 block flex items-center gap-2">
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
                <p className="text-xs text-[#64748B] mt-1">{reviewComment.length}/255</p>
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
          </div>
        </div>
      )}
    </div>
  );
};
