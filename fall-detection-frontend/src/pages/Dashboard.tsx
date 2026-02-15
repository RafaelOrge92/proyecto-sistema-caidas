import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AdminService } from '../services/adminService';
import { FallEvent, Device } from '../types';
// IMPORTANTE: Asegúrate de que todos estos iconos estén en la lista de importación
import { Activity, AlertTriangle, CheckCircle, RefreshCw, Wifi, WifiOff, Clock } from 'lucide-react';
import Card from '../components/ui/Card';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<FallEvent[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [podium, setPodium] = useState<any[]>([]);
  const [isAlertActive, setIsAlertActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [eventsRes, devicesRes] = await Promise.all([
        AdminService.getEvents(),
        AdminService.getDevices()
      ]);

      setEvents(eventsRes.data);
      setDevices(devicesRes.data);
      setError(null);

      try {
        const podiumRes = await AdminService.getDevicePodium();
        setPodium(podiumRes.data);
      } catch (podiumError) {
        console.error('Error loading podium:', podiumError);
        setPodium([]);
      }
    } catch (err) {
      setError("⚠️ Sin conexión con el servidor de alertas.");
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const createSimulatedFallAlert = async () => {
    if (devices.length === 0) {
      alert('No hay dispositivos disponibles');
      return;
    }

    const randomDevice = devices[Math.floor(Math.random() * devices.length)];
    
    try {
      const newEvent = {
        deviceId: randomDevice.id,
        deviceAlias: (randomDevice as any).alias || randomDevice.id,
        patientName: (randomDevice as any).patientName || 'Paciente Desconocido',
        eventType: 'FALL',
        status: 'OPEN'
      };

      await AdminService.createEvent(newEvent);
      setIsAlertActive(true);
      
      try {
        const audio = new Audio('https://actions.google.com/sounds/v1/alarms/emergency_it_is_an_emergency.ogg');
        audio.play().catch(() => console.log("Interacción requerida para audio"));
      } catch (e) {
        console.log("No se pudo reproducir sonido");
      }

      await loadData();
    } catch (err) {
      alert('Error al crear simulación de caída');
      console.error('Error creating simulated alert:', err);
    }
  };

  const confirmFalseAlarm = async (eventId: string) => {
    try {
      await AdminService.updateEvent(eventId, {
        status: 'FALSE_ALARM',
        reviewedBy: user?.id || localStorage.getItem('userId') || undefined
      });
      setIsAlertActive(false);
      await loadData();
    } catch (err) {
      alert("Error al procesar la confirmación");
      console.error('Error updating event:', err);
    }
  };

  const confirmFall = async (eventId: string) => {
    try {
      await AdminService.updateEvent(eventId, {
        status: 'CONFIRMED_FALL',
        reviewedBy: user?.id || localStorage.getItem('userId') || undefined,
        reviewComment: 'Caída confirmada por admin'
      });
      await loadData();
    } catch (err) {
      alert("Error al confirmar la caída");
      console.error('Error updating event:', err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#6366F1] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-xl" style={{ color: 'var(--color-text-secondary)' }}>Cargando panel...</div>
        </div>
      </div>
    );
  }

  const activeEvents = events.filter(e => (e as any).status === 'OPEN');
  const shouldAlert = activeEvents.length > 0;
  
  // Estadísticas de eventos
  const totalEvents = events.length;
  const confirmedFalls = events.filter(e => e.status === 'CONFIRMED_FALL').length;
  const falseAlarms = events.filter(e => e.status === 'FALSE_ALARM').length;
  const activeDevices = devices.filter(d => (d as any).isActive).length;

  return (
    <div 
      className="min-h-screen p-8 transition-colors duration-1000"
      style={{ 
        backgroundColor: shouldAlert 
          ? 'var(--color-alert-bg)'
          : 'var(--color-bg-primary)'
      }}
    >
      <div className="max-w-7xl mx-auto">
        
        {/* Resumen Superior */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="glass-panel p-6">
            <p className="text-sm font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-secondary)' }}>Estado Global</p>
            <h2 className="text-3xl font-bold flex items-center gap-2">
              {shouldAlert ? <span className="text-red-500">Alerta Crítica</span> : <span className="text-green-500">Protegido</span>}
            </h2>
          </div>
          
          <div className="glass-panel p-6">
            <p className="text-sm font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-secondary)' }}>Dispositivos Activos</p>
            <h2 className="text-3xl font-bold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
              <Wifi size={28} className="text-[#6366F1]" />
              {activeDevices} / {devices.length}
            </h2>
          </div>
          
          <div className="glass-panel p-6">
            <p className="text-sm font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-secondary)' }}>Total Eventos</p>
            <h2 className="text-3xl font-bold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
              <Activity size={28} className="text-cyan-400" />
              {totalEvents}
            </h2>
          </div>
          
          <div className="glass-panel p-6">
            <p className="text-sm font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-secondary)' }}>Falsas Alarmas</p>
            <h2 className="text-3xl font-bold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
              <CheckCircle size={28} className="text-emerald-400" />
              {falseAlarms}
            </h2>
          </div>
        </div>

        {/* Widget Podium de Dispositivos */}
        {podium.length > 0 && (
          <div className="glass-panel p-8 mb-12">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-3" style={{ color: 'var(--color-text-primary)' }}>
              <Activity size={28} className="text-amber-400" />
              Dispositivos Más Activos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {podium.slice(0, 3).map((item, index) => (
                <div 
                  key={item.device_id} 
                  className="rounded-xl p-6 border transition-all duration-300 hover:scale-[1.02] hover:shadow-xl" 
                  style={{ 
                    backgroundColor: 'var(--color-bg-secondary)',
                    borderColor: 'var(--color-border)'
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`text-4xl font-bold ${
                      index === 0 ? 'text-amber-400' : 
                      index === 1 ? 'text-gray-400' : 
                      'text-amber-600'
                    }`}>
                      #{index + 1}
                    </div>
                    <div className="text-right">
                      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Eventos</p>
                      <p className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{item.count}</p>
                    </div>
                  </div>
                  <p className="font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                    Dispositivo {item.device_id}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sección de Alerta Animada si hay caída */}
          {shouldAlert && (
            <div className="lg:col-span-3 bg-red-600 rounded-[28px] p-8 flex flex-col md:flex-row justify-between items-center shadow-2xl animate-pulse">
              <div className="flex items-center gap-6">
                <div className="bg-white/20 p-4 rounded-2xl">
                  <AlertTriangle size={48} className="text-white" />
                </div>
                <div>
                  <h2 className="text-4xl font-black text-white">CAÍDA DETECTADA</h2>
                  <p className="text-red-100 text-lg">Paciente: {activeEvents[0].patientName}</p>
                </div>
              </div>
              <div className="flex gap-4 mt-6 md:mt-0">
                <button 
                  onClick={() => confirmFall(activeEvents[0].id)} 
                  className="bg-white text-red-600 px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform"
                >
                  Confirmar Emergencia
                </button>
                <button 
                  onClick={() => confirmFalseAlarm(activeEvents[0].id)} 
                  className="bg-red-800 text-white px-8 py-4 rounded-full font-bold text-lg border border-red-400/30"
                >
                  Falsa Alarma
                </button>
              </div>
            </div>
          )}

          {/* Dispositivos */}
          <section className="lg:col-span-2 space-y-6">
            <h3 className="text-2xl font-bold ml-2" style={{ color: 'var(--color-text-primary)' }}>Dispositivos Conectados</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {devices.map((device) => (
                <div 
                  key={device.id} 
                  className="glass-panel p-8 transition-all duration-300 group hover:scale-[1.02] hover:shadow-2xl"
                  style={{
                    '--hover-bg': 'var(--color-bg-elevated)'
                  } as React.CSSProperties}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '';
                  }}
                >
                  <div className="flex justify-between items-center mb-6">
                    <div className="p-3 bg-[#6366F1]/10 rounded-2xl text-[#6366F1] group-hover:scale-110 transition-transform">
                      <Wifi size={24} />
                    </div>
                    <span className="text-xs font-bold text-green-500 bg-green-500/10 px-3 py-1 rounded-full uppercase">Online</span>
                  </div>
                  <h4 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>{(device as any).alias || device.id}</h4>
                  <p style={{ color: 'var(--color-text-secondary)' }}>Paciente: {(device as any).patientName || 'No asignado'}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Historial Lateral */}
          <aside className="glass-panel p-8 h-fit">
            <h3 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-text-primary)' }}>Actividad Reciente</h3>
            <div className="space-y-6">
              {events.slice(0, 5).map((event) => (
                <div key={event.id} className="flex gap-4 items-start border-b pb-4" style={{ borderColor: 'var(--color-border)' }}>
                  <div className={`w-2 h-2 rounded-full mt-2 ${(event as any).status === 'OPEN' ? 'bg-red-500' : 'bg-gray-500'}`} />
                  <div>
                    <p className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{(event as any).deviceAlias || (event as any).deviceId}</p>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{new Date((event as any).occurredAt || Date.now()).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
