import { useState, useMemo, useEffect } from 'react';
import { Trophy, Medal, Award, Search, Filter, X, ChevronDown, BarChart3 } from 'lucide-react';
import { SEOHelmet } from '../components/SEOHelmet';
import { getChampionshipResults, type TeamResult as TeamResultType } from '../services/championshipService';

type Language = 'es' | 'en' | 'de' | 'pt';

const TRANSLATIONS = {
  es: {
    officialResults: 'Resultados Oficiales',
    championship: 'WBQA International BBQ Championship',
    chile2025: 'Chile 2025',
    subtitle: 'Resultados completos del campeonato internacional de BBQ con',
    teamsParticipating: 'equipos participantes',
    searchTeam: 'Buscar equipo...',
    filterByCategory: 'Filtrar por categoría',
    category: 'Categoría:',
    overall: 'Overall',
    chicken: 'Chicken',
    beef: 'Beef',
    porkWithBone: 'Pork w/bone',
    porkWithoutBone: 'Pork wo/bone',
    fish: 'Fish',
    rabbit: 'Rabbit',
    vegetarian: 'Vegetarian',
    podium: '🏆 Podio',
    champion: '🥇 CAMPEÓN',
    points: 'puntos',
    totalPoints: 'puntos totales',
    completeClassification: 'Clasificación Completa',
    teams: 'equipos',
    position: 'Pos',
    team: 'Equipo',
    noResults: 'No se encontraron resultados',
    tryAnother: 'Intenta con otro término de búsqueda',
    close: 'Cerrar',
    scoreByCategory: 'Puntuación por Categoría',
    ofMaximum: 'del máximo',
  },
  en: {
    officialResults: 'Official Results',
    championship: 'WBQA International BBQ Championship',
    chile2025: 'Chile 2025',
    subtitle: 'Complete results of the international BBQ championship with',
    teamsParticipating: 'participating teams',
    searchTeam: 'Search team...',
    filterByCategory: 'Filter by category',
    category: 'Category:',
    overall: 'Overall',
    chicken: 'Chicken',
    beef: 'Beef',
    porkWithBone: 'Pork w/bone',
    porkWithoutBone: 'Pork wo/bone',
    fish: 'Fish',
    rabbit: 'Rabbit',
    vegetarian: 'Vegetarian',
    podium: '🏆 Podium',
    champion: '🥇 CHAMPION',
    points: 'points',
    totalPoints: 'total points',
    completeClassification: 'Complete Classification',
    teams: 'teams',
    position: 'Pos',
    team: 'Team',
    noResults: 'No results found',
    tryAnother: 'Try another search term',
    close: 'Close',
    scoreByCategory: 'Score by Category',
    ofMaximum: 'of maximum',
  },
  de: {
    officialResults: 'Offizielle Ergebnisse',
    championship: 'WBQA International BBQ Championship',
    chile2025: 'Chile 2025',
    subtitle: 'Vollständige Ergebnisse der internationalen BBQ-Meisterschaft mit',
    teamsParticipating: 'teilnehmenden Teams',
    searchTeam: 'Team suchen...',
    filterByCategory: 'Nach Kategorie filtern',
    category: 'Kategorie:',
    overall: 'Gesamt',
    chicken: 'Hähnchen',
    beef: 'Rindfleisch',
    porkWithBone: 'Schwein m/Knochen',
    porkWithoutBone: 'Schwein o/Knochen',
    fish: 'Fisch',
    rabbit: 'Kaninchen',
    vegetarian: 'Vegetarisch',
    podium: '🏆 Podium',
    champion: '🥇 CHAMPION',
    points: 'Punkte',
    totalPoints: 'Gesamtpunkte',
    completeClassification: 'Vollständige Klassifizierung',
    teams: 'Teams',
    position: 'Pos',
    team: 'Team',
    noResults: 'Keine Ergebnisse gefunden',
    tryAnother: 'Versuchen Sie einen anderen Suchbegriff',
    close: 'Schließen',
    scoreByCategory: 'Punktzahl nach Kategorie',
    ofMaximum: 'vom Maximum',
  },
  pt: {
    officialResults: 'Resultados Oficiais',
    championship: 'WBQA International BBQ Championship',
    chile2025: 'Chile 2025',
    subtitle: 'Resultados completos do campeonato internacional de churrasco com',
    teamsParticipating: 'equipes participantes',
    searchTeam: 'Buscar equipe...',
    filterByCategory: 'Filtrar por categoria',
    category: 'Categoria:',
    overall: 'Geral',
    chicken: 'Frango',
    beef: 'Carne',
    porkWithBone: 'Porco c/osso',
    porkWithoutBone: 'Porco s/osso',
    fish: 'Peixe',
    rabbit: 'Coelho',
    vegetarian: 'Vegetariano',
    podium: '🏆 Pódio',
    champion: '🥇 CAMPEÃO',
    points: 'pontos',
    totalPoints: 'pontos totais',
    completeClassification: 'Classificação Completa',
    teams: 'equipes',
    position: 'Pos',
    team: 'Equipe',
    noResults: 'Nenhum resultado encontrado',
    tryAnother: 'Tente outro termo de busca',
    close: 'Fechar',
    scoreByCategory: 'Pontuação por Categoria',
    ofMaximum: 'do máximo',
  }
};

