import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthUser {
    token: string;
    role: string;
    id: string;
    fullName: string;
    email: string;
}

interface AuthContextType {
    user: AuthUser | null;
    loading: boolean;
    login: (token: string, role: string, id: string, fullName: string, email: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        const id = localStorage.getItem('userId');
        const fullName = localStorage.getItem('userFullName');
        const email = localStorage.getItem('userEmail');

        if (token && role && id && fullName && email) {
            setUser({ token, role, id, fullName, email });
        }
        
        setLoading(false);
    }, []);

    const login = (token: string, role: string, id: string, fullName: string, email: string) => {
        localStorage.setItem('token', token);
        localStorage.setItem('role', role);
        localStorage.setItem('userId', id);
        localStorage.setItem('userFullName', fullName);
        localStorage.setItem('userEmail', email);
        setUser({ token, role, id, fullName, email });
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('userId');
        localStorage.removeItem('userFullName');
        localStorage.removeItem('userEmail');
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