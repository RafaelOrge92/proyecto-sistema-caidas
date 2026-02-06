import React, { useEffect, useState } from 'react';
import { AdminService } from '../services/adminService';
import { FallEvent } from '../types';

export const EventsPage: React.FC = () => {
    const [events, setEvents] = useState<FallEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        try {
            const response = await AdminService.getEvents();
            setEvents(response.data);
        } catch (error) {
            console.error("Error cargando eventos", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'OPEN': return 'bg-red-100 text-red-800';
            case 'CONFIRMED_FALL': return 'bg-orange-100 text-orange-800';
            case 'FALSE_ALARM': return 'bg-gray-100 text-gray-800';
            case 'RESOLVED': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Historial de Eventos</h2>
            
            {loading ? (
                <p>Cargando eventos...</p>
            ) : (
                <div className="overflow-x-auto shadow-md rounded-lg">
                    <table className="min-w-full bg-white border">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="py-3 px-4 border text-left">Fecha</th>
                                <th className="py-3 px-4 border text-left">Dispositivo</th>
                                <th className="py-3 px-4 border text-left">Tipo</th>
                                <th className="py-3 px-4 border text-left">Estado</th>
                                <th className="py-3 px-4 border text-left">Revisado por</th>
                            </tr>
                        </thead>
                        <tbody>
                            {events.map(event => (
                                <tr key={event.id} className="hover:bg-gray-50">
                                    <td className="p-2 border">
                                        {event.occurredAt ? new Date(event.occurredAt).toLocaleString() : '-'}
                                    </td>
                                    <td className="p-2 border">{event.deviceId}</td>
                                    <td className="p-2 border">{event.eventType}</td>
                                    <td className="p-2 border">
                                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(event.status || '')}`}>
                                            {event.status}
                                        </span>
                                    </td>
                                    <td className="p-2 border">
                                        {event.reviewedBy ? (
                                            <div>
                                                <p className="font-semibold">{event.reviewedBy}</p>
                                                {event.reviewComment && (
                                                    <p className="text-xs text-gray-500 italic">"{event.reviewComment}"</p>
                                                )}
                                            </div>
                                        ) : '-'}
                                    </td>
                                </tr>
                            ))}
                            {events.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-4 text-center text-gray-500">No hay eventos registrados.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
