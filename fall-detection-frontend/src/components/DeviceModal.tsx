import React from 'react';
import { DeviceForm } from './DeviceForm';
import { GenericModal } from './GenericModal';
import { Device } from '../types';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    dataToEdit?: Device; 
}

export const DeviceModal: React.FC<ModalProps> = ({ isOpen, onClose, onSuccess, dataToEdit }) => {
    const title = dataToEdit ? 'Editar Dispositivo' : 'Nuevo Dispositivo';

    return (
        <GenericModal
            isOpen={isOpen}
            onClose={onClose}
            onSuccess={() => { onSuccess(); onClose(); }}
            title={title}
        >
            <DeviceForm
                initialData={dataToEdit}
                onSuccess={() => { onSuccess(); onClose(); }}
                onCancel={onClose}
            />
        </GenericModal>
    );
};