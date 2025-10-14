-- Datos de prueba para el sistema de noticias
-- ACA Chile - Blog y sistema de comentarios

-- Insertar categorías de noticias
INSERT INTO news_categories (name, slug, description) VALUES 
('Técnicas de Asado', 'tecnicas-asado', 'Tips y técnicas para perfeccionar tu asado'),
('Eventos', 'eventos', 'Noticias sobre eventos y actividades de la ACA'),
('Recetas', 'recetas', 'Deliciosas recetas para tu parrilla'),
('Noticias Generales', 'noticias', 'Noticias generales de la asociación'),
('Consejos', 'consejos', 'Consejos útiles para asadores');

-- Insertar tags populares
INSERT INTO news_tags (name, slug) VALUES 
('parrilla', 'parrilla'),
('carbón', 'carbon'),
('leña', 'lena'),
('carne', 'carne'),
('pollo', 'pollo'),
('pescado', 'pescado'),
('vegetariano', 'vegetariano'),
('principiantes', 'principiantes'),
('avanzado', 'avanzado'),
('tips', 'tips'),
('concurso', 'concurso'),
('evento', 'evento'),
('técnica', 'tecnica'),
('receta', 'receta'),
('temporada', 'temporada');

-- Insertar artículos de ejemplo
INSERT INTO news_articles (
  title, slug, excerpt, content, category_id, author_id, status, 
  featured_image, views, published_at
) VALUES 

-- Artículo 1: Técnicas
(
  'Los 5 Secretos para un Asado Perfecto',
  'secretos-asado-perfecto',
  'Descubre las técnicas fundamentales que todo maestro asador debe conocer para lograr resultados excepcionales.',
  '# Los 5 Secretos para un Asado Perfecto

¡Bienvenidos asadores! Hoy compartimos los secretos mejor guardados para lograr un asado que deleite a todos tus invitados.

## 1. La Preparación del Fuego

El fuego es el alma del asado. No se trata solo de encender carbón, sino de crear las condiciones perfectas:

- **Usa carbón de calidad**: Prefiere carbón vegetal o leña seca
- **Tiempo de preparación**: Inicia el fuego 45-60 minutos antes
- **Zonas de calor**: Crea zonas de calor directo e indirecto

## 2. Selección y Preparación de la Carne

La carne es la estrella, pero requiere preparación:

- **Temperatura ambiente**: Saca la carne 30 minutos antes
- **Sal gruesa**: Aplica sal gruesa 20 minutos antes de cocinar
- **Cortes de calidad**: Invierte en buenos cortes de carne

## 3. Tiempos y Temperaturas

Cada corte tiene su tiempo perfecto:

- **Chorizo**: 15-20 minutos
- **Pollo**: 25-30 minutos por lado
- **Vacuno**: Según grosor, 4-6 minutos por lado para término medio

## 4. El Arte de dar Vuelta

- **Una sola vez**: No manipules excesivamente la carne
- **Señales visuales**: Espera que se despegue naturalmente
- **Pinzas, no tenedor**: Evita perforar y perder jugos

## 5. El Reposo Final

El secreto final que marca la diferencia:

- **Tiempo de reposo**: 5-10 minutos después de cocinar
- **Papel aluminio**: Envuelve ligeramente
- **Redistribución de jugos**: Permite que se redistribuyan

¡Con estos secretos, tu próximo asado será inolvidable!',
  1, -- Técnicas de Asado
  1, -- Author ID (asumiendo admin)
  'published',
  'https://images.unsplash.com/photo-1544025162-d76694265947?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
  156,
  '2024-10-10 10:00:00'
),

