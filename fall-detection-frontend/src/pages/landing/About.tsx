import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Users, Home, ShieldCheck } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const About: React.FC = () => {
  const { theme } = useTheme();
  
  return (
    <div className="pt-32 pb-20 bg-bg-primary min-h-screen reveal transition-colors">
      {/* Encabezado Principal */}
      <div className="max-w-7xl mx-auto px-6 mb-24">
        <div className="text-center max-w-3xl mx-auto space-y-8">
          <h1 className="text-6xl md:text-7xl font-bold text-text-primary tracking-tighter">
            Nuestra <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-indigo-400 to-purple-600">
              misión de cuidado.
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-text-secondary leading-relaxed font-medium">
            La tecnología debe servir para proteger lo que más amamos, sin invadir la privacidad y con total fiabilidad.
          </p>
        </div>
      </div>

      {/* Sección de Historia y Valores */}
      <div className="max-w-7xl mx-auto px-6 mb-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-stretch">
           <div className="glass-panel p-12 flex flex-col justify-center">
              <h2 className="text-4xl font-bold mb-8 text-text-primary tracking-tight">Nuestra Historia</h2>
              <p className="text-text-secondary mb-6 leading-relaxed text-lg">
                 Fall-Detect surgió de una necesidad personal: proteger a nuestros mayores que viven solos sin recurrir a sistemas invasivos o costosos.
              </p>
              <p className="text-text-secondary leading-relaxed text-lg">
                 Hoy, nos especializamos en tecnología asistencial doméstica, adaptando la innovación a la vida diaria.
              </p>
           </div>

           <div className="space-y-6">
              <div className="glass-panel p-8 flex gap-6 items-center hover:bg-bg-elevated transition-colors">
                 <div className="bg-indigo-600/10 p-4 rounded-2xl text-indigo-400">
                    <Heart size={32} />
                 </div>
                 <div>
                    <h3 className="font-bold text-2xl text-text-primary">Misión</h3>
                    <p className="text-text-secondary">Tranquilidad familiar mediante tecnología accesible.</p>
                 </div>
              </div>

              <div className="glass-panel p-8 flex gap-6 items-center hover:bg-bg-elevated transition-colors">
                 <div className="bg-cyan-600/10 p-4 rounded-2xl text-cyan-400">
                    <Users size={32} />
                 </div>
                 <div>
                    <h3 className="font-bold text-2xl text-text-primary">Valores</h3>
                    <p className="text-text-secondary">Confiabilidad clínica y honestidad de datos.</p>
                 </div>
              </div>

              <div className="glass-panel p-8 flex gap-6 items-center hover:bg-bg-elevated transition-colors">
                 <div className="bg-emerald-600/10 p-4 rounded-2xl text-emerald-400">
                    <ShieldCheck size={32} />
                 </div>
                 <div>
                    <h3 className="font-bold text-2xl text-text-primary">Seguridad</h3>
                    <p className="text-text-secondary">Enfoque 100% en la privacidad del entorno doméstico.</p>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Call to Action Final */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="glass-panel p-16 text-center space-y-8 bg-gradient-to-b from-bg-secondary to-bg-primary">
           <h2 className="text-4xl font-bold text-text-primary tracking-tight">¿Quieres conocer al equipo?</h2>
           <Link 
             to="/contact" 
             className={`inline-block px-12 py-4 rounded-full font-bold text-lg hover:scale-105 transition-all ${
               theme === 'dark' 
                 ? 'bg-white text-black' 
                 : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
             }`}
           >
              Contactar ahora
           </Link>
        </div>
      </div>
    </div>
  );
};

export default About;