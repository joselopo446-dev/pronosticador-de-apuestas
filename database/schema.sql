-- =============================================
-- SCHEMA COMPLETO — PRONOSTICADOR DE APUESTAS
-- =============================================
-- Ejecutar TODO este código en el SQL Editor de Supabase.
-- Copiar y pegar todo de una sola vez.

-- =============================================
-- MÓDULO 1: DEPORTES
-- =============================================

CREATE TABLE IF NOT EXISTS sports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(3) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sport_id UUID NOT NULL REFERENCES sports(id) ON DELETE CASCADE,
  country_id UUID NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  api_league_id INTEGER NOT NULL,
  logo_url VARCHAR(500),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  year_start INTEGER NOT NULL,
  year_end INTEGER NOT NULL,
  current BOOLEAN DEFAULT false,
  api_season_id INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(league_id, year_start)
);

CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  short_name VARCHAR(10),
  logo_url VARCHAR(500),
  venue VARCHAR(200),
  api_team_id INTEGER UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_season (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  position INTEGER,
  points INTEGER DEFAULT 0,
  played INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  goals_for INTEGER DEFAULT 0,
  goals_against INTEGER DEFAULT 0,
  goal_difference INTEGER DEFAULT 0,
  form_last5 VARCHAR(5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, season_id)
);

CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  home_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  away_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  match_date DATE NOT NULL,
  match_time TIME,
  home_score INTEGER,
  away_score INTEGER,
  halftime_home INTEGER,
  halftime_away INTEGER,
  status VARCHAR(20) DEFAULT 'scheduled',
  venue VARCHAR(200),
  referee VARCHAR(100),
  api_match_id INTEGER UNIQUE NOT NULL,
  api_round VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (home_team_id != away_team_id)
);

CREATE TABLE IF NOT EXISTS match_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  shots INTEGER,
  shots_on_target INTEGER,
  possession DECIMAL(5,2),
  corners INTEGER,
  fouls INTEGER,
  yellow_cards INTEGER,
  red_cards INTEGER,
  offsides INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(match_id, team_id)
);

CREATE TABLE IF NOT EXISTS lineups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  formation VARCHAR(10),
  lineup JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(match_id, team_id)
);

-- =============================================
-- MÓDULO 2: PREDICCIONES
-- =============================================

CREATE TABLE IF NOT EXISTS model_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  version VARCHAR(20) NOT NULL,
  model_type VARCHAR(50) NOT NULL,
  description TEXT,
  parameters JSONB,
  features_used TEXT[],
  training_date TIMESTAMPTZ,
  training_data_range DATERANGE,
  metrics JSONB,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, version)
);

CREATE TABLE IF NOT EXISTS predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  model_version_id UUID NOT NULL REFERENCES model_versions(id) ON DELETE CASCADE,
  prob_home_win DECIMAL(5,4),
  prob_draw DECIMAL(5,4),
  prob_away_win DECIMAL(5,4),
  expected_home_goals DECIMAL(5,3),
  expected_away_goals DECIMAL(5,3),
  prob_over_25 DECIMAL(5,4),
  prob_btts_yes DECIMAL(5,4),
  most_likely_score VARCHAR(5),
  most_likely_score_prob DECIMAL(5,4),
  explanation JSONB,
  confidence_level VARCHAR(20),
  prediction_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prediction_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID NOT NULL REFERENCES predictions(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  actual_result VARCHAR(10),
  actual_home_score INTEGER,
  actual_away_score INTEGER,
  correct_result BOOLEAN,
  correct_score BOOLEAN,
  brier_score DECIMAL(5,4),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(prediction_id)
);

-- =============================================
-- MÓDULO 3: LOTERÍAS
-- =============================================

