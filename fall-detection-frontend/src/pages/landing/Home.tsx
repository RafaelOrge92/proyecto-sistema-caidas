import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Activity, 
  BellRing, 
  CheckCircle2, 
  Wifi, 
  Shield, 
  Clock, 
  Heart,
  History,
  Smartphone,
  Home as HomeIcon,
  ArrowRight
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Accordion, { AccordionItem } from '../../components/ui/Accordion';

const Home: React.FC = () => {
  return (
    <div className="space-y-20 pb-20">
      
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-24 lg:pb-32 bg-gradient-to-b from-white to-surface/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <Badge>Tecnología asistencial para el hogar</Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-main tracking-tight leading-tight">
                Detección de caídas en tiempo real para <span className="text-primary">cuidar con tranquilidad.</span>
              </h1>
              <p className="text-lg md:text-xl text-text-muted leading-relaxed max-w-2xl">
                Sistema inteligente que envía alertas inmediatas y registra eventos críticos, permitiendo que la familia actúe rápido cuando más importa.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link to="/contact">
                  <Button className="w-full sm:w-auto text-lg px-8">Contactar</Button>
                </Link>
                <a href="#como-funciona">
                  <Button variant="outline" className="w-full sm:w-auto text-lg px-8">Cómo funciona</Button>
                </a>
              </div>
            </div>
            
            {/* Abstract visual */}
            <div className="relative flex justify-center items-center lg:justify-end">
              <div className="relative w-full max-w-md aspect-square">
                {/* Decorative circles */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-200/20 rounded-full blur-3xl -z-10"></div>
                
                <div className="w-full h-full bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl shadow-xl flex flex-col items-center justify-center p-8 relative">
                   <div className="w-24 h-24 bg-surface rounded-full flex items-center justify-center mb-6 text-primary shadow-inner">
                      <Activity size={48} strokeWidth={1.5} />
                   </div>
                   <div className="space-y-4 w-full max-w-xs">
                      <div className="h-2 bg-gray-100 rounded w-3/4 mx-auto overflow-hidden">
                        <div className="h-full bg-primary/30 w-1/2 rounded animate-[pulse_2s_infinite]"></div>
                      </div>
                      <div className="h-2 bg-gray-100 rounded w-1/2 mx-auto"></div>
                      <div className="pt-6 flex justify-center gap-4">
                         <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 border border-green-100">
                            <CheckCircle2 size={20} />
                         </div>
                         <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-primary border border-border">
                            <Wifi size={20} />
                         </div>
                         <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-primary border border-border">
                            <BellRing size={20} />
                         </div>
                      </div>
                   </div>
                   <div className="absolute bottom-6 text-sm text-text-muted font-medium bg-white px-4 py-1 rounded-full shadow-sm border border-border">
                      Estado: Monitorizando
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. How it works */}
      <section id="como-funciona" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="text-center mb-16">
           <h2 className="text-3xl font-bold text-text-main mb-4">¿Cómo funciona Fall-Detect?</h2>
           <p className="text-text-muted max-w-2xl mx-auto">Un proceso sencillo y automático diseñado para minimizar los tiempos de respuesta ante una emergencia.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
           {/* Connecting line for desktop */}
           <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-border via-primary/30 to-border -z-10"></div>

           <div className="flex flex-col items-center text-center space-y-4 bg-white p-6 rounded-lg">
              <div className="w-24 h-24 bg-surface rounded-full flex items-center justify-center text-primary border-4 border-white shadow-sm z-10">
                 <Activity size={36} />
              </div>
              <h3 className="text-xl font-semibold">1. Detecta</h3>
              <p className="text-text-muted">Nuestros sensores analizan el movimiento en tiempo real para identificar patrones de caída brusca.</p>
           </div>

           <div className="flex flex-col items-center text-center space-y-4 bg-white p-6 rounded-lg">
              <div className="w-24 h-24 bg-surface rounded-full flex items-center justify-center text-primary border-4 border-white shadow-sm z-10">
                 <BellRing size={36} />
              </div>
              <h3 className="text-xl font-semibold">2. Notifica</h3>
              <p className="text-text-muted">El sistema envía una alerta inmediata a los cuidadores o familiares designados a través de la app.</p>
           </div>

           <div className="flex flex-col items-center text-center space-y-4 bg-white p-6 rounded-lg">
              <div className="w-24 h-24 bg-surface rounded-full flex items-center justify-center text-primary border-4 border-white shadow-sm z-10">
                 <CheckCircle2 size={36} />
              </div>
              <h3 className="text-xl font-semibold">3. Registra</h3>
              <p className="text-text-muted">El evento queda registrado. Se puede confirmar la emergencia o marcar como falsa alarma para mejorar el sistema.</p>
           </div>
        </div>
      </section>

      {/* 3. Benefits */}
      <section className="bg-surface/30 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-text-main mb-4">Beneficios pensados para el cuidado</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
             <Card className="hover:border-primary/50 transition-colors">
                <Clock className="text-primary mb-4" size={32} />
                <h4 className="text-lg font-bold mb-2">Respuesta Rápida</h4>
                <p className="text-text-muted text-sm">Reduce el tiempo de atención tras una caída, factor crítico para la recuperación.</p>
             </Card>
             <Card className="hover:border-primary/50 transition-colors">
                <Heart className="text-primary mb-4" size={32} />
                <h4 className="text-lg font-bold mb-2">Tranquilidad Familiar</h4>
                <p className="text-text-muted text-sm">Saber que recibirás un aviso al instante permite vivir con menos preocupación.</p>
             </Card>
             <Card className="hover:border-primary/50 transition-colors">
                <History className="text-primary mb-4" size={32} />
                <h4 className="text-lg font-bold mb-2">Historial de Incidentes</h4>
                <p className="text-text-muted text-sm">Registro detallado para compartir con profesionales médicos si es necesario.</p>
             </Card>
             <Card className="hover:border-primary/50 transition-colors">
                <Shield className="text-primary mb-4" size={32} />
                <h4 className="text-lg font-bold mb-2">Instalación Sencilla</h4>
                <p className="text-text-muted text-sm">Dispositivos preconfigurados listos para usar en el entorno doméstico.</p>
             </Card>
             <Card className="hover:border-primary/50 transition-colors">
                <Wifi className="text-primary mb-4" size={32} />
                <h4 className="text-lg font-bold mb-2">Estado del Dispositivo</h4>
                <p className="text-text-muted text-sm">Monitorización constante de conectividad y batería para asegurar el funcionamiento.</p>
             </Card>
             <Card className="hover:border-primary/50 transition-colors">
                <HomeIcon className="text-primary mb-4" size={32} />
                <h4 className="text-lg font-bold mb-2">Enfoque Hogar</h4>
                <p className="text-text-muted text-sm">Diseñado específicamente para domicilios particulares, no solo entornos clínicos.</p>
             </Card>
          </div>
        </div>
      </section>

      {/* 4. Credibility / Sources */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl border border-border p-8 md:p-12 lg:flex lg:items-center lg:justify-between shadow-sm">
           <div className="lg:w-2/3 space-y-4">
              <h2 className="text-2xl font-bold text-text-main">La importancia de la prevención</h2>
              <p className="text-text-muted leading-relaxed">
                 Las caídas son un problema de salud pública relevante en la población mayor. Diversas organizaciones internacionales publican guías y datos que subrayan la importancia de una detección temprana y una actuación rápida para mitigar consecuencias graves.
              </p>
              <p className="text-sm text-text-muted italic">
                 Consulte las fuentes oficiales en el pie de página (OMS, CDC, NICE).
              </p>
           </div>
           <div className="mt-8 lg:mt-0 lg:w-1/3 flex justify-center lg:justify-end">
              <ShieldCheck className="text-primary/20 w-32 h-32" />
           </div>
        </div>
      </section>

      {/* 5. Privacy */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
               <h2 className="text-3xl font-bold mb-6">Privacidad y Seguridad</h2>
               <p className="text-text-muted mb-8">Sabemos que instalamos tecnología en su espacio más íntimo: su hogar. Por eso, la seguridad de sus datos es nuestra prioridad.</p>
               
               <ul className="space-y-4">
                  {[
                    "Cifrado de datos en tránsito y en reposo.",
                    "Acceso exclusivo para dispositivos familiares vinculados.",
                    "Recogida mínima de datos necesarios para la alerta.",
                    "Control total por parte del administrador familiar."
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                       <CheckCircle2 className="text-green-500 flex-shrink-0 mt-0.5" size={20} />
                       <span className="text-text-main font-medium">{item}</span>
                    </li>
                  ))}
               </ul>
            </div>
            <div className="order-1 lg:order-2 bg-surface rounded-2xl p-8 flex items-center justify-center">
                <div className="bg-white p-6 rounded-xl shadow-lg border border-border max-w-sm w-full">
                    <div className="flex items-center gap-3 mb-4 border-b border-gray-100 pb-4">
                       <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                          <Shield size={20} />
                       </div>
                       <div>
                          <p className="font-semibold text-sm">Conexión Segura</p>
                          <p className="text-xs text-text-muted">TLS 1.3 / AES-256</p>
                       </div>
                    </div>
                    <div className="space-y-3">
                       <div className="h-2 bg-gray-100 rounded w-full"></div>
                       <div className="h-2 bg-gray-100 rounded w-5/6"></div>
                       <div className="h-2 bg-gray-100 rounded w-4/6"></div>
                    </div>
                </div>
            </div>
         </div>
      </section>

      {/* 6. Testimonials */}
      <section className="bg-gray-50 py-20">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12">Lo que dicen las familias</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <Card className="bg-white">
                  <p className="text-text-muted italic mb-6">"La tranquilidad de saber que si pasa algo me enteraré al momento no tiene precio. La instalación fue mucho más sencilla de lo que esperaba."</p>
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-primary">MC</div>
                     <div>
                        <p className="font-semibold text-sm">María Carmen L.</p>
                        <p className="text-xs text-text-muted">Hija de usuaria</p>
                     </div>
                  </div>
               </Card>
               <Card className="bg-white">
                  <p className="text-text-muted italic mb-6">"Buscábamos algo que no fuera invasivo para mi padre. Fall-Detect cumple perfectamente, es discreto y efectivo."</p>
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center font-bold text-green-700">AR</div>
                     <div>
                        <p className="font-semibold text-sm">Antonio R.</p>
                        <p className="text-xs text-text-muted">Usuario particular</p>
                     </div>
                  </div>
               </Card>
               <Card className="bg-white">
                  <p className="text-text-muted italic mb-6">"Tuvimos una falsa alarma al principio, pero el soporte nos ayudó a calibrarlo. Desde entonces funciona perfecto."</p>
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center font-bold text-purple-700">LP</div>
                     <div>
                        <p className="font-semibold text-sm">Lucía P.</p>
                        <p className="text-xs text-text-muted">Cuidadora familiar</p>
                     </div>
                  </div>
               </Card>
            </div>
         </div>
      </section>

      {/* 7. FAQ */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
         <h2 className="text-3xl font-bold text-center mb-12">Preguntas Frecuentes</h2>
         <Accordion>
            <AccordionItem title="¿Se necesita conexión WiFi?">
               Sí, el dispositivo base requiere conexión a internet vía WiFi para poder transmitir las alertas en tiempo real a la aplicación de los familiares.
            </AccordionItem>
            <AccordionItem title="¿Qué pasa si se corta la conexión?">
               El sistema monitoriza el estado del dispositivo. Si la conexión se pierde, recibirá una notificación en su teléfono indicando que el dispositivo está "offline" para que pueda revisarlo.
            </AccordionItem>
            <AccordionItem title="¿Quién puede ver las alertas?">
               Solo los usuarios autorizados por el administrador de la cuenta (normalmente un familiar) pueden recibir alertas y acceder al historial.
            </AccordionItem>
            <AccordionItem title="¿Se puede marcar una falsa alarma?">
               Sí. Si el sistema detecta una caída que no lo es, el usuario o el familiar pueden indicar en la app que "estoy bien" o clasificarlo como falsa alarma para que el sistema aprenda.
            </AccordionItem>
            <AccordionItem title="¿Cómo se instala?">
               El kit viene preconfigurado. Solo necesita enchufar el dispositivo, descargar la app y seguir 3 sencillos pasos para conectarlo a su red WiFi.
            </AccordionItem>
            <AccordionItem title="¿Sirve para hogares particulares?">
               Absolutamente. Fall-Detect está diseñado específicamente para entornos domésticos, priorizando la privacidad y la facilidad de uso frente a soluciones hospitalarias complejas.
            </AccordionItem>
         </Accordion>
      </section>

      {/* 8. CTA Final */}
      <section className="bg-surface py-16 mt-12">
         <div className="max-w-4xl mx-auto px-4 text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-text-main">¿Quieres probar Fall-Detect?</h2>
            <p className="text-lg text-text-muted">Contacta con nosotros para más información o accede si ya eres cliente.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
               <Link to="/contact">
                  <Button className="px-8 py-3 w-full sm:w-auto">Contactar ahora</Button>
               </Link>
               <Link to="/access">
                  <Button variant="outline" className="px-8 py-3 bg-white w-full sm:w-auto">Acceso Clientes</Button>
               </Link>
            </div>
         </div>
      </section>

    </div>
  );
};

export default Home;

// Helper component import fix
import { ShieldCheck } from 'lucide-react';