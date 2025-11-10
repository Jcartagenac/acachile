import React from 'react';
import { Container } from '../components/ui/Container';

export const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#e8ecf4' }}>
      <div className="py-20">
        <Container>
          <div className="max-w-4xl mx-auto">
            <div 
              className="rounded-3xl p-8 mb-12"
              style={{ 
                backgroundColor: '#e8ecf4',
                boxShadow: '20px 20px 40px #bec8d7, -20px -20px 40px #ffffff'
              }}
            >
              <h1 className="text-4xl font-bold mb-8 text-center" style={{ color: '#374151' }}>
                Quiénes somos
              </h1>
              
              <div className="space-y-8">
                <div 
                  className="rounded-2xl p-6"
                  style={{ 
                    backgroundColor: '#e8ecf4',
                    boxShadow: 'inset 10px 10px 20px #bec8d7, inset -10px -10px 20px #ffffff'
                  }}
                >
                  <p className="text-lg leading-relaxed mb-6" style={{ color: '#4B5563' }}>
                    Te damos la bienvenida a la <strong>ASOCIACION CHILENA DE ASADORES (ACA)</strong>.
                  </p>
                  <p className="text-lg leading-relaxed mb-6" style={{ color: '#4B5563' }}>
                    ACA es una asociación de Asadores en donde nos reunimos amantes de los fuegos,
                    las brasas y la parrilla.
                  </p>
                  <p className="text-lg leading-relaxed mb-6" style={{ color: '#4B5563' }}>
                    ACA es una asociación sin fines de lucro, legalmente constituida según los registros 
                    de Servicio de Registro Civil e Identificación y con asociados a lo largo de todo Chile.
                  </p>
                  <p className="text-lg leading-relaxed mb-6" style={{ color: '#4B5563' }}>
                    Nuestro principal objetivo es compartir sanamente en torno al fuego y juntos
                    hacer crecer el movimiento parrillero nacional de la mano de nuestros asociados,
                    los que van desde expertos asadores hasta asadores principiantes… ACA no exige
                    destreza ni experiencia parrillera, solo ganas y entusiasmo.
                  </p>
                  <p className="text-lg leading-relaxed mb-6" style={{ color: '#4B5563' }}>
                    Esta asociación la hacen sus socios, quienes velamos que sean personas de buenas
                    intenciones y que tengan las ganas de recorrer junto a nosotros el camino de la
                    búsqueda de la identidad del asado Chileno.
                  </p>
                  <p className="text-lg leading-relaxed" style={{ color: '#4B5563' }}>
                    Contamos con una serie de beneficios para los socios, lo que incluye descuentos
                    en comercios asociados, inscripciones a precios preferenciales a las
                    competencias de asadores del circuito nacional ACA y la posibilidad de asistir a clases
                    para todos los niveles dictadas durante el año.
                  </p>
                </div>

                <div 
                  className="rounded-3xl p-8"
                  style={{ 
                    backgroundColor: '#e8ecf4',
                    boxShadow: '15px 15px 30px #bec8d7, -15px -15px 30px #ffffff'
                  }}
                >
                  <h2 className="text-2xl font-bold mb-6" style={{ color: '#374151' }}>
                    Somos internacionales
                  </h2>
                  <p className="text-lg leading-relaxed mb-6" style={{ color: '#4B5563' }}>
                    Luego de un arduo, silencioso y transparente trabajo estamos orgullosos de ser
                    la única asociación nacional que pertenece a la <strong>CONFEDERACIÓN PANAMERICANA DE
                    ASADORES</strong> y a la <strong>WORLD BARBECUE ASSOCIATION (ASOCIACIÓN MUNDIAL DE ASADORES)</strong>.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    <div 
                      className="rounded-2xl p-6 text-center"
                      style={{ 
                        backgroundColor: 'white',
                        boxShadow: 'inset 8px 8px 16px #bec8d7, inset -8px -8px 16px #ffffff'
                      }}
                    >
                      <img
                        src="https://acachile.com/wp-content/uploads/2024/07/CONFEDERACION.png"
                        alt="Confederación Panamericana de Asadores"
                        className="w-full h-32 object-contain mb-4"
                      />
                      <h3 className="font-bold" style={{ color: '#374151' }}>
                        Confederación Panamericana
                      </h3>
                    </div>
                    <div 
                      className="rounded-2xl p-6 text-center"
                      style={{ 
                        backgroundColor: 'white',
                        boxShadow: 'inset 8px 8px 16px #bec8d7, inset -8px -8px 16px #ffffff'
                      }}
                    >
                      <img
                        src="https://acachile.com/wp-content/uploads/2024/07/BB.png"
                        alt="World Barbecue Association"
                        className="w-full h-32 object-contain mb-4"
                      />
                      <h3 className="font-bold" style={{ color: '#374151' }}>
                        World Barbecue Association
                      </h3>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-lg mb-8" style={{ color: '#4B5563' }}>
                    Si quieres pertenecer a ACA te invitamos a completar el formulario de solicitud
                    de incorporación y tendrás una respuesta dentro de las próximas 48 horas.
                  </p>
                  <button 
                    className="px-8 py-4 rounded-2xl text-white font-bold text-lg transition-all duration-300 transform hover:scale-105"
                    style={{ 
                      background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                      boxShadow: '0 10px 20px rgba(239, 68, 68, 0.3)'
                    }}
                    onClick={() => window.open('https://docs.google.com/forms/d/e/1FAIpQLScm_pK1mysojBZGSNODV2RY0CT1DwNg06Eqhc1aoO5D7l4M6g/viewform', '_blank')}
                  >
                    Únete a ACA
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </div>
    </div>
  );
};