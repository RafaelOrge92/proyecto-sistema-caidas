import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { Heart, Users, Home } from 'lucide-react';

const About: React.FC = () => {
  return (
    <div className="pt-12 pb-20">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-text-main mb-6">Sobre Fall-Detect</h1>
          <p className="text-xl text-text-muted leading-relaxed">
            Nacimos con una idea simple: la tecnología debe servir para cuidar a las personas que queremos, sin complicaciones y con total fiabilidad.
          </p>
        </div>
      </div>

      {/* Story */}
      <div className="bg-white max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
           <div className="bg-surface/50 rounded-2xl p-8 md:p-12 h-full flex flex-col justify-center">
              <h2 className="text-2xl font-bold mb-4">Nuestra Historia</h2>
              <p className="text-text-muted mb-4 leading-relaxed">
                 Fall-Detect surgió de una necesidad personal. Al buscar soluciones para nuestros propios familiares mayores que vivían solos, encontramos sistemas complejos, caros o pensados exclusivamente para residencias geriátricas.
              </p>
              <p className="text-text-muted leading-relaxed">
                 Decidimos crear una solución enfocada en el hogar: respetuosa con la privacidad, fácil de instalar por cualquier persona y, sobre todo, fiable en el momento crítico.
              </p>
           </div>
           <div className="space-y-6">
              <div className="flex gap-4">
                 <div className="bg-blue-50 p-3 rounded-lg h-fit">
                    <Heart className="text-primary" size={24} />
                 </div>
                 <div>
                    <h3 className="font-bold text-lg">Misión</h3>
                    <p className="text-text-muted">Proporcionar tranquilidad a las familias mediante tecnología de asistencia accesible y efectiva.</p>
                 </div>
              </div>
              <div className="flex gap-4">
                 <div className="bg-blue-50 p-3 rounded-lg h-fit">
                    <Users className="text-primary" size={24} />
                 </div>
                 <div>
                    <h3 className="font-bold text-lg">Valores</h3>
                    <p className="text-text-muted">Confiabilidad clínica, simplicidad de uso y honestidad en el tratamiento de los datos.</p>
                 </div>
              </div>
              <div className="flex gap-4">
                 <div className="bg-blue-50 p-3 rounded-lg h-fit">
                    <Home className="text-primary" size={24} />
                 </div>
                 <div>
                    <h3 className="font-bold text-lg">Enfoque</h3>
                    <p className="text-text-muted">Especializados 100% en el entorno doméstico, adaptando la tecnología a la vida diaria.</p>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gray-50 border-y border-border py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
           <h2 className="text-2xl font-bold mb-6">¿Quieres saber más sobre nuestro equipo o tecnología?</h2>
           <Link to="/contact">
              <Button>Contactar con el equipo</Button>
           </Link>
        </div>
      </div>
    </div>
  );
};

export default About;