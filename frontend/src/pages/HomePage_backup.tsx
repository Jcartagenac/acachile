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
    <div className="min-h-screen bg-soft-gradient-light">
      {/* Debug Panel - Soft UI Style */}
      <div className="fixed top-4 right-4 bg-white/80 backdrop-blur-soft px-4 py-3 rounded-2xl shadow-soft-md border border-white/20 z-50 max-w-xs">
        <div className="text-xs font-medium text-neutral-700">
          <span className="block font-semibold text-neutral-800 mb-2">Estado de Imágenes:</span>
          <div className="space-y-1">
            {Object.keys(imageLoaded).length === 0 ? (
              <span className="text-neutral-500">Sin cargar...</span>
            ) : (
              Object.entries(imageLoaded).map(([key, loaded]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-neutral-600">{key}:</span>
                  <span className={loaded ? 'text-green-500' : 'text-red-500'}>
                    {loaded ? '✅' : '❌'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Hero Section - Soft UI 2.0 */}
      <section className="relative overflow-hidden py-20 bg-soft-gradient-light">
        <div className="relative px-4 py-20 mx-auto max-w-7xl sm:px-6 lg:px-8 lg:py-32">
          <div className="lg:grid lg:grid-cols-12 lg:gap-16">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left lg:flex lg:flex-col lg:justify-center animate-slide-in-left">
              <div className="inline-block px-6 py-2 mb-6 bg-soft-gradient-primary rounded-full shadow-soft-sm border border-primary-100">
                <span className="text-primary-600 font-semibold text-sm tracking-wide uppercase">
                  🔥 Comunidad de Asadores
                </span>
              </div>
              
              <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl md:text-6xl lg:text-7xl">
                <span className="block bg-gradient-to-r from-primary-600 via-primary-500 to-primary-400 bg-clip-text text-transparent">
                  ACA
                </span>
                <span className="block mt-2 text-neutral-700 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light">
                  Asociación Chilena de Asadores
                </span>
              </h1>
              
              <p className="mt-8 text-xl sm:text-2xl leading-relaxed text-neutral-600 font-light">
                Una comunidad apasionada donde nos reunimos los 
                <span className="font-medium text-primary-600"> amantes de los fuegos</span>, 
                la parrilla y la buena compañía.
              </p>
              <div className="mt-12 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0">
                <div className="flex flex-col sm:flex-row gap-6">
                  <button 
                    className="group relative px-10 py-5 rounded-2xl text-white font-semibold text-lg transition-all duration-500 transform hover:scale-105 hover:-translate-y-1 overflow-hidden"
                    style={{ 
                      background: 'linear-gradient(135deg, #f56934 0%, #e04c1a 50%, #b93c14 100%)',
                      backgroundSize: '200% 200%',
                      animation: 'gradient-shift 3s ease-in-out infinite'
                    }}
                    onClick={() => window.open('https://docs.google.com/forms/d/e/1FAIpQLScm_pK1mysojBZGSNODV2RY0CT1DwNg06Eqhc1aoO5D7l4M6g/viewform', '_blank')}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    <span className="relative flex items-center gap-3">
                      🔥 Únete Ahora
                      <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                      </svg>
                    </span>
                  </button>
                  
                  <button 
                    className="px-10 py-5 rounded-2xl font-semibold text-lg transition-all duration-500 transform hover:scale-105 hover:-translate-y-1 bg-white/70 hover:bg-white/90 backdrop-blur-soft text-neutral-700 hover:text-neutral-900 shadow-soft-lg hover:shadow-soft-xl border border-white/30"
                  >
                    <span className="flex items-center gap-3">
                      📅 Ver Eventos
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                      </svg>
                    </span>
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-16 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center animate-slide-in-right">
              <div className="relative mx-auto w-full">
                {/* Contenedor principal con glassmorphism */}
                <div className="relative bg-white/20 backdrop-blur-medium rounded-3xl p-6 shadow-soft-2xl border border-white/30">
                  {/* Imagen principal */}
                  <div className="relative block w-full rounded-2xl overflow-hidden shadow-soft-lg">
                    <img
                      className="w-full h-80 object-cover transform hover:scale-105 transition-transform duration-700"
                      src="https://acachile.com/wp-content/uploads/2024/08/1697587321850-500x375.jpg"
                      alt="Evento ACA Chile - Asado tradicional"
                      onLoad={() => handleImageLoad('hero')}
                      onError={(e) => handleImageError('hero', e)}
                    />
                    
                    {/* Overlay con gradiente suave */}
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/60 via-neutral-900/20 to-transparent"></div>
                    
                    {/* Badge flotante */}
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-soft px-4 py-2 rounded-full shadow-soft-md border border-white/40">
                      <span className="text-primary-600 font-semibold text-sm">🏆 Evento Destacado</span>
                    </div>
                    
                    {/* Información inferior */}
                    <div className="absolute bottom-6 left-6 right-6 text-white">
                      <div className="bg-white/20 backdrop-blur-soft rounded-2xl px-6 py-4 border border-white/30 shadow-soft-lg">
                        <h3 className="font-bold text-lg mb-2">WBQA International BBQ Championship Chile 2025</h3>
                        <p className="text-white/90 text-sm flex items-center gap-2">
                          <span>📅</span>
                          29-30 Noviembre 2025 - Viña del Mar
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Elementos decorativos */}
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary-500/20 rounded-full blur-xl animate-soft-pulse"></div>
                  <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-pastel-blue/30 rounded-full blur-xl animate-soft-pulse" style={{ animationDelay: '1s' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Somos Internacionales - Soft UI 2.0 */}
      <section className="py-24 bg-soft-gradient-medium relative overflow-hidden">
        {/* Elementos decorativos de fondo */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl -translate-x-48 -translate-y-48"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-pastel-blue/20 rounded-full blur-3xl translate-x-48 translate-y-48"></div>
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="lg:grid lg:grid-cols-2 lg:gap-20 items-center">
            <div className="animate-slide-in-left">
              {/* Badge superior */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-soft rounded-full shadow-soft-sm border border-white/40 mb-6">
                <span className="text-2xl">🌍</span>
                <span className="text-primary-600 font-semibold text-sm">Presencia Internacional</span>
              </div>
              
              <h2 className="text-4xl font-bold sm:text-5xl mb-6 text-neutral-900">
                Somos 
                <span className="block bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
                  Internacionales
                </span>
              </h2>
              
              <div className="space-y-8">
                <div className="bg-white/60 backdrop-blur-soft rounded-2xl p-6 shadow-soft-lg border border-white/30">
                  <h3 className="text-xl font-bold text-neutral-800 mb-4 flex items-center gap-3">
                    <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                    ÚNETE A ACA
                  </h3>
                  <p className="text-lg leading-relaxed text-neutral-600 font-light">
                    El <span className="font-semibold text-primary-600">29 y 30 de noviembre de 2025</span>, 
                    el tradicional Sporting Club de Viña del Mar será el escenario de uno de los eventos 
                    más esperados del mundo parrillero. <span className="font-semibold">80 equipos</span> de 
                    <span className="font-semibold">40 países</span> de todo el mundo, competirán 
                    "Con toda la carne a la parrilla" por ser el mejor equipo.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 mt-6">
                    <button 
                      className="group relative px-8 py-4 rounded-2xl text-white font-semibold text-lg transition-all duration-500 transform hover:scale-105 hover:-translate-y-1 overflow-hidden bg-gradient-to-r from-primary-600 via-primary-500 to-primary-400 shadow-soft-colored-red hover:shadow-soft-lg"
                      onClick={() => window.open('https://wbqachile2025.cl/', '_blank')}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                      <span className="relative flex items-center gap-2">
                        🌟 Más info aquí
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-12 lg:mt-0 animate-slide-in-right">
              {/* Contenedor con efecto glassmorphism */}
              <div className="relative bg-white/20 backdrop-blur-medium rounded-3xl p-6 shadow-soft-2xl border border-white/30">
                <div className="relative block w-full rounded-2xl overflow-hidden shadow-soft-lg">
                  <img
                    className="w-full h-80 object-contain bg-white rounded-2xl transform hover:scale-105 transition-transform duration-700"
                    src="https://acachile.com/wp-content/uploads/2024/07/CONFEDERACION.png"
                    alt="World Barbecue Association - ACA Internacional"
                    onLoad={() => handleImageLoad('internacional')}
                    onError={(e) => handleImageError('internacional', e)}
                  />
                  
                  {/* Badge flotante */}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-soft px-4 py-2 rounded-full shadow-soft-md border border-white/40">
                    <span className="text-primary-600 font-semibold text-sm">🏆 WBQA</span>
                  </div>
                </div>
                
                {/* Elementos decorativos */}
                <div className="absolute -top-4 -left-4 w-20 h-20 bg-pastel-blue/30 rounded-full blur-xl animate-soft-pulse"></div>
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary-500/20 rounded-full blur-xl animate-soft-pulse" style={{ animationDelay: '1.5s' }}></div>
              </div>
            </div>
          </div>
        </div>
      </section>
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

      {/* Pertenecemos a */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold sm:text-4xl mb-4" style={{ color: '#374151' }}>
              PERTENECEMOS A:
            </h2>
            <p className="text-lg max-w-3xl mx-auto leading-relaxed" style={{ color: '#4B5563' }}>
              Luego de un arduo, silencioso y transparente trabajo estamos orgullosos de ser
              la única asociación nacional que pertenece a la CONFEDERACIÓN PANAMERICANA DE
              ASADORES y a la WORLD BARBECUE ASSOCIATION (ASOCIACIÓN MUNDIAL DE ASADORES).
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                img: "https://acachile.com/wp-content/uploads/2024/07/chile2.png",
                title: "Chile"
              },
              {
                img: "https://acachile.com/wp-content/uploads/2024/07/BB.png",
                title: "World Barbecue Association"
              },
              {
                img: "https://acachile.com/wp-content/uploads/2024/07/CONFEDERACION.png",
                title: "Confederación Panamericana"
              }
            ].map((org, index) => (
              <div 
                key={index}
                className="rounded-3xl p-8 transition-all duration-300 hover:transform hover:scale-105"
                style={{ 
                  backgroundColor: '#e8ecf4',
                  boxShadow: '15px 15px 30px #bec8d7, -15px -15px 30px #ffffff'
                }}
              >
                <div className="text-center">
                  <div 
                    className="mx-auto w-32 h-32 rounded-2xl mb-6 flex items-center justify-center overflow-hidden"
                    style={{ 
                      backgroundColor: 'white',
                      boxShadow: 'inset 8px 8px 16px #bec8d7, inset -8px -8px 16px #ffffff'
                    }}
                  >
                    <img
                      src={org.img}
                      alt={org.title}
                      className="w-full h-full object-contain p-4"
                      onLoad={() => handleImageLoad(`org-${index}`)}
                      onError={(e) => handleImageError(`org-${index}`, e)}
                    />
                  </div>
                  <h3 className="text-lg font-bold" style={{ color: '#374151' }}>
                    {org.title}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};