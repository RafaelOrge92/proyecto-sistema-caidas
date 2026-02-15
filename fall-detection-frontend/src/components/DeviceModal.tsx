import React from 'react';
import { DeviceForm } from './DeviceForm';
import { Device } from '../types';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    dataToEdit?: Device; 
}

export const DeviceModal: React.FC<ModalProps> = ({ isOpen, onClose, onSuccess, dataToEdit }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay con desenfoque suave */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            
            {/* Contenedor del Modal */}
            <div className="glass-panel w-full max-w-md relative z-10 overflow-hidden reveal">
                <div className="p-8">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
                            {dataToEdit ? 'Editar' : 'Nuevo'} <span className="text-[var(--color-text-secondary)]">Dispositivo</span>
                        </h3>
                        <button onClick={onClose} className="p-2 rounded-full transition-colors" style={{ color: 'var(--color-text-secondary)', backgroundColor: 'transparent' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-primary)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                            <X size={20} />
                        </button>
                    </div>

                    <DeviceForm
                        initialData={dataToEdit}
                        onSuccess={() => { onSuccess(); onClose(); }}
                        onCancel={onClose}
                    />
                </div>
            </div>
        </div>
    );
};