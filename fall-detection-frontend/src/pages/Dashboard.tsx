import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AdminService } from '../services/adminService';
import { FallEvent, Device } from '../types';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<FallEvent[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
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
    } catch (err) {
      setError("⚠️ Sin conexión con el servidor de alertas.");
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const createSimulatedFallAlert = async () => {
    // Obtener un dispositivo aleatorio
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
      
      // Reproducir sonido de alerta
      try {
        const audio = new Audio('https://actions.google.com/sounds/v1/alarms/emergency_it_is_an_emergency.ogg');
        audio.play().catch(() => console.log("Interacción requerida para audio"));
      } catch (e) {
        console.log("No se pudo reproducir sonido");
      }

      // Recargar datos
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
        reviewedBy: user?.email || 'admin'
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
        reviewedBy: user?.email || 'admin',
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
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-xl text-gray-600">Cargando panel...</div>
      </div>
    );
  }

  // Detectar si hay alertas activas
  const activeEvents = events.filter(e => (e as any).status === 'OPEN');
  const shouldAlert = activeEvents.length > 0;

  return (
    <div
      className={`p-4 md:p-6 min-h-screen transition-all duration-700 ${
        shouldAlert ? 'bg-red-600' : 'bg-gray-100'
      }`}
    >
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className={`text-3xl font-bold ${shouldAlert ? 'text-white' : 'text-gray-800'}`}>
          Panel de Control - {user?.role}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {user?.role === 'ADMIN' && (
            <>
              <button
                onClick={createSimulatedFallAlert}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 transition shadow-lg"
              >
                🚨 Simular Caída
              </button>
              <button
                onClick={loadData}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition shadow-lg"
              >
                🔄 Actualizar
              </button>
            </>
          )}
          {error && (
            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-lg text-sm font-medium">
              {error}
            </span>
          )}
        </div>
      </div>

      {/* Alerta Crítica */}
      {shouldAlert && (
        <div className="bg-white p-6 rounded-lg shadow-2xl mb-8 border-l-8 border-yellow-400 animate-pulse">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-3xl font-black text-red-600 mb-2">🚨 CAÍDA DETECTADA</h3>
              <div className="space-y-1 text-gray-700">
                {activeEvents.map((event) => (
                  <p key={event.id}>
                    <strong>Dispositivo:</strong> {(event as any).deviceAlias || (event as any).deviceId}
                    <br />
                    <strong>Paciente:</strong> {(event as any).patientName || 'Desconocido'}
                    <br />
                    <strong>Hora:</strong> {new Date((event as any).occurredAt).toLocaleTimeString('es-ES')}
                  </p>
                ))}
              </div>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <button
                onClick={() => confirmFalseAlarm(activeEvents[0].id)}
                className="flex-1 md:flex-none bg-yellow-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-yellow-600 shadow-lg transition"
              >
                ✓ Falsa Alarma
              </button>
              <button
                onClick={() => confirmFall(activeEvents[0].id)}
                className="flex-1 md:flex-none bg-red-700 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-800 shadow-lg transition"
              >
                🆘 Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Resumen de Dispositivos */}
        <div className="bg-white rounded-xl shadow-md p-6 lg:col-span-2">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">📱 Dispositivos Conectados</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {devices.length === 0 ? (
              <p className="text-gray-600">No hay dispositivos</p>
            ) : (
              devices.map((device) => (
                <div
                  key={device.id}
                  className={`p-4 rounded-lg border-2 transition ${
                    (device as any).isActive
                      ? 'border-green-400 bg-green-50'
                      : 'border-gray-300 bg-gray-50'
                  }`}
                >
                  <h4 className="font-bold text-gray-800">
                    {(device as any).alias || device.id}
                  </h4>
                  <p className="text-sm text-gray-600 mt-2">
                    <strong>Paciente:</strong> {(device as any).patientName || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Estado:</strong>{' '}
                    <span
                      className={
                        (device as any).isActive
                          ? 'text-green-600 font-semibold'
                          : 'text-gray-500'
                      }
                    >
                      {(device as any).isActive ? '🟢 Conectado' : '⚪ Desconectado'}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Última conexión:{' '}
                    {(device as any).lastSeen
                      ? new Date((device as any).lastSeen).toLocaleTimeString('es-ES')
                      : 'Nunca'}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Historial de Eventos */}
        <div className="bg-white rounded-xl shadow-md p-6 h-fit">
          <h4 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
            📋 Eventos Recientes
          </h4>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {events.length === 0 ? (
              <p className="text-gray-500 text-sm">No hay eventos</p>
            ) : (
              events.slice(0, 10).map((event) => (
                <div
                  key={event.id}
                  className={`text-sm p-3 rounded-lg ${
                    (event as any).status === 'OPEN'
                      ? 'bg-red-50 border-l-4 border-red-500'
                      : (event as any).status === 'CONFIRMED_FALL'
                      ? 'bg-yellow-50 border-l-4 border-yellow-500'
                      : 'bg-green-50 border-l-4 border-green-500'
                  }`}
                >
                  <p className="font-bold text-gray-800">
                    {(event as any).deviceAlias || (event as any).deviceId}
                  </p>
                  <p className="text-gray-600 text-xs">
                    {(event as any).patientName}
                  </p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-500">
                      {new Date((event as any).occurredAt).toLocaleTimeString('es-ES')}
                    </span>
                    <span
                      className={`font-bold text-xs px-2 py-1 rounded ${
                        (event as any).status === 'OPEN'
                          ? 'bg-red-200 text-red-800'
                          : (event as any).status === 'CONFIRMED_FALL'
                          ? 'bg-yellow-200 text-yellow-800'
                          : (event as any).status === 'FALSE_ALARM'
                          ? 'bg-green-200 text-green-800'
                          : 'bg-blue-200 text-blue-800'
                      }`}
                    >
                      {(event as any).eventType}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
