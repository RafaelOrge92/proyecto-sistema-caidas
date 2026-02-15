import React from 'react';
import { UserForm } from './UserForm';
import { GenericModal } from './GenericModal';
import { User } from '../types';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    dataToEdit?: User; 
}

export const UserModal: React.FC<ModalProps> = ({ isOpen, onClose, onSuccess, dataToEdit }) => {
    const title = dataToEdit ? 'Editar Usuario' : 'Nuevo Usuario';

    return (
        <GenericModal
            isOpen={isOpen}
            onClose={onClose}
            onSuccess={() => { onSuccess(); onClose(); }}
            title={title}
        >
            <UserForm
                initialData={dataToEdit}
                onSuccess={() => { onSuccess(); onClose(); }}
                onCancel={onClose}
            />
        </GenericModal>
    );
};