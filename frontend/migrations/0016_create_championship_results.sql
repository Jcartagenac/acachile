-- Migration: Create Championship Results Tables
-- Description: Store WBQA International BBQ Championship results with teams, categories and scores

-- Create Championships table
CREATE TABLE IF NOT EXISTS championships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  year INTEGER NOT NULL,
  location TEXT,
  start_date TEXT,
  end_date TEXT,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'archived', 'draft')),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Create index on championships
CREATE INDEX IF NOT EXISTS idx_championships_year ON championships(year);
CREATE INDEX IF NOT EXISTS idx_championships_status ON championships(status);

-- Create Categories table
CREATE TABLE IF NOT EXISTS championship_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  championship_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  key TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (championship_id) REFERENCES championships(id) ON DELETE CASCADE
);

-- Create index on categories
CREATE INDEX IF NOT EXISTS idx_categories_championship ON championship_categories(championship_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_key ON championship_categories(championship_id, key);

-- Create Teams table
CREATE TABLE IF NOT EXISTS championship_teams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  championship_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  country TEXT,
  region TEXT,
  logo_url TEXT,
  description TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (championship_id) REFERENCES championships(id) ON DELETE CASCADE
);

-- Create index on teams
CREATE INDEX IF NOT EXISTS idx_teams_championship ON championship_teams(championship_id);
CREATE INDEX IF NOT EXISTS idx_teams_name ON championship_teams(name);