-- Artículo 2: Eventos
(
  'Gran Campeonato Nacional de Asado 2024',
  'campeonato-nacional-asado-2024',
  'Se acerca el evento más esperado del año. Conoce todos los detalles para participar en el Campeonato Nacional de Asado.',
  '# Gran Campeonato Nacional de Asado 2024

¡El evento más esperado del año está llegando! La Asociación Chilena de Asadores (ACA) se complace en anunciar el **Campeonato Nacional de Asado 2024**.

## Fechas y Ubicación

- **Fecha**: 15 y 16 de Diciembre, 2024
- **Lugar**: Parque O''Higgins, Santiago
- **Horario**: 10:00 AM - 8:00 PM ambos días

## Categorías de Competencia

### Categoría Principiantes
Para asadores con menos de 2 años de experiencia en competencias.

### Categoría Intermedio  
Para asadores con 2-5 años de experiencia.

### Categoría Maestros
Para los verdaderos maestros del asado con más de 5 años.

### Categoría Teams
Equipos de 2-4 personas trabajando juntos.

## Premios

- **1er Lugar cada categoría**: $500.000 + Trofeo + Set parrillero premium
- **2do Lugar**: $300.000 + Medalla + Kit de condimentos
- **3er Lugar**: $150.000 + Medalla + Delantal oficial ACA

## Cómo Participar

1. **Inscripciones**: Del 1 al 30 de Noviembre
2. **Costo**: $25.000 por participante
3. **Incluye**: Kit de participante, almuerzo y certificado

## Criterios de Evaluación

Los jueces evaluarán basándose en:
- **Sabor (40%)**
- **Presentación (25%)**
- **Técnica (20%)**
- **Creatividad (15%)**

## Inscríbete Ya

Las cupos son limitados. ¡No te quedes fuera del evento más importante del asado chileno!

**Contacto**: campeonato@acachile.cl',
  2, -- Eventos
  1, 
  'published',
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
  89,
  '2024-10-12 14:30:00'
),

-- Artículo 3: Recetas
(
  'Cordero Patagónico: Receta Tradicional',
  'cordero-patagonico-receta-tradicional',
  'Aprende a preparar el cordero patagónico siguiendo la receta tradicional que ha pasado de generación en generación.',
  '# Cordero Patagónico: Receta Tradicional

El cordero patagónico es una de las joyas gastronómicas de Chile. Esta receta tradicional te permitirá preparar esta delicia en casa.

## Ingredientes

### Para el cordero (4-6 personas)
- 1 pierna de cordero (2-3 kg)
- 3 dientes de ajo
- 2 cucharadas de merkén
- 1 cucharada de sal gruesa
- 1 cucharadita de pimienta negra
- 2 cucharadas de aceite de oliva
- 1 ramita de romero fresco
- 1 ramita de tomillo

### Para el adobo
- 1 taza de vino tinto
- 2 cucharadas de vinagre de vino
- 1 cebolla cortada en juliana
- 2 zanahorias en rodelas
- 2 hojas de laurel

## Preparación

### Día Anterior
1. **Limpieza**: Limpia bien la pierna de cordero, retirando excesos de grasa
2. **Adobo**: Mezcla todos los ingredientes del adobo
3. **Marinado**: Coloca el cordero en el adobo por 12-24 horas

### Día de Cocción

#### Preparación del Fuego
1. Prepara un fuego de leña o carbón con calor medio-bajo
2. Busca mantener temperatura constante de 160-180°C
3. Prepara zonas de calor directo e indirecto

#### Cocción
1. **Sellado (15 min)**: Sella el cordero por todos lados en calor directo
2. **Condimentado**: Aplica la mezcla de especias por toda la superficie
3. **Cocción lenta (2-3 horas)**: Cocina en calor indirecto
4. **Control de temperatura**: La carne debe alcanzar 60°C interno para término medio

#### Durante la Cocción
- Voltea cada 30-45 minutos
- Rocía con el adobo restante cada hora
- Mantén el fuego constante añadiendo carbón según necesidad

## Acompañamientos Tradicionales

- **Papas al rescoldo**
- **Ensalada chilena**
- **Pebre picante**
- **Vino tinto carmenere o cabernet sauvignon**

## Tips del Maestro

- **Paciencia**: La cocción lenta es clave para la textura
- **Termómetro**: Usa un termómetro de carne para precisión
- **Reposo**: Deja reposar 15 minutos antes de cortar

¡Disfruta de esta experiencia culinaria única!',
  3, -- Recetas
  1,
  'published',
  'https://images.unsplash.com/photo-1546833999-b9f581a1996d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
  234,
  '2024-10-08 16:45:00'
);

-- Relacionar artículos con tags
INSERT INTO news_article_tags (article_id, tag_id) VALUES
-- Secretos para asado perfecto
(1, 1), -- parrilla
(1, 2), -- carbón  
(1, 4), -- carne
(1, 8), -- principiantes
(1, 10), -- tips
(1, 13), -- técnica

-- Campeonato nacional
(2, 11), -- concurso
(2, 12), -- evento
(2, 15), -- temporada

-- Cordero patagónico
(3, 1), -- parrilla
(3, 3), -- leña
(3, 4), -- carne
(3, 9), -- avanzado
(3, 14); -- receta