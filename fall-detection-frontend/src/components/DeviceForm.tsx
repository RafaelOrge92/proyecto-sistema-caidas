import React, { useState, useEffect } from 'react';
import { AdminService } from '../services/adminService';
import { Device, User } from '../types';

interface DeviceFormProps {
    initialData?: Device;
    onSuccess: () => void;
    onCancel: () => void;
}

export const DeviceForm: React.FC<DeviceFormProps> = ({ initialData, onSuccess, onCancel }) => {
    const [formData, setFormData] = useState<Partial<Device>>({
        id: '',
        alias: '',
        assignedUserId: '',
    });

    const [users, setUsers] = useState<User[]>([]);
    const [errors, setErrors] = useState<any>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // Load users for assignment dropdown
        AdminService.getUsers().then(res => setUsers(res.data)).catch(console.error);

        if (initialData) {
            setFormData({
                id: initialData.id,
                alias: initialData.alias,
                assignedUserId: initialData.assignedUserId || ''
            });
        }
    }, [initialData]);

    const validate = () => {
        let tempErrors: any = {};
        if (!formData.id?.trim()) tempErrors.id = "El ID del dispositivo es obligatorio.";
        if (!formData.alias?.trim()) tempErrors.alias = "El alias es obligatorio.";

        setErrors(tempErrors);
        return Object.keys(tempErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setIsSubmitting(true);
        try {
            await AdminService.createDevice({
                id: formData.id?.trim(),
                alias: formData.alias?.trim(),
                isActive: true
            });

            if (formData.assignedUserId) {
                await AdminService.assignDeviceToUser(formData.id as string, formData.assignedUserId);
            }

            onSuccess();
        } catch (error) {
            console.error('Error creando dispositivo:', error);
            setErrors({ submit: 'No se pudo crear el dispositivo.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>ID del Dispositivo (ESP32)</label>
                <input
                    type="text"
                    className="w-full border rounded-2xl py-3 px-4 outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
                    style={{
                        backgroundColor: 'var(--color-bg-primary)',
                        color: 'var(--color-text-primary)',
                        borderColor: 'var(--color-border)'
                    }}
                    value={formData.id}
                    onChange={e => setFormData({ ...formData, id: e.target.value })}
                    disabled={!!initialData}
                />
                {errors.id && <p className="text-red-500 text-xs mt-1">{errors.id}</p>}
            </div>

            <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Alias (Nombre amigable)</label>
                <input
                    type="text"
                    className="w-full border rounded-2xl py-3 px-4 outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
                    style={{
                        backgroundColor: 'var(--color-bg-primary)',
                        color: 'var(--color-text-primary)',
                        borderColor: 'var(--color-border)'
                    }}
                    value={formData.alias}
                    onChange={e => setFormData({ ...formData, alias: e.target.value })}
                />
                {errors.alias && <p className="text-red-500 text-xs mt-1">{errors.alias}</p>}
            </div>

            <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Asignar a Usuario (Opcional)</label>
                <select
                    className="w-full border rounded-2xl py-3 px-4 outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 appearance-none cursor-pointer"
                    style={{
                        backgroundColor: 'var(--color-bg-primary)',
                        color: 'var(--color-text-primary)',
                        borderColor: 'var(--color-border)'
                    }}
                    value={formData.assignedUserId || ""}
                    onChange={e => setFormData({ ...formData, assignedUserId: e.target.value })}
                >
                    <option value="">-- Sin asignar --</option>
                    {users
                        .filter(u => u.role === 'MEMBER')
                        .map(user => (
                            <option key={user.id} value={user.id} className="bg-[#0F1419]">
                                {user.fullName}
                            </option>
                        ))}
                </select>
            </div>

            {errors.submit && <p className="text-red-500 text-xs">{errors.submit}</p>}

            <div className="flex gap-4 pt-6">
                <button 
                    type="button" 
                    onClick={onCancel} 
                    className="flex-1 px-4 py-2.5 rounded-lg border font-semibold transition-all"
                    style={{
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text-primary)',
                        backgroundColor: 'transparent'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-primary)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:from-[#818CF8] hover:to-[#A78BFA] font-semibold transition-all disabled:opacity-50"
                    style={{ color: 'white' }}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Guardando...' : (initialData ? 'Actualizar' : 'Registrar')}
                </button>
            </div>
        </form>
    );
};
