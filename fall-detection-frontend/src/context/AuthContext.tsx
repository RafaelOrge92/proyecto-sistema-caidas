import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
    user: { token: string; role: string } | null;
    loading: boolean; // 👈 Añadimos esto para controlar la carga inicial
    login: (token: string, role: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<{ token: string; role: string } | null>(null);
    const [loading, setLoading] = useState(true); // 👈 Empieza en true

    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');

        console.log("Datos detectados en storage:", { token, role });

        if (token && role) {
            setUser({ token, role });
        }
        
        // Una vez que intentamos leer, dejamos de cargar
        setLoading(false); 
    }, []);

    const login = (token: string, role: string) => {
        localStorage.setItem('token', token);
        localStorage.setItem('role', role);
        setUser({ token, role });
        // Aseguramos que el login guarde el JWT según los requisitos 
    };

    const logout = () => {
        localStorage.clear();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth debe usarse dentro de un AuthProvider");
    return context;
};