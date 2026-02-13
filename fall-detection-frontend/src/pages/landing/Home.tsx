import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, BellRing, CheckCircle2, Wifi, Shield, Heart, ArrowRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const Home: React.FC = () => {
  const { theme } = useTheme();
  
  return (
    <div className="bg-[var(--color-bg-primary)] overflow-x-hidden">
      
      {/* Hero Section - Estilo Cinematic */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 pb-32 px-6 reveal">
        <div className="max-w-5xl mx-auto text-center z-10">
          <span className="inline-block px-4 py-1.5 mb-8 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-bold tracking-wide uppercase">
            Tecnología Asistencial de Próxima Generación
          </span>
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-text-primary mb-8 leading-[1.1]">
            Cuidar es estar <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-indigo-400 to-purple-600">
              siempre presente.
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-[var(--color-text-secondary)] max-w-2xl mx-auto mb-12 leading-relaxed">
            Detección de caídas inteligente en tiempo real. Máxima fiabilidad con el diseño más discreto para el hogar.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link 
              to="/contact" 
              className={`py-3 px-10 rounded-lg font-semibold flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:ring-offset-2 focus:ring-offset-bg-primary transition-all duration-300 hover-lift shadow-lg ${
                theme === 'dark' 
                  ? 'bg-white text-black hover:bg-gray-200' 
                  : 'bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white hover:from-[#818CF8] hover:to-[#A78BFA] hover:scale-105 shadow-indigo-500/30'
              }`}
            >
              Empezar ahora
            </Link>
            <a 
              href="#features" 
              className={`py-3 px-10 rounded-lg font-semibold flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:ring-offset-2 focus:ring-offset-bg-primary transition-all duration-300 hover-lift shadow-lg ${
                theme === 'dark' 
                  ? 'bg-white text-black hover:bg-gray-200' 
                  : 'bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white hover:from-[#818CF8] hover:to-[#A78BFA] hover:scale-105 shadow-indigo-500/30'
              }`}
            >
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
            <h3 className="text-4xl font-bold mb-4 text-text-primary">Detección Precisa</h3>
            <p className="text-xl text-[var(--color-text-secondary)] max-w-lg">
              Algoritmos avanzados que distinguen entre movimientos cotidianos y caídas accidentales con una precisión del 99.9%.
            </p>
          </div>

          <div className="md:col-span-4 glass-panel p-12 bg-gradient-to-br from-indigo-600 to-purple-700 border-none">
            <BellRing size={48} className="text-text-primary mb-8" strokeWidth={2.5} />
            <h3 className="text-4xl font-bold mb-4 text-text-primary">Alertas Instantáneas</h3>
            <p className="text-xl text-[var(--color-text-secondary)]">
              Notificaciones críticas que ignoran el modo "No molestar" para asegurar que la familia actúe a tiempo.
            </p>
          </div>

          <div className="md:col-span-4 glass-panel p-12">
            <Wifi size={40} className="text-cyan-400 mb-6" />
            <h4 className="text-2xl font-bold mb-2 text-text-primary">Siempre Online</h4>
            <p className="text-[var(--color-text-secondary)]">Monitorización constante de la conexión WiFi y estado de batería.</p>
          </div>

          <div className="md:col-span-4 glass-panel p-12">
            <Shield size={40} className="text-emerald-400 mb-6" />
            <h4 className="text-2xl font-bold mb-2 text-text-primary">Privacidad Total</h4>
            <p className="text-[var(--color-text-secondary)]">Cifrado de extremo a extremo. Los datos de movimiento nunca salen de tu red privada.</p>
          </div>

          <div className="md:col-span-4 glass-panel p-12">
            <Heart size={40} className="text-pink-500 mb-6" />
            <h4 className="text-2xl font-bold mb-2 text-text-primary">Familiar</h4>
            <p className="text-[var(--color-text-secondary)]">Diseñado para ser configurado por cualquier miembro de la familia en minutos.</p>
          </div>
        </div>
      </section>

      {/* Testimonios Section */}
      <section className="max-w-7xl mx-auto px-6 py-32">
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-6xl font-bold text-text-primary mb-6">Historias de Confianza</h2>
          <p className="text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto">
            Las familias que nos confían el cuidado de sus seres queridos cuentan sus experiencias.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              name: 'María García López',
              role: 'Hija de Rosa',
              content: 'Fall Detect me da la tranquilidad de que mi madre está protegida en su hogar. Las alertas son rápidas y el diseño es tan discreto que ella ni se da cuenta que lo lleva.',
              rating: 5
            },
            {
              name: 'Juan Martínez',
              role: 'Cuidador Profesional',
              content: 'En mi experiencia cuidando a personas mayores, este sistema es una herramienta revolucionaria. He visto cómo salva vidas realmente.',
              rating: 5
            },
            {
              name: 'Isabel Rodríguez',
              role: 'Paciente',
              content: 'Me da libertad para vivir mi vida sin que mis hijos se preocupen constantemente. Vivo solo y me siento seguro.',
              rating: 5
            }
          ].map((testimonial, index) => (
            <div key={index} className="glass-panel p-8 flex flex-col hover:bg-[var(--color-bg-elevated)] transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:-translate-y-2">
              <div className="flex gap-1 mb-6">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-xl">★</span>
                ))}
              </div>
              <p className="text-lg text-[var(--color-text-secondary)] mb-8 flex-grow leading-relaxed">
                "{testimonial.content}"
              </p>
              <div className="border-t border-border pt-6">
                <p className="font-bold text-text-primary text-lg">{testimonial.name}</p>
                <p className="text-[var(--color-text-secondary)] text-sm">{testimonial.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-6xl mx-auto px-6 py-32 text-center">
        <div className="glass-panel p-16 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/20">
          <h2 className="text-5xl font-bold text-text-primary mb-6">¿Listo para proteger a tu familia?</h2>
          <p className="text-xl text-[var(--color-text-secondary)] mb-10 max-w-2xl mx-auto">
            Únete a miles de familias que ya confían en Fall Detect para el cuidado de sus seres queridos.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link to="/register" className="bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white py-3 px-10 rounded-lg font-semibold flex items-center justify-center gap-2 hover:from-[#818CF8] hover:to-[#A78BFA] focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:ring-offset-2 focus:ring-offset-bg-primary transition-all duration-300 hover-lift shadow-lg glow-primary">
              Crear Cuenta Gratis
            </Link>
            <Link to="/contact" className="bg-gradient-to-r from-[#6366F1]/80 to-[#8B5CF6]/80 text-white py-3 px-10 rounded-lg font-semibold flex items-center justify-center gap-2 hover:from-[#818CF8] hover:to-[#A78BFA] focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:ring-offset-2 focus:ring-offset-bg-primary transition-all duration-300 hover-lift shadow-lg">
              Contactar Ventas
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;