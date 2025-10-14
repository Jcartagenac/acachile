import React from 'react';

export const HomePage: React.FC = () => {
  const [imageLoaded, setImageLoaded] = React.useState<{[key: string]: boolean}>({});

  const handleImageLoad = (imageKey: string) => {
    setImageLoaded(prev => ({ ...prev, [imageKey]: true }));
  };

  const handleImageError = (imageKey: string, e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.log(`Error loading image: ${imageKey}`);
    setImageLoaded(prev => ({ ...prev, [imageKey]: false }));
    // Fallback to a placeholder
    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI0MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzM3NDE1MSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+8J+UpSBBQ0EgQ2hpbGU8L3RleHQ+PHRleHQgeD0iNTAlIiB5PSI2MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzZiNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+QXNhZG9yZXMgZGUgQ2hpbGU8L3RleHQ+PC9zdmc+';
  };

  React.useEffect(() => {
    console.log('HomePage renderizada - Estado de imágenes:', imageLoaded);
  }, [imageLoaded]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#e8ecf4' }}>
      {/* Debug Panel */}
      <div style={{ 
        position: 'fixed', 
        top: '10px', 
        right: '10px', 
        background: 'white', 
        padding: '10px', 
        borderRadius: '5px',
        fontSize: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        zIndex: 1000,
        maxWidth: '200px'
      }}>
        <strong>Estado de Imágenes:</strong><br/>
        {Object.keys(imageLoaded).length === 0 ? 'Sin cargar...' : 
         Object.entries(imageLoaded).map(([key, loaded]) => 
           `${key}: ${loaded ? '✅' : '❌'}`
         ).join(', ')}
      </div>

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
                    src="https://acachile.com/wp-content/uploads/2024/08/1697587321850-500x375.jpg"
                    alt="Evento ACA Chile - Asado tradicional"
                    onLoad={() => handleImageLoad('hero')}
                    onError={(e) => handleImageError('hero', e)}
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
                img: "https://acachile.com/wp-content/uploads/2025/03/64694334-bbdc-4e97-b4a7-ef75e6bbe50d-500x375.jpg",
                title: "Campeonato Nacional de Asadores",
                date: "15 Nov",
                type: "Campeonato"
              },
              {
                img: "https://acachile.com/wp-content/uploads/2024/08/post-alemania-500x375.jpg",
                title: "Fuego y Sabor desde Chile hasta Alemania",
                date: "22 Nov", 
                type: "Torneo"
              },
              {
                img: "https://acachile.com/wp-content/uploads/2025/06/post-_2025-12-500x375.png",
                title: "Taller: Salsas a la Parrilla",
                date: "30 Nov",
                type: "Taller"
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
                    onLoad={() => handleImageLoad(`evento-${index}`)}
                    onError={(e) => handleImageError(`evento-${index}`, e)}
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

      {/* Sección de Noticias */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold sm:text-4xl mb-4" style={{ color: '#374151' }}>
              Últimas Noticias ACA
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: '#4B5563' }}>
              Mantente al día con las últimas noticias de la Asociación Chilena de Asadores
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Noticia Principal */}
            <div 
              className="rounded-3xl p-8 transition-all duration-300 hover:transform hover:scale-105"
              style={{ 
                backgroundColor: '#e8ecf4',
                boxShadow: '15px 15px 30px #bec8d7, -15px -15px 30px #ffffff'
              }}
            >
              <div className="relative overflow-hidden rounded-2xl mb-6">
                <img
                  src="https://acachile.com/wp-content/uploads/2024/08/1697587321850-500x375.jpg"
                  alt="Chile Brilla en Campeonato Internacional"
                  className="w-full h-64 object-cover"
                  onLoad={() => handleImageLoad('noticia-principal')}
                  onError={(e) => handleImageError('noticia-principal', e)}
                />
              </div>
              <div className="space-y-4">
                <div className="flex items-center text-sm" style={{ color: '#6B7280' }}>
                  <span>15 de Septiembre, 2024</span>
                </div>
                <h3 className="text-2xl font-bold" style={{ color: '#374151' }}>
                  Chile Brilla en Campeonato Internacional
                </h3>
                <p className="leading-relaxed" style={{ color: '#4B5563' }}>
                  El equipo chileno "QUINTA PARRILLA" se quedó con el tercer lugar en una competencia 
                  reñida que reunió a los mejores parrilleros del continente.
                </p>
                <button 
                  className="px-6 py-3 rounded-xl text-white font-medium transition-all duration-300"
                  style={{ 
                    background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                    boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)'
                  }}
                >
                  Leer Más
                </button>
              </div>
            </div>

            {/* Lista de Noticias */}
            <div className="space-y-6">
              {[
                {
                  img: "https://acachile.com/wp-content/uploads/2024/08/post-alemania-500x375.jpg",
                  title: "ACA en el Mundial de Alemania",
                  date: "28 Jul 2024",
                  description: "Tres equipos chilenos compitieron en Stuttgart contra 106 equipos mundiales."
                },
                {
                  img: "https://acachile.com/wp-content/uploads/2025/03/64694334-bbdc-4e97-b4a7-ef75e6bbe50d-500x375.jpg",
                  title: "Rancagua Grill Festival",
                  date: "15 Mar 2025",
                  description: "Segunda fecha del Torneo de Asadores ACA en el evento corralero más importante."
                },
                {
                  img: "https://acachile.com/wp-content/uploads/2025/06/post-_2025-12-500x375.png",
                  title: "Taller de Salsas a la Parrilla",
                  date: "14 Jun 2025",
                  description: "Encuentro exclusivo con el maestro Pablo Ibáñez para socios ACA."
                }
              ].map((noticia, index) => (
                <div 
                  key={index}
                  className="rounded-2xl p-6 transition-all duration-300 hover:transform hover:scale-105"
                  style={{ 
                    backgroundColor: '#e8ecf4',
                    boxShadow: '10px 10px 20px #bec8d7, -10px -10px 20px #ffffff'
                  }}
                >
                  <div className="flex space-x-4">
                    <img
                      src={noticia.img}
                      alt={noticia.title}
                      className="w-20 h-20 object-cover rounded-xl flex-shrink-0"
                      style={{ boxShadow: 'inset 3px 3px 6px #bec8d7, inset -3px -3px 6px #ffffff' }}
                      onLoad={() => handleImageLoad(`noticia-${index}`)}
                      onError={(e) => handleImageError(`noticia-${index}`, e)}
                    />
                    <div className="flex-1">
                      <div className="text-sm mb-2" style={{ color: '#6B7280' }}>{noticia.date}</div>
                      <h4 className="font-bold mb-2" style={{ color: '#374151' }}>{noticia.title}</h4>
                      <p className="text-sm" style={{ color: '#4B5563' }}>{noticia.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};