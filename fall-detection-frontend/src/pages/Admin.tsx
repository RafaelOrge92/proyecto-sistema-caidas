import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AdminService } from '../services/adminService';
import { User, Device } from '../types';
import { Users, HardDrive, RefreshCw, Activity, BarChart3 } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

const Admin = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'users' | 'devices' | 'podium' | 'graficas'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [podium, setPodium] = useState<Array<{ device_id: string; count: number }>>([]);
  const [grafanaEmbedUrl, setGrafanaEmbedUrl] = useState('');
  const [grafanaLoading, setGrafanaLoading] = useState(false);
  const [grafanaError, setGrafanaError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const { user } = useAuth();
  const isPodiumOnly = new URLSearchParams(location.search).get('tab') === 'podium';
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [usersRes, devicesRes] = await Promise.all([
          AdminService.getUsers(),
          AdminService.getDevices()
        ]);
        setUsers(usersRes.data);
        setDevices(devicesRes.data);

        try {
          const podiumRes = await AdminService.getDevicePodium();
          setPodium(podiumRes.data);
        } catch (error) {
          console.error('Error cargando podium:', error);
          setPodium([]);
        }
      } catch (error) {
        console.error('Error cargando datos admin:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const tab = new URLSearchParams(location.search).get('tab');
    if (tab === 'users' || tab === 'devices' || tab === 'podium' || tab === 'home' || tab === 'graficas') {
      setActiveTab(tab);
    }
  }, [location.search]);

  useEffect(() => {
    if (activeTab !== 'graficas' || !isAdmin) {
      return;
    }

    let cancelled = false;
    const loadGrafanaEmbed = async () => {
      setGrafanaLoading(true);
      setGrafanaError(null);
      try {
        const response = await AdminService.getGrafanaEmbedUrl({ panelId: 2 });
        if (!cancelled) {
          setGrafanaEmbedUrl(response.data.embedUrl);
        }
      } catch (error) {
        console.error('Error cargando embed de Grafana:', error);
        if (!cancelled) {
          setGrafanaEmbedUrl('');
          setGrafanaError('No se pudo cargar Grafana. Verifica configuracion de backend y servicio Grafana.');
        }
      } finally {
        if (!cancelled) {
          setGrafanaLoading(false);
        }
      }
    };

    void loadGrafanaEmbed();
    return () => {
      cancelled = true;
    };
  }, [activeTab, isAdmin]);

  return (
    <div className="min-h-screen pt-24 px-8 reveal">
      <div className="max-w-7xl mx-auto">
        {!isPodiumOnly && (
          <header className="mb-16">
            <div className="space-y-2">
              <h1 className="text-6xl font-bold tracking-tighter" style={{ color: 'var(--color-text-primary)' }}>Consola de Control</h1>
              <p className="text-xl text-[var(--color-text-secondary)] font-medium">Gestión avanzada de infraestructura y seguridad.</p>
            </div>
          </header>
        )}

        <Card noPadding className="border-none bg-transparent shadow-none">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : isPodiumOnly ? (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Activity size={24} className="text-amber-400" />
                <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Dispositivos con mas eventos</h2>
              </div>
              {podium.length === 0 ? (
                <Card className="text-center py-12 border-dashed border-white/10 bg-transparent">
                  <p className="text-[var(--color-text-secondary)]">No hay datos de podium disponibles.</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {podium.slice(0, 6).map((item, index) => (
                    <Card key={`${item.device_id}-${index}`} hover className="border-white/5">
                      <div className="flex items-center justify-between mb-6">
                        <div className={`text-4xl font-bold ${
                          index === 0 ? 'text-amber-400' :
                          index === 1 ? 'text-gray-300' :
                          index === 2 ? 'text-amber-700' :
                          'text-indigo-400'
                        }`}>
                          #{index + 1}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-widest">Eventos</p>
                          <p className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{item.count}</p>
                        </div>
                      </div>
                      <p className="font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>Dispositivo {item.device_id}</p>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === 'users' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {users.map(user => (
                <Card key={user.id} hover className="border-white/5">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 font-bold">
                      {user.fullName.charAt(0)}
                    </div>
                    <Badge variant={user.role === 'ADMIN' ? 'error' : 'info'}>{user.role}</Badge>
                  </div>
                  <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>{user.fullName}</h3>
                  <p className="text-[var(--color-text-secondary)] text-sm mb-6">{user.email}</p>
                  <Button variant="outline" size="sm" fullWidth>Configurar Perfil</Button>
                </Card>
              ))}
            </div>
          ) : activeTab === 'devices' ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {devices.map(device => (
                 <Card key={device.id} hover className="border-white/5">
                   <div className="flex justify-between items-center mb-8">
                      <HardDrive className="text-[var(--color-primary)]" size={32} />
                      <Badge variant={(device as any).isActive ? 'success' : 'default'}>
                        {(device as any).isActive ? 'En Línea' : 'Desconectado'}
                      </Badge>
                   </div>
                   <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>{(device as any).alias || device.id}</h3>
                   <p className="text-sm text-[var(--color-text-secondary)] mb-6">Paciente: {(device as any).patientName || 'No asignado'}</p>
                   <div className="flex gap-3">
                     <Button variant="outline" size="sm" className="flex-1">Logs</Button>
                     <Button variant="secondary" size="sm" className="flex-1">Editar</Button>
                   </div>
                 </Card>
               ))}
             </div>
          ) : activeTab === 'graficas' ? (
            isAdmin ? (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <BarChart3 size={24} className="text-[var(--color-primary)]" />
                <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Gráficas de Monitoreo</h2>
              </div>
              <Card noPadding className="border-white/5 overflow-hidden">
                <div className="flex justify-center items-center p-8">
                  {grafanaLoading ? (
                    <div className="w-full py-20 text-center text-[var(--color-text-secondary)]">
                      Cargando Grafana...
                    </div>
                  ) : grafanaError ? (
                    <div className="w-full py-20 text-center text-red-400">{grafanaError}</div>
                  ) : grafanaEmbedUrl ? (
                    <div className="relative w-full">
                      <iframe
                        src={grafanaEmbedUrl}
                        width="100%"
                        height="600"
                        frameBorder="0"
                        style={{ borderRadius: '8px', minWidth: '100%' }}
                        sandbox="allow-scripts allow-same-origin allow-forms"
                        referrerPolicy="strict-origin-when-cross-origin"
                        title="Grafana Dashboard"
                      ></iframe>
                      <div className="absolute top-0 left-0 right-0 h-14 z-10" aria-hidden="true"></div>
                    </div>
                  ) : (
                    <div className="w-full py-20 text-center text-[var(--color-text-secondary)]">
                      No hay URL de Grafana disponible.
                    </div>
                  )}
                </div>
              </Card>
              <p className="text-sm text-[var(--color-text-secondary)] text-center">
                Dashboard de Grafana - Datos en tiempo real del sistema de monitoreo
              </p>
            </div>
            ) : (
              <Card className="text-center py-12 border-dashed border-white/10 bg-transparent">
                <p className="text-[var(--color-text-secondary)]">No tienes permisos para acceder a las gráficas.</p>
              </Card>
            )
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Activity size={24} className="text-amber-400" />
                <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Dispositivos con mas eventos</h2>
              </div>
              {podium.length === 0 ? (
                <Card className="text-center py-12 border-dashed border-white/10 bg-transparent">
                  <p className="text-[var(--color-text-secondary)]">No hay datos de podium disponibles.</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {podium.slice(0, 6).map((item, index) => (
                    <Card key={`${item.device_id}-${index}`} hover className="border-white/5">
                      <div className="flex items-center justify-between mb-6">
                        <div className={`text-4xl font-bold ${
                          index === 0 ? 'text-amber-400' :
                          index === 1 ? 'text-gray-300' :
                          index === 2 ? 'text-amber-700' :
                          'text-indigo-400'
                        }`}>
                          #{index + 1}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-widest">Eventos</p>
                          <p className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{item.count}</p>
                        </div>
                      </div>
                      <p className="font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>Dispositivo {item.device_id}</p>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Admin;
