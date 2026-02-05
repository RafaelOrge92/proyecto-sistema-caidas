import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, ShieldCheck } from 'lucide-react';

const LandingFooter: React.FC = () => {
  return (
    <footer className="bg-gray-50 border-t border-border pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="col-span-1 md:col-span-1">
            <span className="flex items-center gap-2 font-bold text-xl text-text-main mb-4">
               <ShieldCheck className="text-primary" size={24}/>
               Fall-Detect
            </span>
            <p className="text-sm text-text-muted leading-relaxed">
              Tecnología de detección para la tranquilidad de las familias. 
              Cuidamos de lo que más importa con soluciones simples y efectivas.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-text-main tracking-wider uppercase mb-4">Empresa</h3>
            <ul className="space-y-3">
              <li><Link to="/" className="text-sm text-text-muted hover:text-primary">Inicio</Link></li>
              <li><Link to="/about" className="text-sm text-text-muted hover:text-primary">Sobre Nosotros</Link></li>
              <li><Link to="/contact" className="text-sm text-text-muted hover:text-primary">Contacto</Link></li>
              <li><Link to="/login" className="text-sm text-text-muted hover:text-primary">Acceso Clientes</Link></li>
            </ul>
          </div>

          <div>
             <h3 className="text-sm font-semibold text-text-main tracking-wider uppercase mb-4">Fuentes Oficiales</h3>
             <ul className="space-y-3">
                <li>
                  <a href="https://www.who.int/news-room/fact-sheets/detail/falls" target="_blank" rel="noopener noreferrer" className="text-sm text-text-muted hover:text-primary flex items-center gap-1">
                    OMS Falls Factsheet <ExternalLink size={12}/>
                  </a>
                </li>
                <li>
                  <a href="https://www.cdc.gov/falls/data-research/facts-stats/index.html" target="_blank" rel="noopener noreferrer" className="text-sm text-text-muted hover:text-primary flex items-center gap-1">
                    CDC Older Adult Falls <ExternalLink size={12}/>
                  </a>
                </li>
                <li>
                  <a href="https://www.nice.org.uk/guidance/ng249" target="_blank" rel="noopener noreferrer" className="text-sm text-text-muted hover:text-primary flex items-center gap-1">
                    NICE Guidance <ExternalLink size={12}/>
                  </a>
                </li>
             </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-text-main tracking-wider uppercase mb-4">Legal</h3>
            <ul className="space-y-3">
              <li><span className="text-sm text-text-muted">Aviso Legal</span></li>
              <li><span className="text-sm text-text-muted">Política de Privacidad</span></li>
              <li><span className="text-sm text-text-muted">Cookies</span></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-center text-sm text-text-muted">
            &copy; {new Date().getFullYear()} Fall-Detect S.L. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;