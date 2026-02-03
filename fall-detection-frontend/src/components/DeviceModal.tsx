import React from 'react';
import { DeviceForm } from './DeviceForm';
import { Device } from '../types';

interface DeviceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    deviceToEdit?: Device;
}

export const DeviceModal: React.FC<DeviceModalProps> = ({ isOpen, onClose, onSuccess, deviceToEdit }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
                <h3 className="text-xl font-bold mb-4">
                    {deviceToEdit ? 'Editar Dispositivo' : 'Nuevo Dispositivo'}
                </h3>
                <DeviceForm
                    initialData={deviceToEdit}
                    onSuccess={() => { onSuccess(); onClose(); }}
                    onCancel={onClose}
                />
            </div>
        </div>
    );
};
