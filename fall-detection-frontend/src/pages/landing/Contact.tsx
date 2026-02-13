import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const Contact: React.FC = () => {
  const { theme } = useTheme();
  
  return (
    <div className="pt-32 pb-20 px-6 bg-[var(--color-bg-primary)] min-h-screen reveal">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-20">
          <h1 className="text-6xl font-bold tracking-tight mb-6">Hablemos.</h1>
          <p className="text-xl text-[var(--color-text-secondary)]">Nuestro equipo de soporte está disponible 24/7 para ayudarte.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Formulario Estilo Apple */}
          <form className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="Nombre" className="bg-[var(--color-bg-secondary)] rounded-2xl p-4 border-none focus:ring-2 focus:ring-[var(--color-primary)] outline-none" />
              <input type="email" placeholder="Email" className="bg-[var(--color-bg-secondary)] rounded-2xl p-4 border-none focus:ring-2 focus:ring-[var(--color-primary)] outline-none" />
            </div>
            <textarea placeholder="¿Cómo podemos ayudarte?" rows={5} className="w-full bg-[var(--color-bg-secondary)] rounded-2xl p-4 border-none focus:ring-2 focus:ring-[var(--color-primary)] outline-none resize-none"></textarea>
            <button 
              className={`w-full font-bold py-4 rounded-2xl transition-all shadow-lg ${
                theme === 'dark' 
                  ? 'bg-white text-black hover:bg-gray-200' 
                  : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-indigo-500/30 hover:scale-105'
              }`}
            >
              Enviar Mensaje
            </button>
          </form>

          {/* Información Lateral */}
          <div className="space-y-12 flex flex-col justify-center">
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 glass-panel flex items-center justify-center text-[var(--color-primary)]">
                <Mail size={24} />
              </div>
              <div>
                <p className="text-sm text-[var(--color-text-secondary)] uppercase font-bold tracking-widest">Escríbenos</p>
                <p className="text-xl font-medium">soporte@falldetect.com</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 glass-panel flex items-center justify-center text-cyan-400">
                <Phone size={24} />
              </div>
              <div>
                <p className="text-sm text-[var(--color-text-secondary)] uppercase font-bold tracking-widest">Llámanos</p>
                <p className="text-xl font-medium">+34 900 123 456</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 glass-panel flex items-center justify-center text-emerald-400">
                <MapPin size={24} />
              </div>
              <div>
                <p className="text-sm text-[var(--color-text-secondary)] uppercase font-bold tracking-widest">Ubicación</p>
                <p className="text-xl font-medium">Sede Central, Madrid</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;