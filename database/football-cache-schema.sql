-- =============================================
-- SISTEMA DE CACHÉ PARA APIs DE FÚTBOL
-- =============================================
-- Optimiza uso de APIs guardando todo en Supabase
-- Reduce llamadas a API-Football (100 req/día) y Football-Data.org (10 req/min)

-- Tabla de caché de fixtures
CREATE TABLE IF NOT EXISTS football_fixtures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fixture_id TEXT UNIQUE NOT NULL,
  league TEXT NOT NULL,
  league_code TEXT NOT NULL,
  jornada TEXT,
  season TEXT DEFAULT '2025',
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  home_team_id INTEGER,
  away_team_id INTEGER,
  match_date DATE NOT NULL,
  match_time TIME,
  venue TEXT,
  status TEXT DEFAULT 'scheduled',
  home_goals INTEGER,
  away_goals INTEGER,
  home_score_ht INTEGER,
  away_score_ht INTEGER,
  referee TEXT,
  last_sync TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de caché de equipos
CREATE TABLE IF NOT EXISTS football_teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id INTEGER UNIQUE NOT NULL,
  team_name TEXT NOT NULL,
  league TEXT NOT NULL,
  country TEXT,
  founded INTEGER,
  venue_name TEXT,
  venue_capacity INTEGER,
  logo_url TEXT,
  -- Estadísticas
  current_position INTEGER,
  points INTEGER DEFAULT 0,
  played INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  goals_for INTEGER DEFAULT 0,
  goals_against INTEGER DEFAULT 0,
  home_wins INTEGER DEFAULT 0,
  home_draws INTEGER DEFAULT 0,
  home_losses INTEGER DEFAULT 0,
  away_wins INTEGER DEFAULT 0,
  away_draws INTEGER DEFAULT 0,
  away_losses INTEGER DEFAULT 0,
  form TEXT,
  last_5_results TEXT[],
  -- ELO
  elo_rating REAL DEFAULT 1500,
  last_sync TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de caché de partidos históricos
CREATE TABLE IF NOT EXISTS football_match_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fixture_id TEXT UNIQUE NOT NULL,
  league TEXT NOT NULL,
  season TEXT DEFAULT '2025',
  match_date DATE NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  home_goals INTEGER NOT NULL,
  away_goals INTEGER NOT NULL,
  home_score_ht INTEGER,
  away_score_ht INTEGER,
  home_shots INTEGER,
  away_shots INTEGER,
  home_shots_on_target INTEGER,
  away_shots_on_target INTEGER,
  home_corners INTEGER,
  away_corners INTEGER,
  home_fouls INTEGER,
  away_fouls INTEGER,
  home_yellow_cards INTEGER,
  away_yellow_cards INTEGER,
  home_red_cards INTEGER,
  away_red_cards INTEGER,
  referee TEXT,
  venue TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de control de uso de APIs
CREATE TABLE IF NOT EXISTS api_usage_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  api_name TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  date DATE DEFAULT CURRENT_DATE,
  hour INTEGER DEFAULT EXTRACT(HOUR FROM NOW()),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de estado de sincronización
CREATE TABLE IF NOT EXISTS sync_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sync_type TEXT UNIQUE NOT NULL,
  last_sync TIMESTAMPTZ,
  next_sync TIMESTAMPTZ,
  records_synced INTEGER DEFAULT 0,
  status TEXT DEFAULT 'idle',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_fixtures_league ON football_fixtures(league);
CREATE INDEX IF NOT EXISTS idx_fixtures_date ON football_fixtures(match_date);
CREATE INDEX IF NOT EXISTS idx_fixtures_jornada ON football_fixtures(jornada);
CREATE INDEX IF NOT EXISTS idx_fixtures_status ON football_fixtures(status);
CREATE INDEX IF NOT EXISTS idx_teams_league ON football_teams(league);
CREATE INDEX IF NOT EXISTS idx_teams_name ON football_teams(team_name);
CREATE INDEX IF NOT EXISTS idx_history_date ON football_match_history(match_date);
CREATE INDEX IF NOT EXISTS idx_history_teams ON football_match_history(home_team, away_team);
CREATE INDEX IF NOT EXISTS idx_api_usage_date ON api_usage_log(api_name, date);

-- Función para verificar límite de API
CREATE OR REPLACE FUNCTION check_api_limit(p_api_name TEXT, p_daily_limit INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  v_today_count INTEGER;
BEGIN
  SELECT COALESCE(SUM(request_count), 0) INTO v_today_count
  FROM api_usage_log
  WHERE api_name = p_api_name
    AND date = CURRENT_DATE;
  
  RETURN v_today_count < p_daily_limit;
END;
$$ LANGUAGE plpgsql;

-- Función para registrar uso de API
CREATE OR REPLACE FUNCTION log_api_usage(p_api_name TEXT, p_endpoint TEXT, p_count INTEGER DEFAULT 1)
RETURNS VOID AS $$
BEGIN
  INSERT INTO api_usage_log (api_name, endpoint, request_count, date, hour)
  VALUES (p_api_name, p_endpoint, p_count, CURRENT_DATE, EXTRACT(HOUR FROM NOW()));
END;
$$ LANGUAGE plpgsql;

-- Función para obtener próximo slot disponible
CREATE OR REPLACE FUNCTION get_next_available_slot(p_api_name TEXT)
RETURNS TIMESTAMPTZ AS $$
DECLARE
  v_last_request TIMESTAMPTZ;
  v_next_slot TIMESTAMPTZ;
BEGIN
  -- Para APIs con límite por minuto
  IF p_api_name = 'football-data.org' THEN
    SELECT MAX(created_at) INTO v_last_request
    FROM api_usage_log
    WHERE api_name = p_api_name
      AND created_at > NOW() - INTERVAL '1 minute';
    
    IF v_last_request IS NULL THEN
      RETURN NOW();
    END IF;
    
    v_next_slot := v_last_request + INTERVAL '6 seconds';
    IF v_next_slot < NOW() THEN
      RETURN NOW();
    END IF;
    RETURN v_next_slot;
  
  -- Para APIs con límite diario
  ELSE
    RETURN NOW();
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Insertar estado inicial de sincronización
INSERT INTO sync_status (sync_type, status) VALUES
  ('fixtures_liga_mx', 'idle'),
  ('fixtures_la_liga', 'idle'),
  ('fixtures_premier', 'idle'),
  ('teams_liga_mx', 'idle'),
  ('teams_la_liga', 'idle'),
  ('teams_premier', 'idle'),
  ('match_history', 'idle')
ON CONFLICT (sync_type) DO NOTHING;
