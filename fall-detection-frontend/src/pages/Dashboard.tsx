import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AdminService } from '../services/adminService';
import { FallEvent } from '../types';
 

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<FallEvent[]>([]);
  const [isAlertActive, setIsAlertActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSimulatedAlert = () => {
    const simulatedEvent: FallEvent = {
      id: `SIM-${Date.now()}`,
      deviceId: 'ESP32-SIM-001',
      timestamp: new Date().toISOString(),
      fallDetected: true,
      status: 'PENDIENTE',
      accelerometerData: { x: 2.8, y: 3.1, z: 0.4 }
    };
    setEvents((prev) => [simulatedEvent, ...prev]);
    setIsAlertActive(true);
  };

  const clearSimulatedAlerts = () => {
    setEvents((prev) => prev.filter((e) => !e.id.startsWith('SIM-')));
    setIsAlertActive(false);
  };

  const loadData = async () => {
    try {
      const res = await AdminService.getEvents();
      setEvents((prev) => {
        const simulated = prev.filter((e) => e.id.startsWith('SIM-'));
        const merged = [...simulated, ...res.data];

        // Lógica de detección: busca eventos PENDIENTES con caída [cite: 49, 70]
        const activeFall = merged.find((e: FallEvent) => e.fallDetected && e.status === 'PENDIENTE');

        if (activeFall) {
          setIsAlertActive(true);
          // Alerta sonora (Extra) [cite: 97]
          const audio = new Audio('https://actions.google.com/sounds/v1/alarms/emergency_it_is_an_emergency.ogg');
          audio.play().catch(() => console.log("Interacción requerida para audio"));
        } else {
          setIsAlertActive(false);
        }

        return merged;
      });
      setError(null);
    } catch (err) {
      setError("⚠️ Sin conexión con el servidor de alertas.");
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000); // Polling cada 3 segundos [cite: 48]
    return () => clearInterval(interval);
  }, []);

  const handleFalseAlarm = async (id: string) => {
    if (id.startsWith('SIM-')) {
      setEvents((prev) =>
        prev.map((e) =>
          e.id === id ? { ...e, status: 'FALSA_ALARMA', fallDetected: false } : e
        )
      );
      setIsAlertActive(false);
      return;
    }
    try {
      await AdminService.confirmFalseAlarm(id); // Funcionalidad Extra 
      loadData();
    } catch (err) {
      alert("Error al procesar la confirmación");
    }
  };

  return (
    <div className={`p-4 md:p-6 min-h-screen transition-all duration-700 ${isAlertActive ? 'bg-red-600' : 'bg-gray-100'}`}>
      
      {/* Encabezado Responsive  */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className={`text-2xl font-bold ${isAlertActive ? 'text-white' : 'text-gray-800'}`}>
          Panel de Control - {user?.role}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {user?.role === 'ADMIN' && (
            <>
              <button
                onClick={createSimulatedAlert}
                className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold hover:bg-orange-600"
              >
                Simular caída
              </button>
              <button
                onClick={clearSimulatedAlerts}
                className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm font-semibold hover:bg-gray-300"
              >
                Limpiar simulación
              </button>
            </>
          )}
          {error && <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">{error}</span>}
        </div>
      </div>

      {/* Alerta Crítica  */}
      {isAlertActive && (
        <div className="bg-white p-6 rounded-lg shadow-2xl mb-8 border-l-8 border-yellow-400 animate-pulse">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="text-2xl font-black text-red-600">🚨 CAÍDA DETECTADA</h3>
              <p className="text-gray-600">Revisar inmediatamente al usuario del dispositivo.</p>
            </div>
            <button 
              onClick={() => handleFalseAlarm(events.find(e => e.fallDetected)?.id || '')}
              className="w-full md:w-auto bg-red-600 text-white px-8 py-3 rounded-full font-bold hover:bg-red-700 shadow-lg"
            >
              Confirmar Falsa Alarma
            </button>
          </div>
        </div>
      )}

      {/* Grid Principal [cite: 81, 84] */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Espacio para la Gráfica de RAFA  */}
        <div className="lg:col-span-2">
          {/* <LiveChart data={events} /> */}
        </div>

        {/* Historial de Eventos [cite: 86, 94] */}
        <div className="bg-white rounded-xl shadow-md p-4 h-fit">
          <h4 className="font-bold text-gray-700 mb-4 border-b pb-2">Eventos Recientes</h4>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {events.map(event => (
              <div key={event.id} className="text-sm flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                <div>
                  <p className="font-mono text-xs text-gray-500">{event.deviceId}</p>
                  <p className="text-gray-700">{new Date(event.timestamp).toLocaleTimeString()}</p>
                </div>
                <span className={`font-bold ${event.fallDetected ? 'text-red-500' : 'text-green-500'}`}>
                  {event.fallDetected ? 'CAÍDA' : 'NORMAL'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};