CREATE TABLE IF NOT EXISTS lotteries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  country VARCHAR(100) DEFAULT 'México',
  main_numbers_count INTEGER NOT NULL,
  main_numbers_min INTEGER NOT NULL,
  main_numbers_max INTEGER NOT NULL,
  bonus_numbers_count INTEGER DEFAULT 0,
  bonus_numbers_min INTEGER,
  bonus_numbers_max INTEGER,
  draw_days VARCHAR(100),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lottery_draws (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lottery_id UUID NOT NULL REFERENCES lotteries(id) ON DELETE CASCADE,
  draw_number VARCHAR(100),
  draw_date DATE NOT NULL,
  main_numbers INTEGER[] NOT NULL,
  bonus_number INTEGER,
  jackpot_amount DECIMAL(15,2),
  source VARCHAR(100),
  imported_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lottery_id, draw_date)
);

CREATE TABLE IF NOT EXISTS number_frequency (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lottery_id UUID NOT NULL REFERENCES lotteries(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  period VARCHAR(20) NOT NULL,
  absolute_frequency INTEGER NOT NULL,
  relative_frequency DECIMAL(8,6),
  last_draw_date DATE,
  draws_since_last INTEGER,
  avg_draws_between DECIMAL(8,4),
  temperature VARCHAR(10),
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lottery_id, number, period, calculated_at)
);

CREATE TABLE IF NOT EXISTS number_cooccurrence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lottery_id UUID NOT NULL REFERENCES lotteries(id) ON DELETE CASCADE,
  number_a INTEGER NOT NULL,
  number_b INTEGER NOT NULL,
  cooccurrence_count INTEGER NOT NULL,
  total_draws INTEGER NOT NULL,
  cooccurrence_rate DECIMAL(8,6),
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (number_a < number_b),
  UNIQUE(lottery_id, number_a, number_b, calculated_at)
);

CREATE TABLE IF NOT EXISTS lottery_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lottery_id UUID NOT NULL REFERENCES lotteries(id) ON DELETE CASCADE,
  pattern_type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  observations INTEGER NOT NULL,
  statistical_significance DECIMAL(8,6),
  confidence_level VARCHAR(20),
  method_used VARCHAR(100),
  is_predictive BOOLEAN DEFAULT false,
  backtest_result JSONB,
  detected_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lottery_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lottery_id UUID NOT NULL REFERENCES lotteries(id) ON DELETE CASCADE,
  strategy VARCHAR(50) NOT NULL,
  generated_numbers INTEGER[] NOT NULL,
  criteria JSONB,
  draw_date DATE,
  match_count INTEGER,
  evaluated BOOLEAN DEFAULT false,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ÍNDICES DE RENDIMIENTO
-- =============================================

CREATE INDEX IF NOT EXISTS idx_matches_league_season ON matches(league_id, season_id);
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(match_date);
CREATE INDEX IF NOT EXISTS idx_matches_home_team ON matches(home_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_away_team ON matches(away_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_api_id ON matches(api_match_id);
CREATE INDEX IF NOT EXISTS idx_predictions_match ON predictions(match_id);
CREATE INDEX IF NOT EXISTS idx_predictions_model ON predictions(model_version_id);
CREATE INDEX IF NOT EXISTS idx_predictions_date ON predictions(prediction_date);
CREATE INDEX IF NOT EXISTS idx_draws_lottery ON lottery_draws(lottery_id);
CREATE INDEX IF NOT EXISTS idx_draws_date ON lottery_draws(draw_date);
CREATE INDEX IF NOT EXISTS idx_frequency_lottery ON number_frequency(lottery_id, period);
CREATE INDEX IF NOT EXISTS idx_cooccurrence_lottery ON number_cooccurrence(lottery_id);
CREATE INDEX IF NOT EXISTS idx_team_season_team ON team_season(team_id);
CREATE INDEX IF NOT EXISTS idx_team_season_season ON team_season(season_id);

-- =============================================
-- RLS (Row Level Security)
-- =============================================

ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE lottery_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura pública predicciones" ON predictions FOR SELECT USING (true);
CREATE POLICY "Insertar predicciones auth" ON predictions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Lectura pública resultados" ON prediction_results FOR SELECT USING (true);
CREATE POLICY "Insertar resultados auth" ON prediction_results FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Lectura pública lotería" ON lottery_predictions FOR SELECT USING (true);
CREATE POLICY "Insertar lotería auth" ON lottery_predictions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
