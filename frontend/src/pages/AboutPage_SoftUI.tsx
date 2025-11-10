import React from 'react';
import { Container } from '../components/ui/Container';

export const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-soft-gradient-light">
      <div className="py-24">
        <Container>
          <div className="max-w-5xl mx-auto">
            {/* Header Section - Soft UI 2.0 */}
            <div className="text-center mb-16 animate-slide-up">
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/80 backdrop-blur-soft rounded-full shadow-soft-sm border border-white/40 mb-8">
                <span className="text-2xl">🔥</span>
                <span className="text-primary-600 font-semibold text-sm tracking-wide uppercase">Conoce ACA Chile</span>
              </div>
              
              <h1 className="text-5xl font-bold mb-6 text-neutral-900 lg:text-6xl">
                Quiénes <span className="bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">Somos</span>
              </h1>
              
              <p className="text-xl text-neutral-600 font-light max-w-3xl mx-auto leading-relaxed">
                Una comunidad apasionada que celebra la tradición del asado chileno y la camaradería en torno al fuego.
              </p>
            </div>

            {/* Contenido Principal */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
              {/* Contenido de texto */}
              <div className="lg:col-span-8 space-y-8">
                {/* Tarjeta principal de bienvenida */}
                <div className="bg-white/60 backdrop-blur-soft rounded-3xl p-8 shadow-soft-lg border border-white/30 animate-slide-in-left">
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0 w-16 h-16 bg-primary-500/10 rounded-2xl flex items-center justify-center">
                      <span className="text-3xl">👋</span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-neutral-800 mb-4">
                        Te damos la bienvenida a la <span className="text-primary-600">ASOCIACIÓN CHILENA DE ASADORES (ACA)</span>
                      </h2>
                      <p className="text-lg leading-relaxed text-neutral-600 font-light">
                        ACA es una asociación de Asadores en donde nos reunimos amantes de los fuegos,
                        las brasas y la parrilla.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Información legal y estructura */}
                <div className="bg-soft-gradient-glass backdrop-blur-soft rounded-3xl p-8 shadow-soft-lg border border-white/30 animate-slide-in-left" style={{ animationDelay: '0.1s' }}>
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0 w-16 h-16 bg-pastel-blue rounded-2xl flex items-center justify-center">
                      <span className="text-3xl">🏛️</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-neutral-800 mb-4">
                        Organización Legal
                      </h3>
                      <p className="text-lg leading-relaxed text-neutral-600 font-light mb-4">
                        ACA es una asociación <span className="font-semibold text-primary-600">sin fines de lucro</span>, 
                        legalmente constituida según los registros de Servicio de Registro Civil e Identificación 
                        y con asociados a lo largo de todo Chile.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Objetivos y filosofía */}
                <div className="bg-white/60 backdrop-blur-soft rounded-3xl p-8 shadow-soft-lg border border-white/30 animate-slide-in-left" style={{ animationDelay: '0.2s' }}>
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0 w-16 h-16 bg-pastel-green rounded-2xl flex items-center justify-center">
                      <span className="text-3xl">🎯</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-neutral-800 mb-4">
                        Nuestro Objetivo
                      </h3>
                      <p className="text-lg leading-relaxed text-neutral-600 font-light mb-4">
                        Nuestro principal objetivo es <span className="font-semibold text-primary-600">compartir sanamente en torno al fuego</span> 
                        y juntos hacer crecer el movimiento parrillero nacional de la mano de nuestros asociados, 
                        los que van desde expertos asadores hasta asadores principiantes.
                      </p>
                      <div className="bg-primary-50/50 rounded-2xl p-4 border border-primary-100/50">
                        <p className="text-base text-primary-700 font-medium">
                          💡 ACA no exige destreza ni experiencia parrillera, solo ganas y entusiasmo.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Valores y comunidad */}
                <div className="bg-soft-gradient-glass backdrop-blur-soft rounded-3xl p-8 shadow-soft-lg border border-white/30 animate-slide-in-left" style={{ animationDelay: '0.3s' }}>
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0 w-16 h-16 bg-pastel-purple rounded-2xl flex items-center justify-center">
                      <span className="text-3xl">🤝</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-neutral-800 mb-4">
                        Nuestra Comunidad
                      </h3>
                      <p className="text-lg leading-relaxed text-neutral-600 font-light mb-4">
                        Esta asociación la hacen sus socios, quienes velamos que sean personas de 
                        <span className="font-semibold text-primary-600"> buenas intenciones</span> 
                        y que tengan las ganas de recorrer junto a nosotros el camino de la búsqueda 
                        de la <span className="font-semibold text-primary-600">identidad del asado Chileno</span>.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Historia y tradición */}
                <div className="bg-white/60 backdrop-blur-soft rounded-3xl p-8 shadow-soft-lg border border-white/30 animate-slide-in-left" style={{ animationDelay: '0.4s' }}>
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0 w-16 h-16 bg-pastel-orange rounded-2xl flex items-center justify-center">
                      <span className="text-3xl">📚</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-neutral-800 mb-4">
                        Tradición y Cultura
                      </h3>
                      <p className="text-lg leading-relaxed text-neutral-600 font-light">
                        Creemos que el asado va más allá de cocinar carne: es una 
                        <span className="font-semibold text-primary-600"> tradición que une familias</span>, 
                        forja amistades y preserva nuestra cultura gastronómica chilena para las futuras generaciones.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar con elementos visuales */}
              <div className="lg:col-span-4 space-y-8">
                {/* Estadísticas */}
                <div className="bg-white/60 backdrop-blur-soft rounded-3xl p-6 shadow-soft-lg border border-white/30 animate-slide-in-right">
                  <h4 className="text-lg font-bold text-neutral-800 mb-6 text-center">
                    ACA en Números
                  </h4>
                  <div className="space-y-4">
                    {[
                      { icon: '👥', label: 'Miembros Activos', value: '500+' },
                      { icon: '🏆', label: 'Eventos Realizados', value: '150+' },
                      { icon: '🌎', label: 'Ciudades', value: '25+' },
                      { icon: '🥩', label: 'Asados Compartidos', value: '1000+' }
                    ].map((stat, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white/40 rounded-xl border border-white/20">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{stat.icon}</span>
                          <span className="text-sm font-medium text-neutral-700">{stat.label}</span>
                        </div>
                        <span className="text-xl font-bold text-primary-600">{stat.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Call to action */}
                <div className="bg-primary-50/50 backdrop-blur-soft rounded-3xl p-6 shadow-soft-lg border border-primary-100/30 animate-slide-in-right" style={{ animationDelay: '0.1s' }}>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">🔥</span>
                    </div>
                    <h4 className="text-lg font-bold text-neutral-800 mb-3">
                      ¿Te interesa unirte?
                    </h4>
                    <p className="text-sm text-neutral-600 mb-6">
                      Forma parte de nuestra comunidad de asadores apasionados
                    </p>
                    <button 
                      className="w-full px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-soft-colored-red hover:shadow-soft-lg"
                      onClick={() => window.open('https://docs.google.com/forms/d/e/1FAIpQLScm_pK1mysojBZGSNODV2RY0CT1DwNg06Eqhc1aoO5D7l4M6g/viewform', '_blank')}
                    >
                      Únete Ahora
                    </button>
                  </div>
                </div>

                {/* Contacto */}
                <div className="bg-white/60 backdrop-blur-soft rounded-3xl p-6 shadow-soft-lg border border-white/30 animate-slide-in-right" style={{ animationDelay: '0.2s' }}>
                  <h4 className="text-lg font-bold text-neutral-800 mb-4 text-center">
                    Contáctanos
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-white/40 rounded-xl border border-white/20">
                      <span className="text-xl"></span>
                      <span className="text-sm text-neutral-700">info@acachile.com</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white/40 rounded-xl border border-white/20">
                      <span className="text-xl">📱</span>
                      <span className="text-sm text-neutral-700">@acachile</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </div>
    </div>
  );
};

export default AboutPage;