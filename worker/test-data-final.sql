-- Datos de prueba corregidos usando las columnas exactas
-- ACA Chile - Artículos de ejemplo

-- Insertar tags si no existen (usando INSERT OR IGNORE)
INSERT OR IGNORE INTO news_tags (name, slug) VALUES 
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

-- Insertar artículos de ejemplo usando categorías existentes y columnas correctas
INSERT INTO news_articles (
  title, slug, excerpt, content, category_id, author_id, status, 
  featured_image, view_count, published_at
) VALUES 

-- Artículo 1: Técnicas (usando categoría id=4 "Técnicas")
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
  4, -- Técnicas
  1, -- Author ID (asumiendo admin)
  'published',
  'https://images.unsplash.com/photo-1544025162-d76694265947?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
  156,
  '2024-10-10 10:00:00'
),

-- Artículo 2: Eventos (usando categoría id=1 "Eventos")
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

¡Inscríbete ya y forma parte del evento más importante del asado chileno!',
  1, -- Eventos
  1, 
  'published',
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
  89,
  '2024-10-12 14:30:00'
),

-- Artículo 3: Talleres (usando categoría id=3 "Talleres")
(
  'Nuevo Taller: Técnicas de Ahumado Tradicional',
  'taller-tecnicas-ahumado-tradicional',
  'Aprende las técnicas ancestrales de ahumado con nuestro taller especializado dirigido por el maestro Carlos Mendoza.',
  '# Nuevo Taller: Técnicas de Ahumado Tradicional

La ACA Chile se complace en presentar nuestro nuevo taller especializado en técnicas de ahumado tradicional.

## Detalles del Taller

- **Instructor**: Carlos Mendoza, Maestro Ahumador
- **Fecha**: Sábado 30 de Noviembre, 2024
- **Horario**: 9:00 AM - 4:00 PM
- **Lugar**: Centro de Capacitación ACA, Las Condes
- **Cupos**: Limitados a 15 participantes

## Qué Aprenderás

### Fundamentos del Ahumado
- Historia y tradición del ahumado
- Diferencias entre ahumado frío y caliente
- Selección de maderas y combustibles

### Técnicas Prácticas
- Preparación de ahumadores caseros
- Control de temperatura y humedad
- Tiempos de ahumado según el producto

### Productos a Ahumar
- Salmón ahumado tradicional
- Costillar de cerdo
- Quesos y vegetales

## Incluye
- Manual técnico de ahumado
- Kit básico de herramientas
- Almuerzo y degustación
- Certificado de participación

**Inversión**: $85.000 por persona
**Inscripciones**: Hasta el 25 de Noviembre

¡Cupos limitados! Reserva tu lugar ahora.',
  3, -- Talleres
  1,
  'published',
  'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
  67,
  '2024-10-13 11:15:00'
);

-- Insertar algunos comentarios de ejemplo
INSERT INTO news_comments (
  article_id, author_name, author_email, content, status, created_at
) VALUES
(1, 'María González', 'maria.g@email.com', 'Excelentes consejos! Los voy a aplicar en mi próximo asado familiar. Especialmente lo del reposo, nunca lo había considerado.', 'approved', '2024-10-11 15:30:00'),
(1, 'Pedro Morales', 'pedro.m@email.com', '¿Qué tipo de carbón recomiendan específicamente? He probado varias marcas y no noto diferencia.', 'approved', '2024-10-11 18:45:00'),
(2, 'Ana Silva', 'ana.silva@email.com', '¡Increíble! Ya me inscribí para la categoría principiantes. Será mi primera competencia oficial 😊', 'approved', '2024-10-12 20:15:00'),
(2, 'Carlos Rodríguez', 'c.rodriguez@email.com', 'Participé el año pasado y fue una experiencia increíble. La organización es de primera clase.', 'approved', '2024-10-13 09:20:00'),
(3, 'Luis Fernández', 'luis.f@email.com', 'Me interesa mucho el taller. ¿Habrá más fechas disponibles? No puedo el 30 de noviembre.', 'approved', '2024-10-13 16:40:00');