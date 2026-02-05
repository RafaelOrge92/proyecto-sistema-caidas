import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Llamada al backend de tus compañeros
            const res = await axios.post('http://localhost:3000/api/auth/login', { email, password });
            login(res.data.token, res.data.user.role);
            window.location.href = '/dashboard'; // O usar useNavigate de react-router
        } catch (error) {
            alert("Credenciales incorrectas");
        }
    };

    return (
        <div className="h-screen flex items-center justify-center bg-gray-100">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-96">
                <h2 className="text-2xl font-bold mb-6 text-center">Sistema Anti-Caídas</h2>
                <input 
                    type="email" placeholder="Email" 
                    className="w-full border p-2 mb-4 rounded"
                    onChange={(e) => setEmail(e.target.value)} 
                />
                <input 
                    type="password" placeholder="Contraseña" 
                    className="w-full border p-2 mb-6 rounded"
                    onChange={(e) => setPassword(e.target.value)} 
                />
                <button className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
                    Entrar
                </button>
            </form>
        </div>
    );
};