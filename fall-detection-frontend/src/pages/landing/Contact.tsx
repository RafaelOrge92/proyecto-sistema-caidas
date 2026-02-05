import React, { useState } from 'react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { Mail, Phone, MapPin, CheckCircle } from 'lucide-react';

const Contact: React.FC = () => {
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('submitting');
    // Simulate API call
    setTimeout(() => {
      setFormStatus('success');
    }, 1500);
  };

  return (
    <div className="pt-12 pb-20 bg-gray-50 min-h-[calc(100vh-80px)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-text-main mb-4">Contacto</h1>
          <p className="text-text-muted max-w-2xl mx-auto">
            Estamos aquí para resolver tus dudas. Escríbenos y te responderemos lo antes posible.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Info Side */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="h-full">
              <h3 className="font-bold text-lg mb-6">Información</h3>
              
              <div className="space-y-6">
                <div className="flex items-start gap-3">
                  <Mail className="text-primary mt-1" size={20} />
                  <div>
                    <p className="font-medium text-sm">Email</p>
                    <p className="text-text-muted">info@fall-detect.example.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="text-primary mt-1" size={20} />
                  <div>
                    <p className="font-medium text-sm">Teléfono</p>
                    <p className="text-text-muted">+34 900 000 000</p>
                    <p className="text-xs text-text-muted">(Lunes a Viernes 9:00 - 18:00)</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="text-primary mt-1" size={20} />
                  <div>
                    <p className="font-medium text-sm">Oficinas</p>
                    <p className="text-text-muted">Madrid, España</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Form Side */}
          <div className="lg:col-span-2">
            <Card>
              {formStatus === 'success' ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto mb-4">
                    <CheckCircle size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-text-main mb-2">¡Mensaje enviado!</h3>
                  <p className="text-text-muted">Gracias por contactar con nosotros. Te responderemos en breve.</p>
                  <Button 
                    variant="outline" 
                    className="mt-8"
                    onClick={() => setFormStatus('idle')}
                  >
                    Enviar otro mensaje
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-text-main mb-1">Nombre</label>
                      <input 
                        type="text" 
                        id="name" 
                        required 
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Tu nombre"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-text-main mb-1">Email</label>
                      <input 
                        type="email" 
                        id="email" 
                        required 
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="tu@email.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-text-main mb-1">Asunto</label>
                    <select 
                      id="subject" 
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                    >
                      <option>Información general</option>
                      <option>Soporte técnico</option>
                      <option>Ventas / Presupuesto</option>
                      <option>Otros</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-text-main mb-1">Mensaje</label>
                    <textarea 
                      id="message" 
                      required 
                      rows={4} 
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                      placeholder="¿En qué podemos ayudarte?"
                    ></textarea>
                  </div>

                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="privacy"
                        name="privacy"
                        type="checkbox"
                        required
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="privacy" className="font-medium text-text-muted">
                        Acepto la política de privacidad y el tratamiento de mis datos para esta consulta.
                      </label>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    fullWidth 
                    disabled={formStatus === 'submitting'}
                  >
                    {formStatus === 'submitting' ? 'Enviando...' : 'Enviar mensaje'}
                  </Button>
                </form>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;