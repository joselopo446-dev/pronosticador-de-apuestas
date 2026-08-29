-- =============================================
-- SEED DATA — DATOS INICIALES
-- =============================================
-- Ejecutar después del schema.sql.
-- Inserta los deportes, países, ligas y loterías iniciales.

-- =============================================
-- DEPORTES
-- =============================================
INSERT INTO sports (id, name, slug) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Fútbol', 'futbol')
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- PAÍSES
-- =============================================
INSERT INTO countries (id, name, code) VALUES
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'México', 'MEX'),
  ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'España', 'ESP')
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- LIGAS
-- =============================================

-- Liga MX (API-Football ID: 262)
INSERT INTO leagues (id, sport_id, country_id, name, slug, api_league_id, logo_url) VALUES
  ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
   'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
   'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
   'Liga MX',
   'liga-mx',
   262,
   'https://media.api-sports.io/football/leagues/262.png')
ON CONFLICT (slug) DO NOTHING;

-- La Liga (API-Football ID: 140)
INSERT INTO leagues (id, sport_id, country_id, name, slug, api_league_id, logo_url) VALUES
  ('e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55',
   'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
   'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
   'La Liga',
   'la-liga',
   140,
   'https://media.api-sports.io/football/leagues/140.png')
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- LOTERÍAS MEXICANAS
-- =============================================

-- Melate: 6 números del 1-56 + 1 adicional del 1-56
INSERT INTO lotteries (id, name, slug, country, main_numbers_count, main_numbers_min, main_numbers_max, bonus_numbers_count, bonus_numbers_min, bonus_numbers_max, draw_days) VALUES
  ('f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66',
   'Melate',
   'melate',
   'México',
   6, 1, 56,
   1, 1, 56,
   'miércoles,viernes,domingo')
ON CONFLICT (slug) DO NOTHING;

-- Revancha: mismo formato que Melate (sin adicional en algunos sorteos)
INSERT INTO lotteries (id, name, slug, country, main_numbers_count, main_numbers_min, main_numbers_max, bonus_numbers_count, bonus_numbers_min, bonus_numbers_max, draw_days) VALUES
  ('a6eebc99-9c0b-4ef8-bb6d-6bb9bd380a77',
   'Revancha',
   'revancha',
   'México',
   6, 1, 56,
   0, NULL, NULL,
   'miércoles,viernes,domingo')
ON CONFLICT (slug) DO NOTHING;

-- Super Lotto: 6 números del 1-45
INSERT INTO lotteries (id, name, slug, country, main_numbers_count, main_numbers_min, main_numbers_max, bonus_numbers_count, bonus_numbers_min, bonus_numbers_max, draw_days) VALUES
  ('b7eebc99-9c0b-4ef8-bb6d-6bb9bd380a88',
   'Super Lotto',
   'super-lotto',
   'México',
   6, 1, 45,
   0, NULL, NULL,
   'martes,jueves,sábado')
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- VERIFICACIÓN
-- =============================================
-- Ejecutar estas consultas para verificar que los datos se insertaron correctamente:

-- SELECT * FROM sports;
-- SELECT * FROM countries;
-- SELECT * FROM leagues;
-- SELECT * FROM lotteries;
