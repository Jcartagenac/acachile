import { useState, useMemo } from 'react';
import { Trophy, Medal, Award, Search, Filter, X, ChevronDown, BarChart3 } from 'lucide-react';

interface TeamResult {
  position: number;
  team: string;
  overall: number;
  chicken: number;
  beef: number;
  porkWithBone: number;
  porkWithoutBone: number;
  fish: number;
  rabbit: number;
  vegetarian: number;
}

const RESULTS_DATA: TeamResult[] = [
  { position: 1, team: "Brazilian Barbecue Team 1", overall: 222.450, chicken: 34.600, beef: 43.150, porkWithBone: 36.800, porkWithoutBone: 35.750, fish: 40.200, rabbit: 33.050, vegetarian: 31.950 },
  { position: 2, team: "BBQ Paraguay", overall: 222.300, chicken: 29.300, beef: 39.100, porkWithBone: 28.500, porkWithoutBone: 45.400, fish: 37.800, rabbit: 44.450, vegetarian: 42.200 },
  { position: 3, team: "Grill On Fire", overall: 216.800, chicken: 36.000, beef: 37.650, porkWithBone: 35.350, porkWithoutBone: 34.650, fish: 33.700, rabbit: 37.150, vegetarian: 39.450 },
  { position: 4, team: "Fuego & Fogo", overall: 214.850, chicken: 34.700, beef: 36.750, porkWithBone: 32.750, porkWithoutBone: 33.750, fish: 37.950, rabbit: 36.500, vegetarian: 38.950 },
  { position: 5, team: "GrillHub NX", overall: 212.950, chicken: 35.150, beef: 35.250, porkWithBone: 38.300, porkWithoutBone: 35.950, fish: 36.100, rabbit: 29.150, vegetarian: 32.200 },
  { position: 6, team: "Eventos de Fuego", overall: 212.000, chicken: 29.100, beef: 37.450, porkWithBone: 32.950, porkWithoutBone: 33.600, fish: 42.250, rabbit: 37.900, vegetarian: 36.650 },
  { position: 7, team: "GUATEMALA 1", overall: 211.000, chicken: 35.050, beef: 33.450, porkWithBone: 40.300, porkWithoutBone: 34.650, fish: 32.550, rabbit: 29.450, vegetarian: 35.000 },
  { position: 8, team: "Escuela Costarricense de Parrilleros", overall: 209.800, chicken: 35.250, beef: 33.550, porkWithBone: 41.850, porkWithoutBone: 34.900, fish: 31.950, rabbit: 36.200, vegetarian: 32.300 },
  { position: 9, team: "Guardianes de la Parrilla", overall: 208.800, chicken: 37.400, beef: 33.450, porkWithBone: 25.600, porkWithoutBone: 44.050, fish: 34.450, rabbit: 32.100, vegetarian: 33.850 },
  { position: 10, team: "Black Pearl BBQ Crew", overall: 208.050, chicken: 33.050, beef: 30.250, porkWithBone: 48.100, porkWithoutBone: 32.050, fish: 36.250, rabbit: 35.750, vegetarian: 28.350 },
  { position: 11, team: "Brasas Peruanas", overall: 208.050, chicken: 33.350, beef: 34.550, porkWithBone: 38.100, porkWithoutBone: 33.600, fish: 34.250, rabbit: 33.900, vegetarian: 34.200 },
  { position: 12, team: "Brazilian Barbecue Team 2", overall: 207.900, chicken: 37.550, beef: 39.400, porkWithBone: 31.000, porkWithoutBone: 34.350, fish: 35.450, rabbit: 40.450, vegetarian: 30.150 },
  { position: 13, team: "ICATMOR", overall: 207.750, chicken: 34.750, beef: 41.550, porkWithBone: 33.450, porkWithoutBone: 33.950, fish: 31.850, rabbit: 36.550, vegetarian: 32.200 },
  { position: 14, team: "Steiramen BBQ", overall: 207.400, chicken: 34.700, beef: 35.350, porkWithBone: 42.050, porkWithoutBone: 27.500, fish: 34.650, rabbit: 33.050, vegetarian: 33.150 },
  { position: 15, team: "Parrilleros de élite", overall: 207.400, chicken: 33.400, beef: 36.700, porkWithBone: 33.850, porkWithoutBone: 36.400, fish: 35.350, rabbit: 32.250, vegetarian: 31.700 },
  { position: 16, team: "A Modo Mio", overall: 206.550, chicken: 36.450, beef: 34.950, porkWithBone: 29.900, porkWithoutBone: 31.000, fish: 37.900, rabbit: 46.500, vegetarian: 36.350 },
  { position: 17, team: "Swiss Fire Devils BBQ", overall: 206.050, chicken: 31.300, beef: 39.300, porkWithBone: 21.850, porkWithoutBone: 48.450, fish: 33.450, rabbit: 34.350, vegetarian: 31.700 },
  { position: 18, team: "Bros & Fire PTY", overall: 205.800, chicken: 35.100, beef: 32.550, porkWithBone: 38.450, porkWithoutBone: 30.900, fish: 29.600, rabbit: 31.050, vegetarian: 39.200 },
  { position: 19, team: "Guayabos Grill", overall: 205.200, chicken: 33.050, beef: 35.000, porkWithBone: 34.400, porkWithoutBone: 32.900, fish: 35.450, rabbit: 38.350, vegetarian: 34.400 },
  { position: 20, team: "Parrillas y Espadas", overall: 204.700, chicken: 34.350, beef: 33.050, porkWithBone: 28.350, porkWithoutBone: 33.350, fish: 37.800, rabbit: 39.050, vegetarian: 37.800 },
  { position: 21, team: "West Smoke BBQ", overall: 204.700, chicken: 38.250, beef: 36.500, porkWithBone: 33.450, porkWithoutBone: 31.850, fish: 36.100, rabbit: 33.800, vegetarian: 28.550 },
  { position: 22, team: "La Pandilla Parrillera", overall: 204.650, chicken: 29.550, beef: 33.200, porkWithBone: 49.050, porkWithoutBone: 31.700, fish: 35.000, rabbit: 34.800, vegetarian: 26.150 },
  { position: 23, team: "Barbakùa", overall: 204.550, chicken: 34.500, beef: 30.550, porkWithBone: 19.050, porkWithoutBone: 51.050, fish: 33.150, rabbit: 34.750, vegetarian: 36.250 },
  { position: 24, team: "La Mesa del Laurel", overall: 204.500, chicken: 31.650, beef: 34.700, porkWithBone: 43.100, porkWithoutBone: 29.050, fish: 34.100, rabbit: 33.550, vegetarian: 31.900 },
  { position: 25, team: "Fuego del Achibueno", overall: 204.100, chicken: 36.050, beef: 38.800, porkWithBone: 31.900, porkWithoutBone: 33.050, fish: 30.150, rabbit: 29.850, vegetarian: 34.150 },
  { position: 26, team: "ACONCAGUA GRILL", overall: 203.750, chicken: 42.950, beef: 34.400, porkWithBone: 28.100, porkWithoutBone: 29.100, fish: 37.850, rabbit: 22.000, vegetarian: 31.350 },
  { position: 27, team: "Grillholics Mx", overall: 202.900, chicken: 33.200, beef: 35.000, porkWithBone: 31.250, porkWithoutBone: 38.300, fish: 35.950, rabbit: 34.550, vegetarian: 29.200 },
  { position: 28, team: "Forjadores de Sabor", overall: 202.750, chicken: 37.150, beef: 34.700, porkWithBone: 32.150, porkWithoutBone: 34.050, fish: 32.150, rabbit: 28.150, vegetarian: 32.550 },
  { position: 29, team: "Condores de Fuego", overall: 201.550, chicken: 37.100, beef: 34.700, porkWithBone: 23.550, porkWithoutBone: 38.100, fish: 37.500, rabbit: 35.450, vegetarian: 30.600 },
  { position: 30, team: "Peaky Blinders", overall: 201.550, chicken: 33.150, beef: 34.500, porkWithBone: 32.400, porkWithoutBone: 35.450, fish: 33.300, rabbit: 33.800, vegetarian: 32.750 },
  { position: 31, team: "Brasas Biobio", overall: 201.500, chicken: 29.100, beef: 33.150, porkWithBone: 21.700, porkWithoutBone: 49.800, fish: 34.800, rabbit: 30.450, vegetarian: 32.950 },
  { position: 32, team: "Andes Grill", overall: 200.950, chicken: 28.000, beef: 45.700, porkWithBone: 28.450, porkWithoutBone: 31.700, fish: 37.150, rabbit: 30.600, vegetarian: 29.950 },
  { position: 33, team: "La Bodega del Asador", overall: 200.150, chicken: 35.250, beef: 37.000, porkWithBone: 33.350, porkWithoutBone: 27.650, fish: 37.150, rabbit: 35.700, vegetarian: 29.750 },
  { position: 34, team: "OJO DE BIFFE", overall: 199.850, chicken: 36.950, beef: 37.700, porkWithBone: 28.450, porkWithoutBone: 30.950, fish: 35.350, rabbit: 31.850, vegetarian: 30.450 },
  { position: 35, team: "LUMBERJACK BBQ", overall: 199.050, chicken: 34.050, beef: 30.450, porkWithBone: 33.250, porkWithoutBone: 32.250, fish: 35.300, rabbit: 37.950, vegetarian: 33.750 },
  { position: 36, team: "Nina Runa Perú", overall: 195.000, chicken: 20.800, beef: 40.050, porkWithBone: 35.050, porkWithoutBone: 36.900, fish: 30.250, rabbit: 34.100, vegetarian: 31.950 },
  { position: 37, team: "LECHLER Grill Team", overall: 193.650, chicken: 25.500, beef: 33.350, porkWithBone: 35.100, porkWithoutBone: 34.050, fish: 33.000, rabbit: 28.950, vegetarian: 32.650 },
  { position: 38, team: "Rhoener Heimat Griller", overall: 191.500, chicken: 34.950, beef: 31.150, porkWithBone: 29.450, porkWithoutBone: 35.700, fish: 32.450, rabbit: 29.400, vegetarian: 27.800 },
  { position: 39, team: "Las Pibas del Fuego", overall: 190.500, chicken: 30.500, beef: 32.650, porkWithBone: 16.850, porkWithoutBone: 41.150, fish: 31.350, rabbit: 30.050, vegetarian: 38.000 },
  { position: 40, team: "Sociedad Parrillera de Nuevo Laredo.", overall: 189.450, chicken: 25.750, beef: 33.450, porkWithBone: 36.150, porkWithoutBone: 28.900, fish: 32.200, rabbit: 28.700, vegetarian: 33.000 },
  { position: 41, team: "Wild West BBQ e.V.", overall: 189.100, chicken: 31.400, beef: 34.250, porkWithBone: 33.150, porkWithoutBone: 28.200, fish: 30.800, rabbit: 41.100, vegetarian: 31.300 },
  { position: 42, team: "Argentina, Fuego y Tradición", overall: 188.900, chicken: 30.600, beef: 31.800, porkWithBone: 23.700, porkWithoutBone: 35.800, fish: 38.000, rabbit: 30.250, vegetarian: 29.000 },
  { position: 43, team: "Oid mortales del fuego", overall: 188.800, chicken: 27.150, beef: 34.400, porkWithBone: 36.850, porkWithoutBone: 31.500, fish: 31.900, rabbit: 36.400, vegetarian: 27.000 },
  { position: 44, team: "Malvinas Argentinas", overall: 188.350, chicken: 31.150, beef: 25.400, porkWithBone: 35.400, porkWithoutBone: 33.700, fish: 27.400, rabbit: 32.550, vegetarian: 35.300 },
  { position: 45, team: "American BBQ", overall: 187.050, chicken: 35.950, beef: 32.300, porkWithBone: 30.200, porkWithoutBone: 42.700, fish: 12.100, rabbit: 37.300, vegetarian: 33.800 },
  { position: 46, team: "PAYASO PARRILLERO", overall: 186.850, chicken: 0.000, beef: 43.950, porkWithBone: 33.950, porkWithoutBone: 34.650, fish: 40.750, rabbit: 34.450, vegetarian: 33.550 },
  { position: 47, team: "HEREDEROS DE LA PARRILLA", overall: 186.350, chicken: 33.850, beef: 32.950, porkWithBone: 21.500, porkWithoutBone: 39.200, fish: 32.300, rabbit: 26.450, vegetarian: 26.550 },
  { position: 48, team: "Humo Parrillada", overall: 183.900, chicken: 33.800, beef: 32.550, porkWithBone: 19.850, porkWithoutBone: 32.350, fish: 31.400, rabbit: 29.150, vegetarian: 33.950 },
  { position: 49, team: "WBQA Mexico Center", overall: 182.600, chicken: 26.900, beef: 33.550, porkWithBone: 33.700, porkWithoutBone: 29.800, fish: 33.800, rabbit: 30.950, vegetarian: 24.850 },
  { position: 50, team: "Humo Norteno", overall: 182.350, chicken: 32.850, beef: 28.650, porkWithBone: 41.500, porkWithoutBone: 28.600, fish: 28.800, rabbit: 37.050, vegetarian: 21.950 },
  { position: 51, team: "Caballeros de la Parrilla", overall: 182.250, chicken: 25.700, beef: 35.500, porkWithBone: 24.500, porkWithoutBone: 28.150, fish: 36.450, rabbit: 31.800, vegetarian: 31.950 },
  { position: 52, team: "Sabor Canario Uruguay", overall: 180.750, chicken: 29.200, beef: 31.100, porkWithBone: 27.150, porkWithoutBone: 36.300, fish: 25.750, rabbit: 26.900, vegetarian: 31.250 },
  { position: 53, team: "Sabores y fuegos argentinos", overall: 179.450, chicken: 29.700, beef: 30.400, porkWithBone: 29.750, porkWithoutBone: 31.700, fish: 28.350, rabbit: 31.500, vegetarian: 29.550 },
  { position: 54, team: "DIVINO FOGO", overall: 178.350, chicken: 31.250, beef: 32.600, porkWithBone: 29.200, porkWithoutBone: 24.500, fish: 28.450, rabbit: 38.450, vegetarian: 32.350 },
  { position: 55, team: "Mau's Grill", overall: 177.650, chicken: 32.200, beef: 26.300, porkWithBone: 27.650, porkWithoutBone: 32.650, fish: 29.600, rabbit: 34.850, vegetarian: 29.250 },
  { position: 56, team: "Sangre Charrua Uruguay", overall: 171.450, chicken: 16.000, beef: 29.950, porkWithBone: 27.700, porkWithoutBone: 34.800, fish: 30.300, rabbit: 35.600, vegetarian: 32.700 },
  { position: 57, team: "Argentina, Fuego Sagrado", overall: 167.250, chicken: 4.400, beef: 33.900, porkWithBone: 31.300, porkWithoutBone: 31.250, fish: 32.950, rabbit: 27.150, vegetarian: 33.450 },
  { position: 58, team: "Asadores del Valhala", overall: 160.500, chicken: 13.500, beef: 32.100, porkWithBone: 28.600, porkWithoutBone: 31.900, fish: 26.950, rabbit: 38.150, vegetarian: 27.450 },
];

