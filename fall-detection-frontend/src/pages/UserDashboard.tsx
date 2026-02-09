import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AdminService } from '../services/adminService';
import { Device, FallEvent } from '../types';
import { HardDrive, Clock, Shield } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

export const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const [myDevices, setMyDevices] = useState<Device[]>([]);
  const [myEvents, setMyEvents] = useState<FallEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [devRes, eventRes] = await Promise.all([
          AdminService.getDevices(),
          AdminService.getEvents()
        ]);

        // Filtramos solo los dispositivos asignados a este usuario
        const filteredDevices = devRes.data.filter(d => d.assignedUserId === user?.id);
        setMyDevices(filteredDevices);

        // Filtramos eventos solo de sus dispositivos
        const deviceIds = filteredDevices.map(d => d.id);
        const filteredEvents = eventRes.data.filter(e => deviceIds.includes(e.deviceId));
        setMyEvents(filteredEvents);

      } catch (error) {
        console.error("Error al cargar datos del usuario", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (loading) return <div className="min-h-screen bg-bg-primary flex items-center justify-center text-white">Cargando tu protección...</div>;

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 reveal">
      <div className="max-w-6xl mx-auto">
        {/* Header de Bienvenida */}
        <header className="mb-16">
          <h1 className="text-5xl font-bold tracking-tighter text-white mb-4">
            Hola, <span className="text-indigo-400">{user?.fullName.split(' ')[0]}</span>.
          </h1>
          <p className="text-xl text-text-secondary font-medium">
            Tu sistema de protección está activo y vigilando.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Columna Izquierda: Dispositivos */}
          <div className="lg:col-span-2 space-y-8">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <HardDrive className="text-indigo-400" /> Mis Dispositivos
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myDevices.length > 0 ? myDevices.map(device => (
                <Card key={device.id} hover className="bg-bg-secondary/50 border-white/5">
                  <div className="flex justify-between items-start mb-10">
                    <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400">
                      <Shield size={28} />
                    </div>
                    <Badge variant="success">En línea</Badge>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-1">{device.alias || 'Dispositivo'}</h3>
                  <p className="text-sm text-text-secondary font-mono uppercase tracking-widest">ID: {device.deviceId || device.id}</p>
                </Card>
              )) : (
                <Card className="col-span-2 text-center py-12 border-dashed border-white/10 bg-transparent">
                  <p className="text-text-secondary">No tienes dispositivos vinculados todavía.</p>
                </Card>
              )}
            </div>
          </div>

          {/* Columna Derecha: Historial Reciente */}
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Clock className="text-indigo-400" /> Actividad
            </h2>
            <Card noPadding className="bg-bg-secondary/30 border-white/5">
              <div className="divide-y divide-white/5">
                {myEvents.length > 0 ? myEvents.slice(0, 8).map(event => (
                  <div key={event.id} className="p-6 flex items-center justify-between group hover:bg-white/2 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-2 rounded-full ${event.status === 'OPEN' ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                      <div>
                        <p className="text-white font-bold text-sm">{event.eventType}</p>
                        <p className="text-text-secondary text-xs">
                          {new Date(event.occurredAt || '').toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant={event.status === 'OPEN' ? 'error' : 'success'}>
                      {event.status === 'OPEN' ? 'Alerta' : 'OK'}
                    </Badge>
                  </div>
                )) : (
                  <div className="p-10 text-center text-text-secondary">
                    Sin eventos recientes.
                  </div>
                )}
              </div>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
};
