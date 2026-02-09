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
            if (initialData) {
                await AdminService.updateDevice(initialData.id, formData);
                alert("Dispositivo actualizado correctamente");
            } else {
                await AdminService.createDevice(formData);
                alert("Dispositivo registrado correctamente");
            }
            onSuccess();
        } catch (error) {
            console.error(error);
            alert("Error al guardar dispositivo.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-bold">ID del Dispositivo (ESP32)</label>
                <input
                    type="text"
                    className="w-full border p-2 rounded"
                    value={formData.id}
                    onChange={e => setFormData({ ...formData, id: e.target.value })}
                    disabled={!!initialData} // Usually ID is immutable
                />
                {errors.id && <p className="text-red-500 text-xs">{errors.id}</p>}
            </div>

            <div>
                <label className="block text-sm font-bold">Alias (Nombre amigable)</label>
                <input
                    type="text"
                    className="w-full border p-2 rounded"
                    value={formData.alias}
                    onChange={e => setFormData({ ...formData, alias: e.target.value })}
                />
                {errors.alias && <p className="text-red-500 text-xs">{errors.alias}</p>}
            </div>

            <div>
                <label className="block text-sm font-bold">Asignar a Usuario (Opcional)</label>
                <select
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
                    value={formData.assignedUserId || ""}
                    onChange={e => setFormData({ ...formData, assignedUserId: e.target.value })}
                >
                    <option value="" className="bg-[#0F1419]">-- Sin asignar --</option>
                    {users
                        .filter(u => u.role === 'MEMBER')
                        .map(user => (
                            <option key={user.id} value={user.id} className="bg-[#0F1419]">
                                {user.fullName}
                            </option>
                        ))}
                </select>
            </div>

            <div className="flex gap-2 justify-end">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-600 hover:text-gray-800">
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:bg-purple-300"
                >
                    {isSubmitting ? 'Guardando...' : (initialData ? 'Actualizar' : 'Registrar')}
                </button>
            </div>
        </form>
    );
};
