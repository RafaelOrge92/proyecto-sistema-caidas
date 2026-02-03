import React from 'react';
import { UserForm } from './UserForm';
import { User } from '../types';

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    userToEdit?: User;
}

export const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, onSuccess, userToEdit }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
                <h3 className="text-xl font-bold mb-4">
                    {userToEdit ? 'Editar Usuario' : 'Nuevo Usuario'}
                </h3>
                <UserForm
                    initialData={userToEdit}
                    onSuccess={() => { onSuccess(); onClose(); }}
                    onCancel={onClose}
                />
            </div>
        </div>
    );
};