const LANGUAGES = [
  { code: 'es' as Language, label: 'Español', flag: '🇪🇸' },
  { code: 'en' as Language, label: 'English', flag: '🇬🇧' },
  { code: 'de' as Language, label: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt' as Language, label: 'Português', flag: '🇵🇹' },
];

// Use TeamResult from service
type TeamResult = TeamResultType;
type CategoryKey = 'overall' | 'chicken' | 'beef' | 'porkWithBone' | 'porkWithoutBone' | 'fish' | 'rabbit' | 'vegetarian';

const getCategories = (lang: Language) => [
  { key: 'overall' as CategoryKey, label: TRANSLATIONS[lang].overall, icon: Trophy },
  { key: 'chicken' as CategoryKey, label: TRANSLATIONS[lang].chicken, icon: Medal },
  { key: 'beef' as CategoryKey, label: TRANSLATIONS[lang].beef, icon: Award },
  { key: 'porkWithBone' as CategoryKey, label: TRANSLATIONS[lang].porkWithBone, icon: Medal },
  { key: 'porkWithoutBone' as CategoryKey, label: TRANSLATIONS[lang].porkWithoutBone, icon: Medal },
  { key: 'fish' as CategoryKey, label: TRANSLATIONS[lang].fish, icon: Award },
  { key: 'rabbit' as CategoryKey, label: TRANSLATIONS[lang].rabbit, icon: Medal },
  { key: 'vegetarian' as CategoryKey, label: TRANSLATIONS[lang].vegetarian, icon: Award },
];

// Ranking ACA 2025 data
const RANKING_ACA_2025 = [
  { equipo: 'FORJADORES DEL SABOR', nvaImperial: 1, rgf: 6, talca: 12, sgf: 5, final: 6.0, lugar: 1 },
  { equipo: 'GUARDIANES DE LA PARRILLA', nvaImperial: 5, rgf: 9, talca: 4, sgf: 6, final: 6.0, lugar: 1 },
  { equipo: 'PARRILLAS Y ESPADAS', nvaImperial: 6, rgf: 7, talca: 2, sgf: 9, final: 6.0, lugar: 1 },
  { equipo: 'FUEGO Y FOGO', nvaImperial: 23, rgf: 2, talca: 1, sgf: 3, final: 7.3, lugar: 2 },
  { equipo: 'CÓNDORES DE FUEGO', nvaImperial: 3, rgf: 5, talca: 6, sgf: 23, final: 9.3, lugar: 3 },
  { equipo: 'PAYASO PARRILLERO', nvaImperial: 23, rgf: 3, talca: 14, sgf: 4, final: 11.0, lugar: 4 },
  { equipo: 'DIVINO FOGO', nvaImperial: 23, rgf: 4, talca: 7, sgf: 11, final: 11.3, lugar: 5 },
  { equipo: 'PEAKY BLINDERS', nvaImperial: 23, rgf: 11, talca: 5, sgf: 8, final: 11.8, lugar: 6 },
  { equipo: 'BRASAS BIO BIO', nvaImperial: 2, rgf: 14, talca: 11, sgf: 23, final: 12.5, lugar: 7 },
  { equipo: 'EVENTOS DE FUEGO', nvaImperial: 23, rgf: 1, talca: 3, sgf: 23, final: 12.5, lugar: 8 },
  { equipo: 'OJO DE BIFFE', nvaImperial: 23, rgf: 17, talca: 13, sgf: 1, final: 13.5, lugar: 9 },
  { equipo: 'AMERICAN BBQ', nvaImperial: 23, rgf: 23, talca: 8, sgf: 2, final: 14.0, lugar: 10 },
  { equipo: 'FLOR DE NOTRO', nvaImperial: 23, rgf: 13, talca: 17, sgf: 10, final: 15.8, lugar: 11 },
  { equipo: 'BODEGA DEL ASADOR', nvaImperial: 4, rgf: 23, talca: 16, sgf: 23, final: 16.5, lugar: 12 },
  { equipo: 'HEREDEROS DE LA PARRILLA', nvaImperial: 23, rgf: 12, talca: 10, sgf: 23, final: 17.0, lugar: 13 },
  { equipo: 'CARNES DELUXE', nvaImperial: 23, rgf: 8, talca: 15, sgf: 23, final: 17.3, lugar: 14 },
  { equipo: 'LUMBERJACK BBQ', nvaImperial: 23, rgf: 15, talca: 9, sgf: 23, final: 17.5, lugar: 15 },
  { equipo: 'CABALLEROS DE LA PARRILLA', nvaImperial: 23, rgf: 23, talca: 19, sgf: 7, final: 18.0, lugar: 16 },
  { equipo: 'ANDES GRILL', nvaImperial: 23, rgf: 10, talca: 18, sgf: 23, final: 18.5, lugar: 17 },
  { equipo: 'FUEGOS INDOMITOS', nvaImperial: 7, rgf: 23, talca: 23, sgf: 23, final: 19.0, lugar: 18 },
  { equipo: 'FUEGO DEL VALHALLA', nvaImperial: 23, rgf: 23, talca: 23, sgf: 12, final: 20.3, lugar: 19 },
  { equipo: 'PARRILLEROS DE ELITE', nvaImperial: 23, rgf: 23, talca: 23, sgf: 13, final: 20.5, lugar: 20 },
  { equipo: 'FUEGO AUSTRAL', nvaImperial: 23, rgf: 16, talca: 23, sgf: 23, final: 21.3, lugar: 21 },
];

type RankingTab = 'wbqa' | 'aca2025';

interface EquipoACA {
  equipo: string;
  nvaImperial: number;
  rgf: number;
  talca: number;
  sgf: number;
  final: number;
  lugar: number;
}

export default function ResultadosPage() {
  const [activeTab, setActiveTab] = useState<RankingTab>('wbqa');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('overall');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<TeamResult | null>(null);
  const [selectedEquipoACA, setSelectedEquipoACA] = useState<EquipoACA | null>(null);
  const [language, setLanguage] = useState<Language>('es');
  const [resultsData, setResultsData] = useState<TeamResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const t = TRANSLATIONS[language];
  const CATEGORIES = getCategories(language);

  // Load championship results from API
  useEffect(() => {
    async function loadResults() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getChampionshipResults(undefined, 2025);
        setResultsData(data);
      } catch (err) {
        console.error('Failed to load championship results:', err);
        setError(err instanceof Error ? err.message : 'Failed to load results');
      } finally {
        setIsLoading(false);
      }
    }
    loadResults();
  }, []);

  // Filtrar y ordenar resultados
  const filteredResults = useMemo(() => {
    let results = resultsData.filter((team: TeamResult) => team.overall > 0); // Excluir equipos sin puntaje
    
    // Filtrar por búsqueda
    if (searchTerm) {
      results = results.filter((team: TeamResult) => 
        team.team.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Ordenar por categoría seleccionada
    results.sort((a: TeamResult, b: TeamResult) => b[selectedCategory] - a[selectedCategory]);

    return results;
  }, [resultsData, searchTerm, selectedCategory]);

  // Obtener top 3 de la categoría seleccionada
  const topThree = filteredResults.slice(0, 3);

  const getPositionBadge = (position: number) => {
    if (position === 1) return { icon: Trophy, color: 'text-yellow-600 bg-yellow-50' };
    if (position === 2) return { icon: Medal, color: 'text-gray-600 bg-gray-50' };
    if (position === 3) return { icon: Award, color: 'text-orange-600 bg-orange-50' };
    return null;
  };

  // Show loading state
  if (isLoading) {
    return (
      <>
        <SEOHelmet
          title="Resultados WBQA Championship Chile 2025 🏆 ACA Chile"
          description="🏆 Resultados oficiales WBQA International BBQ Championship Chile 2025. 58 equipos participantes. Consulta posiciones y puntajes completos."
          url="https://acachile.com/resultados"
          image="https://pub-9edd01c5f73442228a840ca5c8fca38a.r2.dev/home/img-1762489301673-11k166.jpg"
        />
        <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50 py-12 px-4 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-white rounded-full shadow-lg mb-4">
              <div className="h-5 w-5 border-3 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-neutral-700 font-medium">Cargando resultados...</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Show error state
  if (error) {
    return (
      <>
        <SEOHelmet
          title="Error - Resultados WBQA Championship Chile 2025"
          description="Error al cargar los resultados del campeonato."
          url="https://acachile.com/resultados"
        />
        <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50 py-12 px-4 flex items-center justify-center">
          <div className="max-w-md w-full">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center shadow-lg">
              <div className="text-red-600 text-lg font-semibold mb-2">Error al cargar resultados</div>
              <p className="text-red-700 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEOHelmet
        title="Resultados WBQA Championship Chile 2025 🏆 ACA Chile"
        description="🏆 Resultados oficiales WBQA International BBQ Championship Chile 2025. 58 equipos participantes. Consulta posiciones y puntajes completos."
        url="https://acachile.com/resultados"
        image="https://pub-9edd01c5f73442228a840ca5c8fca38a.r2.dev/home/img-1762489301673-11k166.jpg"
      />
      
      <div className="min-h-screen bg-soft-gradient-light py-8 sm:py-10 lg:py-12">
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
                        <span className="text-sm font-bold">{t.position} #{selectedTeam.position}</span>
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
                      <span className="text-white/80">{t.totalPoints}</span>
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
                  {t.scoreByCategory}
                </h4>              <div className="grid gap-4">
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
                        {percentage.toFixed(1)}% {t.ofMaximum}
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
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Language Selector */}
        <div className="flex justify-center mb-6 animate-slide-up">
          <div className="flex items-center gap-2 bg-white px-5 py-2 rounded-full shadow-soft-md border border-neutral-200">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`relative group transition-all duration-200 ${
                  language === lang.code 
                    ? 'scale-125' 
                    : 'scale-100 opacity-60 hover:opacity-100 hover:scale-110'
                }`}
                title={lang.label}
              >
                <span className="text-2xl sm:text-3xl cursor-pointer">
                  {lang.flag}
                </span>
                {language === lang.code && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-primary-600 rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8 lg:mb-10 animate-slide-up">
          <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 bg-primary-50 rounded-full mb-4">
            <Trophy className="h-4 w-4 text-primary-600" />
            <span className="text-xs font-semibold text-primary-700 tracking-wide uppercase">{t.officialResults}</span>
          </div>
          
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-3">
            Rankings Oficiales
          </h1>
          <h2 className="text-xl sm:text-2xl font-semibold text-primary-600 mb-4">
            {t.chile2025}
          </h2>
          
          <p className="text-base text-neutral-600 max-w-3xl mx-auto">
            Consulta los resultados de los principales campeonatos de BBQ en Chile
          </p>
        </div>

        {/* Tabs de Rankings */}
        <div className="mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="bg-white rounded-2xl shadow-soft-lg p-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => setActiveTab('wbqa')}
                className={`flex-1 px-6 py-4 rounded-xl font-semibold text-sm sm:text-base transition-all ${
                  activeTab === 'wbqa'
                    ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-soft-md'
                    : 'text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Trophy className="h-5 w-5" />
                  <span>WBQA International BBQ Championship</span>
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab('aca2025')}
                className={`flex-1 px-6 py-4 rounded-xl font-semibold text-sm sm:text-base transition-all ${
                  activeTab === 'aca2025'
                    ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-soft-md'
                    : 'text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Award className="h-5 w-5" />
                  <span>Ranking ACA 2025</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Contenido WBQA */}
        {activeTab === 'wbqa' && (
        <>
        {/* Filtros y búsqueda */}
        <div className="bg-white rounded-2xl shadow-soft-lg p-4 mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Búsqueda */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <input
                  type="text"
                  placeholder={t.searchTeam}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-2.5 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
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
              className="lg:hidden flex items-center justify-center gap-2 px-6 py-2.5 bg-primary-50 text-primary-700 rounded-xl font-semibold hover:bg-primary-100 transition-colors"
            >
              <Filter className="h-5 w-5" />
              {t.filterByCategory}
              <ChevronDown className={`h-5 w-5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Filtros de categoría */}
          <div className={`mt-4 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">
              {t.category}
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
          <div className="mb-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <h3 className="text-xl font-bold text-neutral-900 mb-4 text-center">
              {t.podium} - {CATEGORIES.find(c => c.key === selectedCategory)?.label}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {/* Segundo lugar */}
              {topThree[1] && (
                <div className="md:order-1 order-2">
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 border-2 border-gray-300 shadow-soft-lg hover:shadow-soft-xl transition-all transform hover:scale-105">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full mb-3 shadow-lg">
                        <span className="text-xl font-bold text-white">2</span>
                      </div>
                      <h4 className="font-bold text-base text-neutral-900 mb-2 line-clamp-2">{topThree[1].team}</h4>
                      <div className="text-2xl font-bold text-gray-600 mb-1">
                        {topThree[1][selectedCategory].toFixed(3)}
                      </div>
                      <div className="text-xs text-neutral-600">{t.points}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Primer lugar */}
              {topThree[0] && (
                <div className="md:order-2 order-1">
                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-5 border-2 border-yellow-400 shadow-soft-2xl hover:shadow-2xl transition-all transform hover:scale-105 md:-mt-2">
                    <div className="text-center">
                      <Trophy className="h-14 w-14 text-yellow-600 mx-auto mb-3" />
                      <h4 className="font-bold text-lg text-neutral-900 mb-2 line-clamp-2">{topThree[0].team}</h4>
                      <div className="text-3xl font-bold text-yellow-600 mb-1">
                        {topThree[0][selectedCategory].toFixed(3)}
                      </div>
                      <div className="text-xs text-neutral-600 font-semibold">{t.champion}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tercer lugar */}
              {topThree[2] && (
                <div className="md:order-3 order-3">
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-4 border-2 border-orange-300 shadow-soft-lg hover:shadow-soft-xl transition-all transform hover:scale-105">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full mb-3 shadow-lg">
                        <span className="text-xl font-bold text-white">3</span>
                      </div>
                      <h4 className="font-bold text-base text-neutral-900 mb-2 line-clamp-2">{topThree[2].team}</h4>
                      <div className="text-2xl font-bold text-orange-600 mb-1">
                        {topThree[2][selectedCategory].toFixed(3)}
                      </div>
                      <div className="text-xs text-neutral-600">{t.points}</div>
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
              {t.completeClassification}
            </h3>
            <span className="ml-auto text-sm text-neutral-600">
              {filteredResults.length} {t.teams}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b-2 border-neutral-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-neutral-700 uppercase tracking-wide">{t.position}</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-neutral-700 uppercase tracking-wide">{t.team}</th>
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
                {t.noResults}
              </h3>
              <p className="text-neutral-600">
                {t.tryAnother}
              </p>
            </div>
          )}
        </div>
        </>
        )}

        {/* Contenido Ranking ACA 2025 */}
        {activeTab === 'aca2025' && (
        <>
          <div className="bg-white rounded-2xl shadow-soft-lg overflow-hidden animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="px-6 py-4 bg-neutral-50 border-b border-neutral-200 flex items-center gap-3">
              <Award className="h-6 w-6 text-primary-600" />
              <h3 className="text-xl font-bold text-neutral-900">
                Ranking ACA 2025
              </h3>
              <span className="ml-auto text-sm text-neutral-600">
                {RANKING_ACA_2025.length} equipos
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b-2 border-neutral-200">
                  <tr>
                    <th className="px-4 py-4 text-left text-xs sm:text-sm font-bold text-neutral-700 uppercase tracking-wide">Lugar</th>
                    <th className="px-4 py-4 text-left text-xs sm:text-sm font-bold text-neutral-700 uppercase tracking-wide">Equipo</th>
                    <th className="px-3 py-4 text-center text-xs sm:text-sm font-bold text-neutral-700 uppercase tracking-wide hidden sm:table-cell">Nva Imperial</th>
                    <th className="px-3 py-4 text-center text-xs sm:text-sm font-bold text-neutral-700 uppercase tracking-wide hidden sm:table-cell">RGF</th>
                    <th className="px-3 py-4 text-center text-xs sm:text-sm font-bold text-neutral-700 uppercase tracking-wide hidden md:table-cell">Talca</th>
                    <th className="px-3 py-4 text-center text-xs sm:text-sm font-bold text-neutral-700 uppercase tracking-wide hidden md:table-cell">SGF</th>
                    <th className="px-4 py-4 text-center text-xs sm:text-sm font-bold text-primary-700 uppercase tracking-wide">Final</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {RANKING_ACA_2025.map((equipo) => {
                    const isPodium = equipo.lugar <= 3;
                    const isChampion = equipo.lugar === 1;
                    
                    return (
                      <tr 
                        key={equipo.equipo}
                        onClick={() => setSelectedEquipoACA(equipo)}
                        className={`transition-all hover:bg-neutral-50 cursor-pointer hover:shadow-md ${
                          isPodium ? 'bg-gradient-to-r from-yellow-50/50 to-transparent' : ''
                        }`}
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            {equipo.lugar === 1 && (
                              <div className="flex flex-col items-center">
                                <span className="text-xs font-bold text-yellow-600 mb-0.5">1°</span>
                                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 text-yellow-50">
                                  <Trophy className="h-5 w-5" />
                                </div>
                              </div>
                            )}
                            {equipo.lugar === 2 && (
                              <div className="flex flex-col items-center">
                                <span className="text-xs font-bold text-gray-600 mb-0.5">2°</span>
                                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 text-gray-50">
                                  <Medal className="h-5 w-5" />
                                </div>
                              </div>
                            )}
                            {equipo.lugar === 3 && (
                              <div className="flex flex-col items-center">
                                <span className="text-xs font-bold text-orange-600 mb-0.5">3°</span>
                                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-orange-50">
                                  <Award className="h-5 w-5" />
                                </div>
                              </div>
                            )}
                            {equipo.lugar > 3 && (
                              <div className="w-10 h-10 flex items-center justify-center">
                                <span className="text-lg font-bold text-neutral-600">{equipo.lugar}°</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className={`font-semibold ${isChampion ? 'text-yellow-700' : 'text-neutral-900'}`}>
                            {equipo.equipo}
                          </div>
                        </td>
                        <td className="px-3 py-4 text-center hidden sm:table-cell">
                          <span className={`inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-lg text-sm font-semibold ${
                            equipo.nvaImperial === 23 
                              ? 'bg-neutral-100 text-neutral-400' 
                              : equipo.nvaImperial <= 3
                              ? 'bg-green-100 text-green-700'
                              : 'bg-neutral-50 text-neutral-700'
                          }`}>
                            {equipo.nvaImperial}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-center hidden sm:table-cell">
                          <span className={`inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-lg text-sm font-semibold ${
                            equipo.rgf === 23 
                              ? 'bg-neutral-100 text-neutral-400' 
                              : equipo.rgf <= 3
                              ? 'bg-green-100 text-green-700'
                              : 'bg-neutral-50 text-neutral-700'
                          }`}>
                            {equipo.rgf}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-center hidden md:table-cell">
                          <span className={`inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-lg text-sm font-semibold ${
                            equipo.talca === 23 
                              ? 'bg-neutral-100 text-neutral-400' 
                              : equipo.talca <= 3
                              ? 'bg-green-100 text-green-700'
                              : 'bg-neutral-50 text-neutral-700'
                          }`}>
                            {equipo.talca}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-center hidden md:table-cell">
                          <span className={`inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-lg text-sm font-semibold ${
                            equipo.sgf === 23 
                              ? 'bg-neutral-100 text-neutral-400' 
                              : equipo.sgf <= 3
                              ? 'bg-green-100 text-green-700'
                              : 'bg-neutral-50 text-neutral-700'
                          }`}>
                            {equipo.sgf}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className={`text-lg font-bold ${
                            isChampion ? 'text-yellow-600' : 'text-primary-600'
                          }`}>
                            {equipo.final.toFixed(1)}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Leyenda */}
            <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200">
              <div className="flex flex-wrap gap-4 text-xs text-neutral-600">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-green-100"></div>
                  <span>Top 3 en evento</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-neutral-100"></div>
                  <span>No participó (23 = posición por defecto)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Modal de detalle de equipo ACA 2025 */}
          {selectedEquipoACA && (
            <div 
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
              onClick={() => setSelectedEquipoACA(null)}
            >
              <div 
                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header del modal */}
                <div className="sticky top-0 bg-gradient-to-br from-primary-600 to-primary-700 text-white px-6 py-5 rounded-t-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {selectedEquipoACA.lugar === 1 && <Trophy className="h-7 w-7 text-yellow-300" />}
                      {selectedEquipoACA.lugar === 2 && <Medal className="h-7 w-7 text-gray-300" />}
                      {selectedEquipoACA.lugar === 3 && <Award className="h-7 w-7 text-orange-400" />}
                      <div>
                        <h2 className="text-2xl font-bold">{selectedEquipoACA.equipo}</h2>
                        <p className="text-sm text-primary-100 mt-1">
                          Puesto #{selectedEquipoACA.lugar} • Final: {selectedEquipoACA.final.toFixed(1)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedEquipoACA(null)}
                      className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-2 transition-colors"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                {/* Contenido del modal */}
                <div className="p-6 space-y-6">
                  {/* Resumen */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-neutral-50 rounded-xl p-4 text-center">
                      <div className="text-sm text-neutral-600 mb-1">Mejor Resultado</div>
                      <div className="text-3xl font-bold text-primary-600">
                        {Math.min(
                          selectedEquipoACA.nvaImperial === 23 ? Infinity : selectedEquipoACA.nvaImperial,
                          selectedEquipoACA.rgf === 23 ? Infinity : selectedEquipoACA.rgf,
                          selectedEquipoACA.talca === 23 ? Infinity : selectedEquipoACA.talca,
                          selectedEquipoACA.sgf === 23 ? Infinity : selectedEquipoACA.sgf
                        )}°
                      </div>
                    </div>
                    <div className="bg-neutral-50 rounded-xl p-4 text-center">
                      <div className="text-sm text-neutral-600 mb-1">Eventos Participados</div>
                      <div className="text-3xl font-bold text-primary-600">
                        {[selectedEquipoACA.nvaImperial, selectedEquipoACA.rgf, selectedEquipoACA.talca, selectedEquipoACA.sgf]
                          .filter(pos => pos !== 23).length} / 4
                      </div>
                    </div>
                  </div>

                  {/* Detalle de torneos */}
                  <div>
                    <h3 className="text-lg font-bold text-neutral-900 mb-4">Resultados por Torneo</h3>
                    <div className="space-y-3">
                      {/* Nueva Imperial */}
                      <div className={`rounded-xl p-4 border-2 ${
                        selectedEquipoACA.nvaImperial === 23 
                          ? 'border-neutral-200 bg-neutral-50' 
                          : selectedEquipoACA.nvaImperial <= 3
                          ? 'border-green-200 bg-green-50'
                          : 'border-primary-200 bg-primary-50'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-neutral-900">Nueva Imperial</div>
                            <div className="text-sm text-neutral-600">Primer torneo del año</div>
                          </div>
                          <div className={`text-3xl font-bold ${
                            selectedEquipoACA.nvaImperial === 23 ? 'text-neutral-400' : 'text-neutral-900'
                          }`}>
                            {selectedEquipoACA.nvaImperial === 23 ? 'N/P' : `${selectedEquipoACA.nvaImperial}°`}
                          </div>
                        </div>
                      </div>

                      {/* RGF */}
                      <div className={`rounded-xl p-4 border-2 ${
                        selectedEquipoACA.rgf === 23 
                          ? 'border-neutral-200 bg-neutral-50' 
                          : selectedEquipoACA.rgf <= 3
                          ? 'border-green-200 bg-green-50'
                          : 'border-primary-200 bg-primary-50'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-neutral-900">RGF (Reñaca)</div>
                            <div className="text-sm text-neutral-600">Regional Grill Fest</div>
                          </div>
                          <div className={`text-3xl font-bold ${
                            selectedEquipoACA.rgf === 23 ? 'text-neutral-400' : 'text-neutral-900'
                          }`}>
                            {selectedEquipoACA.rgf === 23 ? 'N/P' : `${selectedEquipoACA.rgf}°`}
                          </div>
                        </div>
                      </div>

                      {/* Talca */}
                      <div className={`rounded-xl p-4 border-2 ${
                        selectedEquipoACA.talca === 23 
                          ? 'border-neutral-200 bg-neutral-50' 
                          : selectedEquipoACA.talca <= 3
                          ? 'border-green-200 bg-green-50'
                          : 'border-primary-200 bg-primary-50'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-neutral-900">Talca</div>
                            <div className="text-sm text-neutral-600">Campeonato en Talca</div>
                          </div>
                          <div className={`text-3xl font-bold ${
                            selectedEquipoACA.talca === 23 ? 'text-neutral-400' : 'text-neutral-900'
                          }`}>
                            {selectedEquipoACA.talca === 23 ? 'N/P' : `${selectedEquipoACA.talca}°`}
                          </div>
                        </div>
                      </div>

                      {/* SGF */}
                      <div className={`rounded-xl p-4 border-2 ${
                        selectedEquipoACA.sgf === 23 
                          ? 'border-neutral-200 bg-neutral-50' 
                          : selectedEquipoACA.sgf <= 3
                          ? 'border-green-200 bg-green-50'
                          : 'border-primary-200 bg-primary-50'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-neutral-900">SGF (Santiago)</div>
                            <div className="text-sm text-neutral-600">Santiago Grill Fest</div>
                          </div>
                          <div className={`text-3xl font-bold ${
                            selectedEquipoACA.sgf === 23 ? 'text-neutral-400' : 'text-neutral-900'
                          }`}>
                            {selectedEquipoACA.sgf === 23 ? 'N/P' : `${selectedEquipoACA.sgf}°`}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Nota */}
                  <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-900">
                    <strong>Nota:</strong> N/P indica que el equipo no participó en ese evento. 
                    El promedio se calcula considerando la posición 23 para eventos no participados.
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
        )}
      </div>
    </div>
    </>
  );
}
