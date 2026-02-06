import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, BellRing, CheckCircle2, Wifi, Shield, Heart, ArrowRight } from 'lucide-react';

const Home: React.FC = () => {
  return (
    <div className="bg-[var(--color-bg-primary)] overflow-x-hidden">
      
      {/* Hero Section - Estilo Cinematic */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 pb-32 px-6 reveal">
        <div className="max-w-5xl mx-auto text-center z-10">
          <span className="inline-block px-4 py-1.5 mb-8 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-bold tracking-wide uppercase">
            Tecnología Asistencial de Próxima Generación
          </span>
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-white mb-8 leading-[1.1]">
            Cuidar es estar <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-indigo-400 to-purple-600">
              siempre presente.
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-[var(--color-text-secondary)] max-w-2xl mx-auto mb-12 leading-relaxed">
            Detección de caídas inteligente en tiempo real. Máxima fiabilidad con el diseño más discreto para el hogar.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link to="/contact" className="bg-white text-black px-10 py-4 rounded-full font-bold text-lg hover:bg-gray-200 transition-all transform hover:scale-105">
              Empezar ahora
            </Link>
            <a href="#features" className="text-white px-10 py-4 rounded-full font-bold text-lg border border-white/20 hover:bg-white/5 transition-all flex items-center justify-center gap-2">
              Ver detalles <ArrowRight size={20} />
            </a>
          </div>
        </div>
        
        {/* Fondo con Luces Sutiles */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[120px] -z-10"></div>
      </section>

      {/* Grid de Características - Estilo Bento Box */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-32">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          <div className="md:col-span-8 glass-panel p-12 flex flex-col justify-end min-h-[400px] hover:bg-[var(--color-bg-elevated)] transition-colors">
            <Activity size={48} className="text-[var(--color-primary)] mb-8" />
            <h3 className="text-4xl font-bold mb-4">Detección Precisa</h3>
            <p className="text-xl text-[var(--color-text-secondary)] max-w-lg">
              Algoritmos avanzados que distinguen entre movimientos cotidianos y caídas accidentales con una precisión del 99.9%.
            </p>
          </div>

          <div className="md:col-span-4 glass-panel p-12 bg-gradient-to-br from-indigo-600 to-purple-700 border-none">
            <BellRing size={48} className="text-white mb-8" />
            <h3 className="text-4xl font-bold text-white mb-4">Alertas Instantáneas</h3>
            <p className="text-xl text-indigo-100">
              Notificaciones críticas que ignoran el modo "No molestar" para asegurar que la familia actúe a tiempo.
            </p>
          </div>

          <div className="md:col-span-4 glass-panel p-12">
            <Wifi size={40} className="text-cyan-400 mb-6" />
            <h4 className="text-2xl font-bold mb-2">Siempre Online</h4>
            <p className="text-[var(--color-text-secondary)]">Monitorización constante de la conexión WiFi y estado de batería.</p>
          </div>

          <div className="md:col-span-4 glass-panel p-12">
            <Shield size={40} className="text-emerald-400 mb-6" />
            <h4 className="text-2xl font-bold mb-2">Privacidad Total</h4>
            <p className="text-[var(--color-text-secondary)]">Cifrado de extremo a extremo. Los datos de movimiento nunca salen de tu red privada.</p>
          </div>

          <div className="md:col-span-4 glass-panel p-12">
            <Heart size={40} className="text-pink-500 mb-6" />
            <h4 className="text-2xl font-bold mb-2">Familiar</h4>
            <p className="text-[var(--color-text-secondary)]">Diseñado para ser configurado por cualquier miembro de la familia en minutos.</p>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;