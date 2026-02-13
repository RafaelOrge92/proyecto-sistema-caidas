import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShieldAlert, Sun, Moon } from 'lucide-react';
import Button from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const LandingNavbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { name: 'Inicio', path: '/' },
    { name: 'Sobre Nosotros', path: '/about' },
    { name: 'Contacto', path: '/contact' },
  ];

  return (
    <nav className="bg-bg-secondary/95 backdrop-blur-md border-b border-border sticky top-0 z-50 shadow-lg transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex">
            <Link to="/" className="flex-shrink-0 flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] rounded-xl flex items-center justify-center shadow-lg glow-primary">
                <ShieldAlert className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-xl text-text-primary tracking-tight group-hover:text-primary-hover transition-colors">
                Fall-Detect
              </span>
            </Link>
          </div>
          
          <div className="hidden md:flex md:items-center md:space-x-10">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 text-sm font-semibold transition-all ${
                  isActive(link.path) 
                    ? 'text-primary border-b-2 border-primary' 
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {link.name}
              </Link>
            ))}
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center p-2 rounded-lg transition-colors hover:bg-white/10"
              title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-text-secondary" />
              ) : (
                <Moon className="w-5 h-5 text-text-secondary" />
              )}
            </button>
            <Link to={user ? "/dashboard" : "/login"}>
              <Button variant="primary" size="sm" className="ml-4">
                {user ? "Ir al Dashboard" : "Acceso Clientes"}
              </Button>
            </Link>
          </div>

          <div className="flex items-center md:hidden gap-4">
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center p-2 rounded-lg transition-colors hover:bg-white/10"
              title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-text-secondary" />
              ) : (
                <Moon className="w-5 h-5 text-text-secondary" />
              )}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-white/10 focus:outline-none transition-colors"
            >
              <span className="sr-only">Abrir menú</span>
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-bg-secondary border-b border-border absolute w-full shadow-xl animate-fade-in transition-colors">
          <div className="px-4 pt-4 pb-4 space-y-2 sm:px-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`block px-4 py-3 rounded-md text-base font-semibold transition-all ${
                  isActive(link.path)
                    ? 'text-primary bg-bg-elevated'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
                }`}
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-6 pb-4 border-t border-border">
               <Link to={user ? "/dashboard" : "/login"} onClick={() => setIsOpen(false)}>
                <Button fullWidth variant="primary">
                  {user ? "Ir al Dashboard" : "Acceso Clientes"}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default LandingNavbar;