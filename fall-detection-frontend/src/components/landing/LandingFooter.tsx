import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, ShieldAlert } from 'lucide-react';

const LandingFooter: React.FC = () => {
  return (
    <footer className="bg-[var(--color-bg-primary)] border-t border-white/5 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
          
          <div className="col-span-1 md:col-span-1 space-y-6">
            <span className="flex items-center gap-3 font-bold text-2xl text-white tracking-tighter">
               <div className="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center">
                 <ShieldAlert size={24}/>
               </div>
               Fall Detect
            </span>
            <p className="text-[var(--color-text-secondary)] leading-relaxed font-medium">
              Tecnología que redefine el cuidado. <br />
              Seguridad invisible para el hogar.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-black text-white tracking-[0.2em] uppercase mb-8">Navegación</h3>
            <ul className="space-y-4 font-semibold">
              <li><Link to="/" className="text-[var(--color-text-secondary)] hover:text-white transition-colors">Inicio</Link></li>
              <li><Link to="/about" className="text-[var(--color-text-secondary)] hover:text-white transition-colors">Nosotros</Link></li>
              <li><Link to="/contact" className="text-[var(--color-text-secondary)] hover:text-white transition-colors">Contacto</Link></li>
            </ul>
          </div>

          <div>
             <h3 className="text-xs font-black text-white tracking-[0.2em] uppercase mb-8">Recursos</h3>
             <ul className="space-y-4 font-semibold">
                <li>
                  <a href="https://www.who.int" target="_blank" className="text-[var(--color-text-secondary)] hover:text-indigo-400 flex items-center gap-2 transition-colors">
                    <span>OMS</span> <ExternalLink size={12}/>
                  </a>
                </li>
                <li>
                  <a href="https://www.cdc.gov" target="_blank" className="text-[var(--color-text-secondary)] hover:text-indigo-400 flex items-center gap-2 transition-colors">
                    <span>CDC Falls</span> <ExternalLink size={12}/>
                  </a>
                </li>
             </ul>
          </div>

          <div>
            <h3 className="text-xs font-black text-white tracking-[0.2em] uppercase mb-8">Legal</h3>
            <ul className="space-y-4 font-semibold text-[var(--color-text-secondary)]">
              <li className="hover:text-white cursor-pointer transition-colors">Privacidad</li>
              <li className="hover:text-white cursor-pointer transition-colors">Términos</li>
            </ul>
          </div>
        </div>
        
        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[var(--color-text-secondary)] text-sm font-medium">
            &copy; {new Date().getFullYear()} Fall Detect S.L.
          </p>
          <div className="flex gap-8 text-sm font-bold text-white/20">
            <span>Diseñado en Vigo</span>
            <span>v2.0.4</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;