-- Create Results table (scores by team and category)
CREATE TABLE IF NOT EXISTS championship_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  championship_id INTEGER NOT NULL,
  team_id INTEGER NOT NULL,
  category_id INTEGER NOT NULL,
  score REAL NOT NULL DEFAULT 0,
  position INTEGER,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (championship_id) REFERENCES championships(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES championship_teams(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES championship_categories(id) ON DELETE CASCADE
);

-- Create indexes on results
CREATE INDEX IF NOT EXISTS idx_results_championship ON championship_results(championship_id);
CREATE INDEX IF NOT EXISTS idx_results_team ON championship_results(team_id);
CREATE INDEX IF NOT EXISTS idx_results_category ON championship_results(category_id);
CREATE INDEX IF NOT EXISTS idx_results_score ON championship_results(score DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_results_unique ON championship_results(championship_id, team_id, category_id);

-- Insert WBQA International BBQ Championship Chile 2025
INSERT INTO championships (name, year, location, description, status) VALUES
('WBQA International BBQ Championship', 2025, 'Chile', 'Campeonato internacional de BBQ con 58 equipos participantes de diferentes países', 'active');

-- Get the championship ID (will be 1 if this is the first championship)
-- Insert Categories for the championship
INSERT INTO championship_categories (championship_id, name, key, sort_order) VALUES
(1, 'Overall', 'overall', 0),
(1, 'Chicken', 'chicken', 1),
(1, 'Beef', 'beef', 2),
(1, 'Pork w/bone', 'porkWithBone', 3),
(1, 'Pork wo/bone', 'porkWithoutBone', 4),
(1, 'Fish', 'fish', 5),
(1, 'Rabbit', 'rabbit', 6),
(1, 'Vegetarian', 'vegetarian', 7);

-- Insert all 62 teams
INSERT INTO championship_teams (championship_id, name, country) VALUES
(1, 'Brazilian Barbecue Team 1', 'Brasil'),
(1, 'BBQ Paraguay', 'Paraguay'),
(1, 'Grill On Fire', NULL),
(1, 'Fuego & Fogo', NULL),
(1, 'GrillHub NX', NULL),
(1, 'Eventos de Fuego', NULL),
(1, 'GUATEMALA 1', 'Guatemala'),
(1, 'Escuela Costarricense de Parrilleros', 'Costa Rica'),
(1, 'Guardianes de la Parrilla', NULL),
(1, 'Black Pearl BBQ Crew', NULL),
(1, 'Brasas Peruanas', 'Perú'),
(1, 'Brazilian Barbecue Team 2', 'Brasil'),
(1, 'ICATMOR', NULL),
(1, 'Steiramen BBQ', NULL),
(1, 'Parrilleros de élite', NULL),
(1, 'A Modo Mio', NULL),
(1, 'Swiss Fire Devils BBQ', 'Suiza'),
(1, 'Bros & Fire PTY', 'Panamá'),
(1, 'Guayabos Grill', NULL),
(1, 'Parrillas y Espadas', NULL),
(1, 'West Smoke BBQ', NULL),
(1, 'La Pandilla Parrillera', NULL),
(1, 'Barbakùa', NULL),
(1, 'La Mesa del Laurel', NULL),
(1, 'Fuego del Achibueno', 'Chile'),
(1, 'ACONCAGUA GRILL', 'Chile'),
(1, 'Grillholics Mx', 'México'),
(1, 'Forjadores de Sabor', NULL),
(1, 'Condores de Fuego', 'Chile'),
(1, 'Peaky Blinders', NULL),
(1, 'Brasas Biobio', 'Chile'),
(1, 'Andes Grill', 'Chile'),
(1, 'La Bodega del Asador', NULL),
(1, 'OJO DE BIFFE', NULL),
(1, 'LUMBERJACK BBQ', NULL),
(1, 'Nina Runa Perú', 'Perú'),
(1, 'LECHLER Grill Team', NULL),
(1, 'Rhoener Heimat Griller', 'Alemania'),
(1, 'Las Pibas del Fuego', NULL),
(1, 'Sociedad Parrillera de Nuevo Laredo.', 'México'),
(1, 'Wild West BBQ e.V.', 'Alemania'),
(1, 'Argentina, Fuego y Tradición', 'Argentina'),
(1, 'Oid mortales del fuego', 'Argentina'),
(1, 'Malvinas Argentinas', 'Argentina'),
(1, 'American BBQ', NULL),
(1, 'PAYASO PARRILLERO', NULL),
(1, 'HEREDEROS DE LA PARRILLA', NULL),
(1, 'Humo Parrillada', NULL),
(1, 'WBQA Mexico Center', 'México'),
(1, 'Humo Norteno', 'México'),
(1, 'Caballeros de la Parrilla', NULL),
(1, 'Sabor Canario Uruguay', 'Uruguay'),
(1, 'Sabores y fuegos argentinos', 'Argentina'),
(1, 'DIVINO FOGO', NULL),
(1, 'Mau''s Grill', NULL),
(1, 'Sangre Charrua Uruguay', 'Uruguay'),
(1, 'Argentina, Fuego Sagrado', 'Argentina'),
(1, 'Asadores del Valhala', NULL),
(1, 'Patagonia Entre Brasas y Rios', 'Argentina'),
(1, 'NINA URKU', NULL),
(1, 'TRA', NULL),
(1, 'Nacion de Fuego Peru', 'Perú');

-- Insert all results (team_id corresponds to order above, category_id: 1=overall, 2=chicken, 3=beef, 4=porkWithBone, 5=porkWithoutBone, 6=fish, 7=rabbit, 8=vegetarian)

-- Team 1: Brazilian Barbecue Team 1
INSERT INTO championship_results (championship_id, team_id, category_id, score, position) VALUES
(1, 1, 1, 222.450, 1), (1, 1, 2, 34.600, NULL), (1, 1, 3, 43.150, NULL), (1, 1, 4, 36.800, NULL),
(1, 1, 5, 35.750, NULL), (1, 1, 6, 40.200, NULL), (1, 1, 7, 33.050, NULL), (1, 1, 8, 31.950, NULL);

-- Team 2: BBQ Paraguay
INSERT INTO championship_results (championship_id, team_id, category_id, score, position) VALUES
(1, 2, 1, 222.300, 2), (1, 2, 2, 29.300, NULL), (1, 2, 3, 39.100, NULL), (1, 2, 4, 28.500, NULL),
(1, 2, 5, 45.400, NULL), (1, 2, 6, 37.800, NULL), (1, 2, 7, 44.450, NULL), (1, 2, 8, 42.200, NULL);

-- Team 3: Grill On Fire
INSERT INTO championship_results (championship_id, team_id, category_id, score, position) VALUES
(1, 3, 1, 216.800, 3), (1, 3, 2, 36.000, NULL), (1, 3, 3, 37.650, NULL), (1, 3, 4, 35.350, NULL),
(1, 3, 5, 34.650, NULL), (1, 3, 6, 33.700, NULL), (1, 3, 7, 37.150, NULL), (1, 3, 8, 39.450, NULL);

-- Team 4: Fuego & Fogo
INSERT INTO championship_results (championship_id, team_id, category_id, score, position) VALUES
(1, 4, 1, 214.850, 4), (1, 4, 2, 34.700, NULL), (1, 4, 3, 36.750, NULL), (1, 4, 4, 32.750, NULL),
(1, 4, 5, 33.750, NULL), (1, 4, 6, 37.950, NULL), (1, 4, 7, 36.500, NULL), (1, 4, 8, 38.950, NULL);

-- Team 5: GrillHub NX
INSERT INTO championship_results (championship_id, team_id, category_id, score, position) VALUES
(1, 5, 1, 212.950, 5), (1, 5, 2, 35.150, NULL), (1, 5, 3, 35.250, NULL), (1, 5, 4, 38.300, NULL),
(1, 5, 5, 35.950, NULL), (1, 5, 6, 36.100, NULL), (1, 5, 7, 29.150, NULL), (1, 5, 8, 32.200, NULL);

-- Team 6: Eventos de Fuego
INSERT INTO championship_results (championship_id, team_id, category_id, score, position) VALUES
(1, 6, 1, 212.000, 6), (1, 6, 2, 29.100, NULL), (1, 6, 3, 37.450, NULL), (1, 6, 4, 32.950, NULL),
(1, 6, 5, 33.600, NULL), (1, 6, 6, 42.250, NULL), (1, 6, 7, 37.900, NULL), (1, 6, 8, 36.650, NULL);

-- Team 7: GUATEMALA 1
INSERT INTO championship_results (championship_id, team_id, category_id, score, position) VALUES
(1, 7, 1, 211.000, 7), (1, 7, 2, 35.050, NULL), (1, 7, 3, 33.450, NULL), (1, 7, 4, 40.300, NULL),
(1, 7, 5, 34.650, NULL), (1, 7, 6, 32.550, NULL), (1, 7, 7, 29.450, NULL), (1, 7, 8, 35.000, NULL);

-- Team 8: Escuela Costarricense de Parrilleros
INSERT INTO championship_results (championship_id, team_id, category_id, score, position) VALUES
(1, 8, 1, 209.800, 8), (1, 8, 2, 35.250, NULL), (1, 8, 3, 33.550, NULL), (1, 8, 4, 41.850, NULL),
(1, 8, 5, 34.900, NULL), (1, 8, 6, 31.950, NULL), (1, 8, 7, 36.200, NULL), (1, 8, 8, 32.300, NULL);

-- Team 9: Guardianes de la Parrilla
INSERT INTO championship_results (championship_id, team_id, category_id, score, position) VALUES
(1, 9, 1, 208.800, 9), (1, 9, 2, 37.400, NULL), (1, 9, 3, 33.450, NULL), (1, 9, 4, 25.600, NULL),
(1, 9, 5, 44.050, NULL), (1, 9, 6, 34.450, NULL), (1, 9, 7, 32.100, NULL), (1, 9, 8, 33.850, NULL);

-- Team 10: Black Pearl BBQ Crew
INSERT INTO championship_results (championship_id, team_id, category_id, score, position) VALUES
(1, 10, 1, 208.050, 10), (1, 10, 2, 33.050, NULL), (1, 10, 3, 30.250, NULL), (1, 10, 4, 48.100, NULL),
(1, 10, 5, 32.050, NULL), (1, 10, 6, 36.250, NULL), (1, 10, 7, 35.750, NULL), (1, 10, 8, 28.350, NULL);

-- Team 11: Brasas Peruanas
INSERT INTO championship_results (championship_id, team_id, category_id, score, position) VALUES
(1, 11, 1, 208.050, 11), (1, 11, 2, 33.350, NULL), (1, 11, 3, 34.550, NULL), (1, 11, 4, 38.100, NULL),
(1, 11, 5, 33.600, NULL), (1, 11, 6, 34.250, NULL), (1, 11, 7, 33.900, NULL), (1, 11, 8, 34.200, NULL);

-- Team 12: Brazilian Barbecue Team 2
INSERT INTO championship_results (championship_id, team_id, category_id, score, position) VALUES
(1, 12, 1, 207.900, 12), (1, 12, 2, 37.550, NULL), (1, 12, 3, 39.400, NULL), (1, 12, 4, 31.000, NULL),
(1, 12, 5, 34.350, NULL), (1, 12, 6, 35.450, NULL), (1, 12, 7, 40.450, NULL), (1, 12, 8, 30.150, NULL);

-- Team 13: ICATMOR
INSERT INTO championship_results (championship_id, team_id, category_id, score, position) VALUES
(1, 13, 1, 207.750, 13), (1, 13, 2, 34.750, NULL), (1, 13, 3, 41.550, NULL), (1, 13, 4, 33.450, NULL),
(1, 13, 5, 33.950, NULL), (1, 13, 6, 31.850, NULL), (1, 13, 7, 36.550, NULL), (1, 13, 8, 32.200, NULL);

-- Team 14: Steiramen BBQ
INSERT INTO championship_results (championship_id, team_id, category_id, score, position) VALUES
(1, 14, 1, 207.400, 14), (1, 14, 2, 34.700, NULL), (1, 14, 3, 35.350, NULL), (1, 14, 4, 42.050, NULL),
(1, 14, 5, 27.500, NULL), (1, 14, 6, 34.650, NULL), (1, 14, 7, 33.050, NULL), (1, 14, 8, 33.150, NULL);

-- Team 15: Parrilleros de élite
INSERT INTO championship_results (championship_id, team_id, category_id, score, position) VALUES
(1, 15, 1, 207.400, 15), (1, 15, 2, 33.400, NULL), (1, 15, 3, 36.700, NULL), (1, 15, 4, 33.850, NULL),
(1, 15, 5, 36.400, NULL), (1, 15, 6, 35.350, NULL), (1, 15, 7, 32.250, NULL), (1, 15, 8, 31.700, NULL);

-- Team 16: A Modo Mio
INSERT INTO championship_results (championship_id, team_id, category_id, score, position) VALUES
(1, 16, 1, 206.550, 16), (1, 16, 2, 36.450, NULL), (1, 16, 3, 34.950, NULL), (1, 16, 4, 29.900, NULL),
(1, 16, 5, 31.000, NULL), (1, 16, 6, 37.900, NULL), (1, 16, 7, 46.500, NULL), (1, 16, 8, 36.350, NULL);

-- Team 17: Swiss Fire Devils BBQ
INSERT INTO championship_results (championship_id, team_id, category_id, score, position) VALUES
(1, 17, 1, 206.050, 17), (1, 17, 2, 31.300, NULL), (1, 17, 3, 39.300, NULL), (1, 17, 4, 21.850, NULL),
(1, 17, 5, 48.450, NULL), (1, 17, 6, 33.450, NULL), (1, 17, 7, 34.350, NULL), (1, 17, 8, 31.700, NULL);

-- Team 18: Bros & Fire PTY
INSERT INTO championship_results (championship_id, team_id, category_id, score, position) VALUES
(1, 18, 1, 205.800, 18), (1, 18, 2, 35.100, NULL), (1, 18, 3, 32.550, NULL), (1, 18, 4, 38.450, NULL),
(1, 18, 5, 30.900, NULL), (1, 18, 6, 29.600, NULL), (1, 18, 7, 31.050, NULL), (1, 18, 8, 39.200, NULL);

-- Team 19: Guayabos Grill
INSERT INTO championship_results (championship_id, team_id, category_id, score, position) VALUES
(1, 19, 1, 205.200, 19), (1, 19, 2, 33.050, NULL), (1, 19, 3, 35.000, NULL), (1, 19, 4, 34.400, NULL),
(1, 19, 5, 32.900, NULL), (1, 19, 6, 35.450, NULL), (1, 19, 7, 38.350, NULL), (1, 19, 8, 34.400, NULL);

-- Team 20: Parrillas y Espadas
INSERT INTO championship_results (championship_id, team_id, category_id, score, position) VALUES
(1, 20, 1, 204.700, 20), (1, 20, 2, 34.350, NULL), (1, 20, 3, 33.050, NULL), (1, 20, 4, 28.350, NULL),
(1, 20, 5, 33.350, NULL), (1, 20, 6, 37.800, NULL), (1, 20, 7, 39.050, NULL), (1, 20, 8, 37.800, NULL);

-- Team 21: West Smoke BBQ
INSERT INTO championship_results (championship_id, team_id, category_id, score, position) VALUES
(1, 21, 1, 204.700, 21), (1, 21, 2, 38.250, NULL), (1, 21, 3, 36.500, NULL), (1, 21, 4, 33.450, NULL),
(1, 21, 5, 31.850, NULL), (1, 21, 6, 36.100, NULL), (1, 21, 7, 33.800, NULL), (1, 21, 8, 28.550, NULL);

-- Team 22: La Pandilla Parrillera
INSERT INTO championship_results (championship_id, team_id, category_id, score, position) VALUES
(1, 22, 1, 204.650, 22), (1, 22, 2, 29.550, NULL), (1, 22, 3, 33.200, NULL), (1, 22, 4, 49.050, NULL),
(1, 22, 5, 31.700, NULL), (1, 22, 6, 35.000, NULL), (1, 22, 7, 34.800, NULL), (1, 22, 8, 26.150, NULL);

-- Team 23: Barbakùa
INSERT INTO championship_results (championship_id, team_id, category_id, score, position) VALUES
(1, 23, 1, 204.550, 23), (1, 23, 2, 34.500, NULL), (1, 23, 3, 30.550, NULL), (1, 23, 4, 19.050, NULL),
(1, 23, 5, 51.050, NULL), (1, 23, 6, 33.150, NULL), (1, 23, 7, 34.750, NULL), (1, 23, 8, 36.250, NULL);

-- Team 24: La Mesa del Laurel
INSERT INTO championship_results (championship_id, team_id, category_id, score, position) VALUES
(1, 24, 1, 204.500, 24), (1, 24, 2, 31.650, NULL), (1, 24, 3, 34.700, NULL), (1, 24, 4, 43.100, NULL),
(1, 24, 5, 29.050, NULL), (1, 24, 6, 34.100, NULL), (1, 24, 7, 33.550, NULL), (1, 24, 8, 31.900, NULL);

-- Team 25: Fuego del Achibueno
INSERT INTO championship_results (championship_id, team_id, category_id, score, position) VALUES
(1, 25, 1, 204.100, 25), (1, 25, 2, 36.050, NULL), (1, 25, 3, 38.800, NULL), (1, 25, 4, 31.900, NULL),
(1, 25, 5, 33.050, NULL), (1, 25, 6, 30.150, NULL), (1, 25, 7, 29.850, NULL), (1, 25, 8, 34.150, NULL);

-- Team 26: ACONCAGUA GRILL
INSERT INTO championship_results (championship_id, team_id, category_id, score, position) VALUES
(1, 26, 1, 203.750, 26), (1, 26, 2, 42.950, NULL), (1, 26, 3, 34.400, NULL), (1, 26, 4, 28.100, NULL),
(1, 26, 5, 29.100, NULL), (1, 26, 6, 37.850, NULL), (1, 26, 7, 22.000, NULL), (1, 26, 8, 31.350, NULL);

-- Team 27: Grillholics Mx
INSERT INTO championship_results (championship_id, team_id, category_id, score, position) VALUES
(1, 27, 1, 202.900, 27), (1, 27, 2, 33.200, NULL), (1, 27, 3, 35.000, NULL), (1, 27, 4, 31.250, NULL),
(1, 27, 5, 38.300, NULL), (1, 27, 6, 35.950, NULL), (1, 27, 7, 34.550, NULL), (1, 27, 8, 29.200, NULL);

-- Team 28: Forjadores de Sabor
INSERT INTO championship_results (championship_id, team_id, category_id, score, position) VALUES
(1, 28, 1, 202.750, 28), (1, 28, 2, 37.150, NULL), (1, 28, 3, 34.700, NULL), (1, 28, 4, 32.150, NULL),
(1, 28, 5, 34.050, NULL), (1, 28, 6, 32.150, NULL), (1, 28, 7, 28.150, NULL), (1, 28, 8, 32.550, NULL);

-- Team 29: Condores de Fuego
INSERT INTO championship_results (championship_id, team_id, category_id, score, position) VALUES
(1, 29, 1, 201.550, 29), (1, 29, 2, 37.100, NULL), (1, 29, 3, 34.700, NULL), (1, 29, 4, 23.550, NULL),
(1, 29, 5, 38.100, NULL), (1, 29, 6, 37.500, NULL), (1, 29, 7, 35.450, NULL), (1, 29, 8, 30.600, NULL);

-- Team 30: Peaky Blinders
INSERT INTO championship_results (championship_id, team_id, category_id, score, position) VALUES
(1, 30, 1, 201.550, 30), (1, 30, 2, 33.150, NULL), (1, 30, 3, 34.500, NULL), (1, 30, 4, 32.400, NULL),
(1, 30, 5, 35.450, NULL), (1, 30, 6, 33.300, NULL), (1, 30, 7, 33.800, NULL), (1, 30, 8, 32.750, NULL);

-- Team 31: Brasas Biobio
INSERT INTO championship_results (championship_id, team_id, category_id, score, position) VALUES
(1, 31, 1, 201.500, 31), (1, 31, 2, 29.100, NULL), (1, 31, 3, 33.150, NULL), (1, 31, 4, 21.700, NULL),
(1, 31, 5, 49.800, NULL), (1, 31, 6, 34.800, NULL), (1, 31, 7, 30.450, NULL), (1, 31, 8, 32.950, NULL);

-- Team 32: Andes Grill
INSERT INTO championship_results (championship_id, team_id, category_id, score, position) VALUES
(1, 32, 1, 200.950, 32), (1, 32, 2, 28.000, NULL), (1, 32, 3, 45.700, NULL), (1, 32, 4, 28.450, NULL),
(1, 32, 5, 31.700, NULL), (1, 32, 6, 37.150, NULL), (1, 32, 7, 30.600, NULL), (1, 32, 8, 29.950, NULL);

-- Team 33: La Bodega del Asador
INSERT INTO championship_results (championship_id, team_id, category_id, score, position) VALUES
(1, 33, 1, 200.150, 33), (1, 33, 2, 35.250, NULL), (1, 33, 3, 37.000, NULL), (1, 33, 4, 33.350, NULL),
(1, 33, 5, 27.650, NULL), (1, 33, 6, 37.150, NULL), (1, 33, 7, 35.700, NULL), (1, 33, 8, 29.750, NULL);

-- Team 34: OJO DE BIFFE
INSERT INTO championship_results (championship_id, team_id, category_id, score, position) VALUES
(1, 34, 1, 199.850, 34), (1, 34, 2, 36.950, NULL), (1, 34, 3, 37.700, NULL), (1, 34, 4, 28.450, NULL),
(1, 34, 5, 30.950, NULL), (1, 34, 6, 35.350, NULL), (1, 34, 7, 31.850, NULL), (1, 34, 8, 30.450, NULL);

-- Team 35: LUMBERJACK BBQ
INSERT INTO championship_results (championship_id, team_id, category_id, score, position) VALUES
(1, 35, 1, 199.050, 35), (1, 35, 2, 34.050, NULL), (1, 35, 3, 30.450, NULL), (1, 35, 4, 33.250, NULL),
(1, 35, 5, 32.250, NULL), (1, 35, 6, 35.300, NULL), (1, 35, 7, 37.950, NULL), (1, 35, 8, 33.750, NULL);

-- Team 36: Nina Runa Perú
INSERT INTO championship_results (championship_id, team_id, category_id, score, position) VALUES
(1, 36, 1, 195.000, 36), (1, 36, 2, 20.800, NULL), (1, 36, 3, 40.050, NULL), (1, 36, 4, 35.050, NULL),
(1, 36, 5, 36.900, NULL), (1, 36, 6, 30.250, NULL), (1, 36, 7, 34.100, NULL), (1, 36, 8, 31.950, NULL);

-- Team 37: LECHLER Grill Team
INSERT INTO championship_results (championship_id, team_id, category_id, score, position) VALUES
(1, 37, 1, 193.650, 37), (1, 37, 2, 25.500, NULL), (1, 37, 3, 33.350, NULL), (1, 37, 4, 35.100, NULL),
(1, 37, 5, 34.050, NULL), (1, 37, 6, 33.000, NULL), (1, 37, 7, 28.950, NULL), (1, 37, 8, 32.650, NULL);

-- Team 38: Rhoener Heimat Griller
INSERT INTO championship_results (championship_id, team_id, category_id, score, position) VALUES
(1, 38, 1, 191.500, 38), (1, 38, 2, 34.950, NULL), (1, 38, 3, 31.150, NULL), (1, 38, 4, 29.450, NULL),
(1, 38, 5, 35.700, NULL), (1, 38, 6, 32.450, NULL), (1, 38, 7, 29.400, NULL), (1, 38, 8, 27.800, NULL);

-- Team 39: Las Pibas del Fuego
INSERT INTO championship_results (championship_id, team_id, category_id, score, position) VALUES
(1, 39, 1, 190.500, 39), (1, 39, 2, 30.500, NULL), (1, 39, 3, 32.650, NULL), (1, 39, 4, 16.850, NULL),
(1, 39, 5, 41.150, NULL), (1, 39, 6, 31.350, NULL), (1, 39, 7, 30.050, NULL), (1, 39, 8, 38.000, NULL);

-- Team 40: Sociedad Parrillera de Nuevo Laredo.
INSERT INTO championship_results (championship_id, team_id, category_id, score, position) VALUES
(1, 40, 1, 189.450, 40), (1, 40, 2, 25.750, NULL), (1, 40, 3, 33.450, NULL), (1, 40, 4, 36.150, NULL),
(1, 40, 5, 28.900, NULL), (1, 40, 6, 32.200, NULL), (1, 40, 7, 28.700, NULL), (1, 40, 8, 33.000, NULL);

-- Team 41: Wild West BBQ e.V.
INSERT INTO championship_results (championship_id, team_id, category_id, score, position) VALUES
(1, 41, 1, 189.100, 41), (1, 41, 2, 31.400, NULL), (1, 41, 3, 34.250, NULL), (1, 41, 4, 33.150, NULL),
(1, 41, 5, 28.200, NULL), (1, 41, 6, 30.800, NULL), (1, 41, 7, 41.100, NULL), (1, 41, 8, 31.300, NULL);

-- Team 42: Argentina, Fuego y Tradición
INSERT INTO championship_results (championship_id, team_id, category_id, score, position) VALUES
(1, 42, 1, 188.900, 42), (1, 42, 2, 30.600, NULL), (1, 42, 3, 31.800, NULL), (1, 42, 4, 23.700, NULL),
(1, 42, 5, 35.800, NULL), (1, 42, 6, 38.000, NULL), (1, 42, 7, 30.250, NULL), (1, 42, 8, 29.000, NULL);

-- Team 43: Oid mortales del fuego
INSERT INTO championship_results (championship_id, team_id, category_id, score, position) VALUES
(1, 43, 1, 188.800, 43), (1, 43, 2, 27.150, NULL), (1, 43, 3, 34.400, NULL), (1, 43, 4, 36.850, NULL),
(1, 43, 5, 31.500, NULL), (1, 43, 6, 31.900, NULL), (1, 43, 7, 36.400, NULL), (1, 43, 8, 27.000, NULL);

-- Team 44: Malvinas Argentinas
INSERT INTO championship_results (championship_id, team_id, category_id, score, position) VALUES
(1, 44, 1, 188.350, 44), (1, 44, 2, 31.150, NULL), (1, 44, 3, 25.400, NULL), (1, 44, 4, 35.400, NULL),
(1, 44, 5, 33.700, NULL), (1, 44, 6, 27.400, NULL), (1, 44, 7, 32.550, NULL), (1, 44, 8, 35.300, NULL);

-- Team 45: American BBQ
INSERT INTO championship_results (championship_id, team_id, category_id, score, position) VALUES
(1, 45, 1, 187.050, 45), (1, 45, 2, 35.950, NULL), (1, 45, 3, 32.300, NULL), (1, 45, 4, 30.200, NULL),
(1, 45, 5, 42.700, NULL), (1, 45, 6, 12.100, NULL), (1, 45, 7, 37.300, NULL), (1, 45, 8, 33.800, NULL);

-- Team 46: PAYASO PARRILLERO
INSERT INTO championship_results (championship_id, team_id, category_id, score, position) VALUES
(1, 46, 1, 186.850, 46), (1, 46, 2, 0.000, NULL), (1, 46, 3, 43.950, NULL), (1, 46, 4, 33.950, NULL),
(1, 46, 5, 34.650, NULL), (1, 46, 6, 40.750, NULL), (1, 46, 7, 34.450, NULL), (1, 46, 8, 33.550, NULL);

-- Team 47: HEREDEROS DE LA PARRILLA
INSERT INTO championship_results (championship_id, team_id, category_id, score, position) VALUES
(1, 47, 1, 186.350, 47), (1, 47, 2, 33.850, NULL), (1, 47, 3, 32.950, NULL), (1, 47, 4, 21.500, NULL),
(1, 47, 5, 39.200, NULL), (1, 47, 6, 32.300, NULL), (1, 47, 7, 26.450, NULL), (1, 47, 8, 26.550, NULL);

-- Team 48: Humo Parrillada
INSERT INTO championship_results (championship_id, team_id, category_id, score, position) VALUES
(1, 48, 1, 183.900, 48), (1, 48, 2, 33.800, NULL), (1, 48, 3, 32.550, NULL), (1, 48, 4, 19.850, NULL),
(1, 48, 5, 32.350, NULL), (1, 48, 6, 31.400, NULL), (1, 48, 7, 29.150, NULL), (1, 48, 8, 33.950, NULL);

-- Team 49: WBQA Mexico Center
INSERT INTO championship_results (championship_id, team_id, category_id, score, position) VALUES
(1, 49, 1, 182.600, 49), (1, 49, 2, 26.900, NULL), (1, 49, 3, 33.550, NULL), (1, 49, 4, 33.700, NULL),
(1, 49, 5, 29.800, NULL), (1, 49, 6, 33.800, NULL), (1, 49, 7, 30.950, NULL), (1, 49, 8, 24.850, NULL);

-- Team 50: Humo Norteno
INSERT INTO championship_results (championship_id, team_id, category_id, score, position) VALUES
(1, 50, 1, 182.350, 50), (1, 50, 2, 32.850, NULL), (1, 50, 3, 28.650, NULL), (1, 50, 4, 41.500, NULL),
(1, 50, 5, 28.600, NULL), (1, 50, 6, 28.800, NULL), (1, 50, 7, 37.050, NULL), (1, 50, 8, 21.950, NULL);

-- Team 51: Caballeros de la Parrilla
INSERT INTO championship_results (championship_id, team_id, category_id, score, position) VALUES
(1, 51, 1, 182.250, 51), (1, 51, 2, 25.700, NULL), (1, 51, 3, 35.500, NULL), (1, 51, 4, 24.500, NULL),
(1, 51, 5, 28.150, NULL), (1, 51, 6, 36.450, NULL), (1, 51, 7, 31.800, NULL), (1, 51, 8, 31.950, NULL);

-- Team 52: Sabor Canario Uruguay
INSERT INTO championship_results (championship_id, team_id, category_id, score, position) VALUES
(1, 52, 1, 180.750, 52), (1, 52, 2, 29.200, NULL), (1, 52, 3, 31.100, NULL), (1, 52, 4, 27.150, NULL),
(1, 52, 5, 36.300, NULL), (1, 52, 6, 25.750, NULL), (1, 52, 7, 26.900, NULL), (1, 52, 8, 31.250, NULL);

-- Team 53: Sabores y fuegos argentinos
INSERT INTO championship_results (championship_id, team_id, category_id, score, position) VALUES
(1, 53, 1, 179.450, 53), (1, 53, 2, 29.700, NULL), (1, 53, 3, 30.400, NULL), (1, 53, 4, 29.750, NULL),
(1, 53, 5, 31.700, NULL), (1, 53, 6, 28.350, NULL), (1, 53, 7, 31.500, NULL), (1, 53, 8, 29.550, NULL);

-- Team 54: DIVINO FOGO
INSERT INTO championship_results (championship_id, team_id, category_id, score, position) VALUES
(1, 54, 1, 178.350, 54), (1, 54, 2, 31.250, NULL), (1, 54, 3, 32.600, NULL), (1, 54, 4, 29.200, NULL),
(1, 54, 5, 24.500, NULL), (1, 54, 6, 28.450, NULL), (1, 54, 7, 38.450, NULL), (1, 54, 8, 32.350, NULL);

-- Team 55: Mau's Grill
INSERT INTO championship_results (championship_id, team_id, category_id, score, position) VALUES
(1, 55, 1, 177.650, 55), (1, 55, 2, 32.200, NULL), (1, 55, 3, 26.300, NULL), (1, 55, 4, 27.650, NULL),
(1, 55, 5, 32.650, NULL), (1, 55, 6, 29.600, NULL), (1, 55, 7, 34.850, NULL), (1, 55, 8, 29.250, NULL);

-- Team 56: Sangre Charrua Uruguay
INSERT INTO championship_results (championship_id, team_id, category_id, score, position) VALUES
(1, 56, 1, 171.450, 56), (1, 56, 2, 16.000, NULL), (1, 56, 3, 29.950, NULL), (1, 56, 4, 27.700, NULL),
(1, 56, 5, 34.800, NULL), (1, 56, 6, 30.300, NULL), (1, 56, 7, 35.600, NULL), (1, 56, 8, 32.700, NULL);

-- Team 57: Argentina, Fuego Sagrado
INSERT INTO championship_results (championship_id, team_id, category_id, score, position) VALUES
(1, 57, 1, 167.250, 57), (1, 57, 2, 4.400, NULL), (1, 57, 3, 33.900, NULL), (1, 57, 4, 31.300, NULL),
(1, 57, 5, 31.250, NULL), (1, 57, 6, 32.950, NULL), (1, 57, 7, 27.150, NULL), (1, 57, 8, 33.450, NULL);

-- Team 58: Asadores del Valhala
INSERT INTO championship_results (championship_id, team_id, category_id, score, position) VALUES
(1, 58, 1, 160.500, 58), (1, 58, 2, 13.500, NULL), (1, 58, 3, 32.100, NULL), (1, 58, 4, 28.600, NULL),
(1, 58, 5, 31.900, NULL), (1, 58, 6, 26.950, NULL), (1, 58, 7, 38.150, NULL), (1, 58, 8, 27.450, NULL);

-- Teams without scores (59-62)
INSERT INTO championship_results (championship_id, team_id, category_id, score, position) VALUES
-- Team 59: Patagonia Entre Brasas y Rios
(1, 59, 1, 0.000, NULL), (1, 59, 2, 0.000, NULL), (1, 59, 3, 0.000, NULL), (1, 59, 4, 0.000, NULL),
(1, 59, 5, 0.000, NULL), (1, 59, 6, 0.000, NULL), (1, 59, 7, 0.000, NULL), (1, 59, 8, 0.000, NULL),
-- Team 60: NINA URKU
(1, 60, 1, 0.000, NULL), (1, 60, 2, 0.000, NULL), (1, 60, 3, 0.000, NULL), (1, 60, 4, 0.000, NULL),
(1, 60, 5, 0.000, NULL), (1, 60, 6, 0.000, NULL), (1, 60, 7, 0.000, NULL), (1, 60, 8, 0.000, NULL),
-- Team 61: TRA
(1, 61, 1, 0.000, NULL), (1, 61, 2, 0.000, NULL), (1, 61, 3, 0.000, NULL), (1, 61, 4, 0.000, NULL),
(1, 61, 5, 0.000, NULL), (1, 61, 6, 0.000, NULL), (1, 61, 7, 0.000, NULL), (1, 61, 8, 0.000, NULL),
-- Team 62: Nacion de Fuego Peru
(1, 62, 1, 0.000, NULL), (1, 62, 2, 0.000, NULL), (1, 62, 3, 0.000, NULL), (1, 62, 4, 0.000, NULL),
(1, 62, 5, 0.000, NULL), (1, 62, 6, 0.000, NULL), (1, 62, 7, 0.000, NULL), (1, 62, 8, 0.000, NULL);
