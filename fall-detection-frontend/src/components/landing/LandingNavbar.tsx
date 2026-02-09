import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShieldAlert } from 'lucide-react';
import Button from '../ui/Button';
import { useAuth } from '../../context/AuthContext';

const LandingNavbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { name: 'Inicio', path: '/' },
    { name: 'Sobre Nosotros', path: '/about' },
    { name: 'Contacto', path: '/contact' },
  ];

  return (
    <nav className="bg-[#1A1F26]/95 backdrop-blur-md border-b border-[#1E293B] sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex">
            <Link to="/" className="flex-shrink-0 flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] rounded-xl flex items-center justify-center shadow-lg glow-primary">
                <ShieldAlert className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-xl text-[#F1F5F9] tracking-tight group-hover:text-[#818CF8] transition-colors">
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
                    ? 'text-[#6366F1] border-b-2 border-[#6366F1]' 
                    : 'text-[#94A3B8] hover:text-[#F1F5F9]'
                }`}
              >
                {link.name}
              </Link>
            ))}
            <Link to={user ? "/dashboard" : "/login"}>
              <Button variant="primary" size="sm" className="ml-4">
                {user ? "Ir al Dashboard" : "Acceso Clientes"}
              </Button>
            </Link>
          </div>

          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#252B35] focus:outline-none transition-colors"
            >
              <span className="sr-only">Abrir menú</span>
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-[#1A1F26] border-b border-[#1E293B] absolute w-full shadow-xl animate-fade-in">
          <div className="px-4 pt-4 pb-4 space-y-2 sm:px-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`block px-4 py-3 rounded-md text-base font-semibold transition-all ${
                  isActive(link.path)
                    ? 'text-[#6366F1] bg-[#252B35]'
                    : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#252B35]'
                }`}
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-6 pb-4 border-t border-[#1E293B]">
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