const CATEGORIES = [
  { key: 'overall', label: 'Overall', icon: Trophy },
  { key: 'chicken', label: 'Chicken', icon: Medal },
  { key: 'beef', label: 'Beef', icon: Award },
  { key: 'porkWithBone', label: 'Pork w/bone', icon: Medal },
  { key: 'porkWithoutBone', label: 'Pork wo/bone', icon: Medal },
  { key: 'fish', label: 'Fish', icon: Award },
  { key: 'rabbit', label: 'Rabbit', icon: Medal },
  { key: 'vegetarian', label: 'Vegetarian', icon: Award },
] as const;

type CategoryKey = typeof CATEGORIES[number]['key'];

export default function ResultadosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('overall');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<TeamResult | null>(null);

  // Filtrar y ordenar resultados
  const filteredResults = useMemo(() => {
    let results = RESULTS_DATA.filter(team => team.overall > 0); // Excluir equipos sin puntaje
    
    // Filtrar por búsqueda
    if (searchTerm) {
      results = results.filter(team => 
        team.team.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Ordenar por categoría seleccionada
    results.sort((a, b) => b[selectedCategory] - a[selectedCategory]);

    return results;
  }, [searchTerm, selectedCategory]);

  // Obtener top 3 de la categoría seleccionada
  const topThree = filteredResults.slice(0, 3);

  const getPositionBadge = (position: number) => {
    if (position === 1) return { icon: Trophy, color: 'text-yellow-600 bg-yellow-50' };
    if (position === 2) return { icon: Medal, color: 'text-gray-600 bg-gray-50' };
    if (position === 3) return { icon: Award, color: 'text-orange-600 bg-orange-50' };
    return null;
  };

  return (
    <div className="min-h-screen bg-soft-gradient-light py-12 sm:py-16 lg:py-20">
      {/* Modal de detalles del equipo */}
      {selectedTeam && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedTeam(null)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del modal */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-500 px-6 py-6 text-white">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-1">
                      <span className="text-sm font-bold">Posición #{selectedTeam.position}</span>
                    </div>
                    {getPositionBadge(selectedTeam.position) && (
                      <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                        {(() => {
                          const badge = getPositionBadge(selectedTeam.position);
                          const Icon = badge!.icon;
                          return <Icon className="h-5 w-5" />;
                        })()}
                      </div>
                    )}
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{selectedTeam.team}</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">{selectedTeam.overall.toFixed(3)}</span>
                    <span className="text-white/80">puntos totales</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTeam(null)}
                  className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Contenido del modal - Categorías */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              <h4 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary-600" />
                Puntuación por Categoría
              </h4>
              
              <div className="grid gap-4">
                {CATEGORIES.filter(cat => cat.key !== 'overall').map((category) => {
                  const Icon = category.icon;
                  const score = selectedTeam[category.key];
                  const maxScore = 50; // Puntaje máximo teórico
                  const percentage = (score / maxScore) * 100;
                  
                  return (
                    <div 
                      key={category.key}
                      className="bg-neutral-50 rounded-2xl p-4 hover:bg-neutral-100 transition-all"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary-100 rounded-xl p-2">
                            <Icon className="h-5 w-5 text-primary-600" />
                          </div>
                          <span className="font-semibold text-neutral-900">{category.label}</span>
                        </div>
                        <span className="text-2xl font-bold text-primary-600">
                          {score.toFixed(3)}
                        </span>
                      </div>
                      
                      {/* Barra de progreso */}
                      <div className="w-full bg-neutral-200 rounded-full h-3 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-primary-500 to-primary-600 h-full rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="mt-1 text-xs text-neutral-500 text-right">
                        {percentage.toFixed(1)}% del máximo
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer del modal */}
            <div className="border-t border-neutral-200 px-6 py-4 bg-neutral-50">
              <button
                onClick={() => setSelectedTeam(null)}
                className="w-full px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-primary-600 transition-all shadow-soft-md hover:shadow-soft-lg"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12 lg:mb-16 animate-slide-up">
          <div className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-50 rounded-full mb-6">
            <Trophy className="h-5 w-5 text-primary-600" />
            <span className="text-sm font-semibold text-primary-700 tracking-wide uppercase">Resultados Oficiales</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 tracking-tight mb-4">
            WBQA International BBQ Championship
          </h1>
          <h2 className="text-2xl sm:text-3xl font-semibold text-primary-600 mb-6">
            Chile 2025
          </h2>
          
          <p className="text-lg text-neutral-600 max-w-3xl mx-auto">
            Resultados completos del campeonato internacional de BBQ con {RESULTS_DATA.filter(t => t.overall > 0).length} equipos participantes
          </p>
        </div>

        {/* Filtros y búsqueda */}
        <div className="bg-white rounded-2xl shadow-soft-lg p-6 mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Búsqueda */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Buscar equipo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Botón filtros mobile */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden flex items-center justify-center gap-2 px-6 py-3 bg-primary-50 text-primary-700 rounded-xl font-semibold hover:bg-primary-100 transition-colors"
            >
              <Filter className="h-5 w-5" />
              Filtrar por categoría
              <ChevronDown className={`h-5 w-5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Filtros de categoría */}
          <div className={`mt-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <label className="block text-sm font-semibold text-neutral-700 mb-3">
              Categoría:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {CATEGORIES.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.key}
                    onClick={() => setSelectedCategory(category.key)}
                    className={`flex flex-col items-center gap-2 px-3 py-3 rounded-xl font-semibold text-sm transition-all ${
                      selectedCategory === category.key
                        ? 'bg-primary-600 text-white shadow-soft-md scale-105'
                        : 'bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs text-center leading-tight">{category.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Podio - Top 3 */}
        {!searchTerm && topThree.length >= 3 && (
          <div className="mb-12 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <h3 className="text-2xl font-bold text-neutral-900 mb-6 text-center">
              🏆 Podio - {CATEGORIES.find(c => c.key === selectedCategory)?.label}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {/* Segundo lugar */}
              {topThree[1] && (
                <div className="md:order-1 order-2">
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border-2 border-gray-300 shadow-soft-lg hover:shadow-soft-xl transition-all transform hover:scale-105">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full mb-4 shadow-lg">
                        <span className="text-2xl font-bold text-white">2</span>
                      </div>
                      <h4 className="font-bold text-lg text-neutral-900 mb-2">{topThree[1].team}</h4>
                      <div className="text-3xl font-bold text-gray-600 mb-1">
                        {topThree[1][selectedCategory].toFixed(3)}
                      </div>
                      <div className="text-sm text-neutral-600">puntos</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Primer lugar */}
              {topThree[0] && (
                <div className="md:order-2 order-1">
                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-8 border-2 border-yellow-400 shadow-soft-2xl hover:shadow-2xl transition-all transform hover:scale-105 md:-mt-4">
                    <div className="text-center">
                      <Trophy className="h-20 w-20 text-yellow-600 mx-auto mb-4" />
                      <h4 className="font-bold text-xl text-neutral-900 mb-3">{topThree[0].team}</h4>
                      <div className="text-4xl font-bold text-yellow-600 mb-2">
                        {topThree[0][selectedCategory].toFixed(3)}
                      </div>
                      <div className="text-sm text-neutral-600 font-semibold">🥇 CAMPEÓN</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tercer lugar */}
              {topThree[2] && (
                <div className="md:order-3 order-3">
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border-2 border-orange-300 shadow-soft-lg hover:shadow-soft-xl transition-all transform hover:scale-105">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full mb-4 shadow-lg">
                        <span className="text-2xl font-bold text-white">3</span>
                      </div>
                      <h4 className="font-bold text-lg text-neutral-900 mb-2">{topThree[2].team}</h4>
                      <div className="text-3xl font-bold text-orange-600 mb-1">
                        {topThree[2][selectedCategory].toFixed(3)}
                      </div>
                      <div className="text-sm text-neutral-600">puntos</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tabla de resultados */}
        <div className="bg-white rounded-2xl shadow-soft-lg overflow-hidden animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="px-6 py-4 bg-neutral-50 border-b border-neutral-200 flex items-center gap-3">
            <BarChart3 className="h-6 w-6 text-primary-600" />
            <h3 className="text-xl font-bold text-neutral-900">
              Clasificación Completa
            </h3>
            <span className="ml-auto text-sm text-neutral-600">
              {filteredResults.length} equipos
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b-2 border-neutral-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-neutral-700 uppercase tracking-wide">Pos</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-neutral-700 uppercase tracking-wide">Equipo</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-neutral-700 uppercase tracking-wide">
                    {CATEGORIES.find(c => c.key === selectedCategory)?.label}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredResults.map((team, index) => {
                  const badge = getPositionBadge(index + 1);
                  const Icon = badge?.icon;

                  return (
                    <tr 
                      key={team.position}
                      onClick={() => selectedCategory === 'overall' && setSelectedTeam(team)}
                      className={`transition-all ${
                        selectedCategory === 'overall' 
                          ? 'hover:bg-primary-50 cursor-pointer hover:shadow-soft-sm' 
                          : 'hover:bg-neutral-50'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {Icon ? (
                            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${badge.color}`}>
                              <Icon className="h-5 w-5" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 flex items-center justify-center">
                              <span className="text-lg font-bold text-neutral-600">{index + 1}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold text-neutral-900">{team.team}</div>
                          {selectedCategory === 'overall' && (
                            <div className="text-neutral-400 ml-2">
                              <ChevronDown className="h-5 w-5 rotate-[-90deg]" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-lg font-bold text-primary-600">
                          {team[selectedCategory].toFixed(3)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredResults.length === 0 && (
            <div className="px-6 py-12 text-center">
              <Search className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                No se encontraron resultados
              </h3>
              <p className="text-neutral-600">
                Intenta con otro término de búsqueda
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
