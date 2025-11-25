// Script urgente para migrar noticias de KV a D1 antes de que se pierdan
// Las noticias en KV tienen TTL de 24 horas

const noticias = [
  {
    id: 2,
    title: "🔥 ¡El Intercontinental de Asadores 2025 será totalmente GRATIS! 🔥",
    slug: "el-intercontinental-de-asadores-2025-sera-totalmente-gratis",
    excerpt: "Gracias al apoyo del Consejo y Gobierno Regional de Valparaíso, este año podrás vivir la gran fiesta mundial del fuego.",
    content: "<div>\n  <p>\n    Gracias al apoyo del Consejo y Gobierno Regional de Valparaíso, este año podrás vivir la gran fiesta mundial del fuego, el sabor y la parrilla, sin costo de entrada.\n  </p>\n\n  <p>\n    Más de 80 equipos de 40 países 🌎 se reunirán en Viña del Mar para competir por el título de los mejores asadores del mundo.\n    Una experiencia imperdible para los amantes de la carne, el fuego y la buena compañía.\n  </p>\n\n  <ul>\n    <li>🎶 Música en vivo</li>\n    <li>🍖 Competencias internacionales</li>\n    <li>🍽️ Degustaciones</li>\n    <li>🍔 +40 stands gastronómicos</li>\n    <li>👨‍🍳 Experiencias con maestros parrilleros</li>\n    <li>🐾 ¡Pet friendly!</li>\n  </ul>\n\n  <p>📅 22 y 23 de noviembre</p>\n  <p>📍 Sporting Club, Viña del Mar</p>\n  <p>🕛 De 12:00 a 22:00 hrs</p>\n\n  <p>\n    🎟️ Descarga tu entrada gratuita \n    <a href=\"https://acachile.com/eventos/17\" target=\"_blank\" rel=\"noopener noreferrer\">acá</a>.\n  </p>\n</div>",
    featured_image: "https://images.acachile.com/home/img-1763404558914-nw91wm.jpg",
    author_id: 1,
    category_id: 3,
    status: "published",
    is_featured: false,
    view_count: 56,
    published_at: "2025-11-17T18:36:05.579Z",
    created_at: "2025-11-17T18:36:05.579Z"
  },
  {
    id: 3, // Corregir ID - no puede ser 1 duplicado
    title: "Brasil conquista el Mundial de Asadores 2025 mientras que Chile domina en cuatro categorías",
    slug: "brasil-conquista-el-mundial-de-asadores-2025-mientras-que-chile-domina-en-cuatro-categorias",
    excerpt: "Equipos chilenos obtuvieron primeros lugares en Pollo, Beef, Conejo y Pescado en el Torneo Intercontinental de Asadores.",
    content: "Equipos chilenos obtuvieron primeros lugares en Pollo, Beef, Conejo y Pescado en el Torneo Intercontinental de Asadores que reunió a 80 equipos en competencia.  \n \nLa delegación brasileña Brazilian Barbecue Team 1, se coronó campeona en la categoría general, mientras que Chile obtuvo el primer lugar en cuatro categorías, en el Mundial de Asadores 2025, celebrado este fin de semana en el Sporting Club de Viña del Mar, torneo organizado por la World Barbecue Association (WBQA) y la Asociación Chilena de Asadores (ACA)\n \nLos equipos chilenos Aconcagua Grill, Andes Grill, A Modo Mio y Eventos de Fuego, conquistaron el primer lugar de las categorías Pollo, Beef, Conejo y Pescado respectivamente, demostrando el alto nivel técnico y la excelencia culinaria de los asadores nacionales, ante más de 100 jueces certificados por la WBQA.\n \nVianca Galdames, presidenta de la ACA destacó el ambiente vivido en la ciudad jardín señalando que " estamos tremendamente orgullosos del desempeño de todos los competidores, en especial de nuestros equipos chilenos, quienes entregaron al país los primeros lugares en categoría muy competitivas, lo que demuestra que poseemos asadores con técnicas y talentos excepcionales"\n \n" Hemos logrado reunir a más de 20 mil personas que asistieron a un evento de clase mundial, donde no sólo la familia disfrutó de un torneo de primer nivel, sino que además pudo disfrutar de dos días lleno de actividades, talleres, música, show y una feria gastronómica con lo mejor de los emprendimientos regionales, en un ambiente festivo, familiar y de alta gastronomía mundial" Señaló Braulio Elicer, productor general del evento. \n \nEl Mundial de Asadores 2025 se enmarca en el evento Trilogía Gastronómica, lanzado el gobierno de Chile, iniciativa  que incluye ENGATUSA y la Ruta Enoturismo Chile, posicionando al país como un destino gastronómico de clase mundial. \n",
    featured_image: "https://images.acachile.com/home/img-1764029987298-mor4hk.jpg",
    author_id: 1,
    category_id: 5,
    status: "published",
    is_featured: false,
    view_count: 4,
    published_at: "2025-11-25T00:19:56.186Z",
    created_at: "2025-11-25T00:19:56.186Z"
  }
];

console.log('Noticias a migrar:', noticias.length);
console.log(JSON.stringify(noticias, null, 2));
