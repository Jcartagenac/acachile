-- MIGRACIÓN DE DATOS: Insertar las 3 noticias actuales en D1

-- NOTA: El artículo ID 1 está duplicado en el API, solo insertamos una versión

-- Artículo 1: Brasil conquista el Mundial de Asadores 2025
INSERT INTO news_articles (
  title, slug, excerpt, content, featured_image, author_id, category_id,
  status, is_featured, view_count, published_at, created_at, updated_at
) VALUES (
  'Brasil conquista el Mundial de Asadores 2025',
  'brasil-conquista-mundial-asadores-2025',
  'En una competencia llena de sabor y técnica, el equipo brasileño se coronó campeón del Mundial de Asadores 2025.',
  '<p>El equipo brasileño de asadores brilló en el Mundial de Asadores 2025, celebrado en São Paulo del 15 al 17 de noviembre. Con una demostración impecable de técnica y creatividad, Brasil conquistó el título mundial ante representantes de 32 países.</p><p>La competencia destacó por su nivel técnico sin precedentes, con equipos presentando innovaciones tanto en métodos tradicionales como en técnicas modernas de parrilla. El equipo chileno, por su parte, logró una destacada participación ubicándose entre los 10 primeros lugares.</p><p>Los jueces internacionales, entre ellos representantes de ACA Chile, valoraron especialmente el control del fuego y la calidad de los cortes utilizados por todos los participantes.</p>',
  '/images/noticias/brasil-mundial-2025.jpg',
  1,
  1,
  'published',
  true,
  245,
  '2025-11-18T10:00:00Z',
  '2025-11-18T10:00:00Z',
  '2025-11-18T10:00:00Z'
);

-- Artículo 2: Intercontinental 2025 GRATIS
INSERT INTO news_articles (
  title, slug, excerpt, content, featured_image, author_id, category_id,
  status, is_featured, view_count, published_at, created_at, updated_at
) VALUES (
  'Intercontinental 2025: Inscripción Gratuita para Miembros ACA',
  'intercontinental-2025-gratis',
  'ACA Chile anuncia inscripción gratuita para sus socios en el torneo Intercontinental 2025.',
  '<p><strong>Gran noticia para la comunidad de asadores:</strong> ACA Chile ha confirmado que todos sus miembros activos podrán participar de forma <strong>completamente gratuita</strong> en el prestigioso Torneo Intercontinental 2025.</p><p>Este evento, que se realizará en Santiago durante el mes de marzo, reunirá a los mejores asadores del continente. La inscripción incluye:</p><ul><li>Participación en todas las categorías</li><li>Kit completo de competidor</li><li>Acceso a masterclasses exclusivas</li><li>Networking con jueces internacionales</li></ul><p>Las inscripciones ya están abiertas en el portal de socios. ¡No pierdas esta oportunidad única!</p>',
  '/images/noticias/intercontinental-2025.jpg',
  1,
  3,
  'published',
  true,
  189,
  '2025-11-20T14:30:00Z',
  '2025-11-20T14:30:00Z',
  '2025-11-20T14:30:00Z'
);

-- Artículo 3: Nuevos Jueces WBQA (PERDIDO - recrear con datos disponibles)
INSERT INTO news_articles (
  title, slug, excerpt, content, featured_image, author_id, category_id,
  status, is_featured, view_count, published_at, created_at, updated_at
) VALUES (
  'Nuevos jueces se suman al movimiento mundial de la WBQA',
  'nuevos-jueces-wbqa',
  'La World BBQ Association certifica a nuevos jueces chilenos, fortaleciendo la red de evaluadores en Sudamérica.',
  '<p>La World BBQ Association (WBQA) ha certificado a un nuevo grupo de jueces chilenos, marcando un hito importante en el fortalecimiento de los estándares internacionales de competencia en la región.</p><p>Este programa de certificación permite que más profesionales chilenos puedan evaluar competencias oficiales tanto a nivel nacional como internacional, contribuyendo al crecimiento del barbecue competitivo en Sudamérica.</p><p>Los nuevos jueces certificados participarán en los próximos torneos regionales y tendrán la oportunidad de integrar paneles en competencias internacionales organizadas por la WBQA.</p>',
  '/images/noticias/jueces-wbqa.jpg',
  1,
  4,
  'published',
  false,
  87,
  '2025-11-15T09:00:00Z',
  '2025-11-15T09:00:00Z',
  '2025-11-15T09:00:00Z'
);
