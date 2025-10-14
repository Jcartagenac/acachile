import React from 'react';

export const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#e8ecf4' }}>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20">
        <div className="relative px-4 py-20 mx-auto max-w-7xl sm:px-6 lg:px-8 lg:py-32">
          <div className="lg:grid lg:grid-cols-12 lg:gap-12">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left lg:flex lg:flex-col lg:justify-center">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl" style={{ color: '#374151' }}>
                <span className="block">Bienvenidos a la</span>
                <span className="block mt-2" style={{ color: '#4B5563' }}>
                  Asociación Chilena de Asadores
                </span>
              </h1>
              <p className="mt-6 text-lg sm:mt-8 sm:text-xl leading-relaxed" style={{ color: '#4B5563' }}>
                Únete a la comunidad más apasionada del asado en Chile. 
                Comparte técnicas, recetas, eventos y vive la cultura de la parrilla.
              </p>
              <div className="mt-10 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0">
                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    className="px-8 py-4 rounded-2xl text-white font-bold text-lg transition-all duration-300 transform hover:scale-105"
                    style={{ 
                      background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                      boxShadow: '0 10px 20px rgba(239, 68, 68, 0.3)'
                    }}
                  >
                    Únete Ahora
                  </button>
                  <button 
                    className="px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300"
                    style={{ 
                      color: '#374151',
                      backgroundColor: 'white',
                      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    Ver Eventos
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-16 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
              <div 
                className="relative mx-auto w-full rounded-3xl p-2"
                style={{ 
                  backgroundColor: '#e8ecf4',
                  boxShadow: '20px 20px 40px #bec8d7, -20px -20px 40px #ffffff'
                }}
              >
                <div className="relative block w-full rounded-2xl overflow-hidden">
                  <img
                    className="w-full h-80 object-cover"
                    src="https://www.acachile.com/uploads/events/banners/banner-578-12052023_005737.jpeg"
                    alt="Evento ACA Chile - Asado tradicional"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                  <div className="absolute bottom-6 left-6 text-white">
                    <div 
                      className="backdrop-blur-sm rounded-xl px-4 py-3"
                      style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
                    >
                      <h3 className="font-bold text-lg">Campeonato Nacional</h3>
                      <p className="text-gray-200">Próximo evento destacado</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sección de Eventos */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold sm:text-4xl mb-4" style={{ color: '#374151' }}>
              Eventos Destacados
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: '#4B5563' }}>
              Descubre los próximos eventos de la comunidad ACA
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                img: "https://www.acachile.com/uploads/events/banners/banner-628-29092023_133028.jpeg",
                title: "Campeonato Nacional de Asadores",
                date: "15 Nov",
                type: "Campeonato"
              },
              {
                img: "https://www.acachile.com/uploads/events/banners/banner-632-04102023_171033.jpeg",
                title: "Taller de Técnicas de Parrilla",
                date: "22 Nov", 
                type: "Taller"
              },
              {
                img: "https://www.acachile.com/uploads/events/banners/banner-630-29092023_170941.jpeg",
                title: "Encuentro Regional",
                date: "30 Nov",
                type: "Encuentro"
              }
            ].map((evento, index) => (
              <div 
                key={index}
                className="rounded-3xl p-6 transition-all duration-300 hover:transform hover:scale-105"
                style={{ 
                  backgroundColor: '#e8ecf4',
                  boxShadow: '15px 15px 30px #bec8d7, -15px -15px 30px #ffffff'
                }}
              >
                <div className="relative overflow-hidden rounded-2xl mb-6">
                  <img
                    src={evento.img}
                    alt={evento.title}
                    className="w-full h-48 object-cover"
                  />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span 
                      className="px-3 py-1 rounded-full text-sm font-medium"
                      style={{ 
                        backgroundColor: '#EF4444', 
                        color: 'white',
                        boxShadow: '0 4px 10px rgba(239, 68, 68, 0.3)'
                      }}
                    >
                      {evento.type}
                    </span>
                    <span className="text-sm font-medium" style={{ color: '#6B7280' }}>
                      {evento.date}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold" style={{ color: '#374151' }}>
                    {evento.title}
                  </h3>
                  <button 
                    className="w-full py-3 rounded-xl font-medium transition-all duration-300"
                    style={{ 
                      color: '#374151',
                      boxShadow: 'inset 5px 5px 10px #bec8d7, inset -5px -5px 10px #ffffff'
                    }}
                  >
                    Ver Detalles
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};