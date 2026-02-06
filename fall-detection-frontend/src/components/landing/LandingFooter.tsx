import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, ShieldAlert } from 'lucide-react';

const LandingFooter: React.FC = () => {
  return (
    <footer className="bg-[#1A1F26] border-t border-[#1E293B] pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          <div className="col-span-1 md:col-span-1">
            <span className="flex items-center gap-3 font-bold text-xl text-[#F1F5F9] mb-6">
               <div className="bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] p-2 rounded-lg">
                 <ShieldAlert className="text-white" size={24}/>
               </div>
               Fall-Detect
            </span>
            <p className="text-[#94A3B8] leading-relaxed">
              Tecnología de detección para la tranquilidad de las familias. 
              Cuidamos de lo que más importa con soluciones simples y efectivas.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-[#F1F5F9] tracking-wider uppercase mb-6">Empresa</h3>
            <ul className="space-y-4">
              <li><Link to="/" className="text-[#94A3B8] hover:text-[#6366F1] transition-colors">Inicio</Link></li>
              <li><Link to="/about" className="text-[#94A3B8] hover:text-[#6366F1] transition-colors">Sobre Nosotros</Link></li>
              <li><Link to="/contact" className="text-[#94A3B8] hover:text-[#6366F1] transition-colors">Contacto</Link></li>
              <li><Link to="/login" className="text-[#94A3B8] hover:text-[#6366F1] transition-colors">Acceso Clientes</Link></li>
            </ul>
          </div>

          <div>
             <h3 className="text-sm font-bold text-[#F1F5F9] tracking-wider uppercase mb-6">Fuentes Oficiales</h3>
             <ul className="space-y-4">
                <li>
                  <a href="https://www.who.int/news-room/fact-sheets/detail/falls" target="_blank" rel="noopener noreferrer" className="text-[#94A3B8] hover:text-[#06B6D4] flex items-center gap-2 transition-colors">
                    <span>OMS Falls Factsheet</span>
                    <ExternalLink size={14}/>
                  </a>
                </li>
                <li>
                  <a href="https://www.cdc.gov/falls/data-research/facts-stats/index.html" target="_blank" rel="noopener noreferrer" className="text-[#94A3B8] hover:text-[#06B6D4] flex items-center gap-2 transition-colors">
                    <span>CDC Older Adult Falls</span>
                    <ExternalLink size={14}/>
                  </a>
                </li>
                <li>
                  <a href="https://www.nice.org.uk/guidance/ng249" target="_blank" rel="noopener noreferrer" className="text-[#94A3B8] hover:text-[#06B6D4] flex items-center gap-2 transition-colors">
                    <span>NICE Guidance</span>
                    <ExternalLink size={14}/>
                  </a>
                </li>
             </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-[#F1F5F9] tracking-wider uppercase mb-6">Legal</h3>
            <ul className="space-y-4">
              <li><span className="text-[#94A3B8] cursor-pointer hover:text-[#6366F1] transition-colors">Aviso Legal</span></li>
              <li><span className="text-[#94A3B8] cursor-pointer hover:text-[#6366F1] transition-colors">Política de Privacidad</span></li>
              <li><span className="text-[#94A3B8] cursor-pointer hover:text-[#6366F1] transition-colors">Cookies</span></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-[#1E293B]">
          <p className="text-center text-[#64748B]">
            &copy; {new Date().getFullYear()} Fall-Detect S.L. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;