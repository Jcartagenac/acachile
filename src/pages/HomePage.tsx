import React from 'react';
import { Container } from '../components/ui/Container';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';

export const HomePage: React.FC = () => {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white">
        <Container>
          <div className="py-24 md:py-32">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Asociación Chilena de Asadores
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-primary-100">
                Nos reunimos amantes de los fuegos, las brasas y la parrilla. 
                Únete a la comunidad parrillera más grande de Chile.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary">
                  Conócenos
                </Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary-700">
                  Únete a ACA
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Próximos Eventos */}
      <section className="section-padding">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Próximos Eventos</h2>
            <p className="text-lg text-secondary-600 max-w-2xl mx-auto">
              Conoce nuestros próximos eventos y competencias
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="text-primary-600 text-sm font-medium mb-2">22-23 NOV 2025</div>
                <h3 className="font-bold text-lg mb-2">WBQA International BBQ Championship</h3>
                <p className="text-secondary-600 text-sm mb-4">Viña del Mar, Chile</p>
                <Button size="sm" variant="outline" className="w-full">Ver Detalles</Button>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-primary-600 text-sm font-medium mb-2">PRÓXIMAMENTE</div>
                <h3 className="font-bold text-lg mb-2">Taller de Salsas a la Parrilla</h3>
                <p className="text-secondary-600 text-sm mb-4">Santiago, Chile</p>
                <Button size="sm" variant="outline" className="w-full">Ver Detalles</Button>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-primary-600 text-sm font-medium mb-2">PRÓXIMAMENTE</div>
                <h3 className="font-bold text-lg mb-2">Torneo ACA Regional</h3>
                <p className="text-secondary-600 text-sm mb-4">Por definir</p>
                <Button size="sm" variant="outline" className="w-full">Ver Detalles</Button>
              </CardContent>
            </Card>
          </div>
          <div className="text-center">
            <Button variant="outline">Ver Todos los Eventos</Button>
          </div>
        </Container>
      </section>

      {/* Últimas Noticias */}
      <section className="section-padding bg-secondary-50">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Últimas Noticias</h2>
            <p className="text-lg text-secondary-600 max-w-2xl mx-auto">
              Mantente al día con las últimas novedades de ACA
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <div className="aspect-video bg-secondary-200 rounded-t-xl"></div>
              <CardContent className="p-6">
                <div className="text-primary-600 text-sm font-medium mb-2">TORNEO</div>
                <h3 className="font-bold text-lg mb-2">Chile brilla en el Campeonato Internacional de Asadores</h3>
                <p className="text-secondary-600 text-sm mb-4">
                  El equipo "QUINTA PARRILLA" se quedó con el tercer lugar en Argentina.
                </p>
                <Button size="sm" variant="ghost">Leer más →</Button>
              </CardContent>
            </Card>
            <Card>
              <div className="aspect-video bg-secondary-200 rounded-t-xl"></div>
              <CardContent className="p-6">
                <div className="text-primary-600 text-sm font-medium mb-2">INTERNACIONAL</div>
                <h3 className="font-bold text-lg mb-2">Fuego y sabor desde Chile hasta Alemania</h3>
                <p className="text-secondary-600 text-sm mb-4">
                  Tres equipos chilenos compitieron en el torneo mundial en Stuttgart.
                </p>
                <Button size="sm" variant="ghost">Leer más →</Button>
              </CardContent>
            </Card>
            <Card>
              <div className="aspect-video bg-secondary-200 rounded-t-xl"></div>
              <CardContent className="p-6">
                <div className="text-primary-600 text-sm font-medium mb-2">EVENTO</div>
                <h3 className="font-bold text-lg mb-2">Santiago Grill Festival 2023</h3>
                <p className="text-secondary-600 text-sm mb-4">
                  Participación destacada de ACA en el festival más grande del país.
                </p>
                <Button size="sm" variant="ghost">Leer más →</Button>
              </CardContent>
            </Card>
          </div>
          <div className="text-center mt-8">
            <Button variant="outline">Ver Todas las Noticias</Button>
          </div>
        </Container>
      </section>

      {/* Partners */}
      <section className="section-padding">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Pertenecemos a</h2>
            <p className="text-lg text-secondary-600 max-w-2xl mx-auto">
              Somos la única asociación nacional que pertenece a organizaciones internacionales
            </p>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-70">
            <div className="bg-secondary-100 p-6 rounded-lg">
              <div className="text-center text-secondary-600 font-medium">CONFEDERACIÓN PANAMERICANA</div>
            </div>
            <div className="bg-secondary-100 p-6 rounded-lg">
              <div className="text-center text-secondary-600 font-medium">WORLD BARBECUE ASSOCIATION</div>
            </div>
            <div className="bg-secondary-100 p-6 rounded-lg">
              <div className="text-center text-secondary-600 font-medium">UNAPYME CHILE</div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
};