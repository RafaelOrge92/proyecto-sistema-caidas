import React, { useState, useEffect } from 'react';
import { AdminService } from '../services/adminService';
import { Device, User } from '../types';
import { FormInput, FormSelect } from './FormInput';
import Button from './ui/Button';

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

    const userOptions = [
        { value: '', label: '-- Sin asignar --' },
        ...users
            .filter(u => u.role === 'MEMBER')
            .map(user => ({ value: user.id, label: user.fullName }))
    ];

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <FormInput
                label="ID del Dispositivo (ESP32)"
                type="text"
                value={formData.id}
                onChange={e => setFormData({ ...formData, id: e.target.value })}
                error={errors.id}
                disabled={!!initialData}
            />

            <FormInput
                label="Alias (Nombre amigable)"
                type="text"
                value={formData.alias}
                onChange={e => setFormData({ ...formData, alias: e.target.value })}
                error={errors.alias}
            />

            <FormSelect
                label="Asignar a Usuario (Opcional)"
                options={userOptions}
                value={formData.assignedUserId || ""}
                onChange={e => setFormData({ ...formData, assignedUserId: e.target.value })}
            />

            {errors.submit && <p className="text-red-500 text-xs">{errors.submit}</p>}

            <div className="flex gap-4 pt-6">
                <Button variant="ghost" fullWidth onClick={onCancel}>
                    Cancelar
                </Button>
                <Button 
                    variant="primary" 
                    fullWidth 
                    disabled={isSubmitting}
                    type="submit"
                >
                    {isSubmitting ? 'Guardando...' : (initialData ? 'Actualizar' : 'Registrar')}
                </Button>
            </div>
        </form>
    );
};
