-- =============================================
-- ESQUEMA: SISTEMA DE QUINIELA MEXICANA
-- =============================================

-- 1. Tabla de historial de partidos entre equipos
-- Almacena los últimos 100 partidos de Liga MX entre cada par de equipos
CREATE TABLE IF NOT EXISTS match_history (
  id BIGSERIAL PRIMARY KEY,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  home_goals INTEGER NOT NULL,
  away_goals INTEGER NOT NULL,
  match_date DATE NOT NULL,
  jornada TEXT,
  season TEXT,
  tournament TEXT DEFAULT 'liga-mx',
  match_type TEXT DEFAULT 'liga-mx',  -- liga-mx, copa, liguilla
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(home_team, away_team, match_date)
);

CREATE INDEX IF NOT EXISTS idx_match_history_teams ON match_history(home_team, away_team);
CREATE INDEX IF NOT EXISTS idx_match_history_date ON match_history(match_date DESC);
CREATE INDEX IF NOT EXISTS idx_match_history_home ON match_history(home_team);
CREATE INDEX IF NOT EXISTS idx_match_history_away ON match_history(away_team);

-- 2. Tabla de estado actual de equipos (se actualiza semanalmente)
CREATE TABLE IF NOT EXISTS team_current_state (
  id BIGSERIAL PRIMARY KEY,
  team_name TEXT NOT NULL UNIQUE,
  current_position INTEGER,
  points INTEGER DEFAULT 0,
  played INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  goals_for INTEGER DEFAULT 0,
  goals_against INTEGER DEFAULT 0,
  goal_difference INTEGER DEFAULT 0,
  home_wins INTEGER DEFAULT 0,
  home_draws INTEGER DEFAULT 0,
  home_losses INTEGER DEFAULT 0,
  away_wins INTEGER DEFAULT 0,
  away_draws INTEGER DEFAULT 0,
  away_losses INTEGER DEFAULT 0,
  current_streak TEXT DEFAULT '',  -- Ej: "WWDLW"
  streak_type TEXT DEFAULT '',     -- W, D, L
  streak_count INTEGER DEFAULT 0,
  last_5_results TEXT DEFAULT '',  -- Ej: "W-W-L-W-D"
  form_last_5 DECIMAL(3,1) DEFAULT 0,  -- Puntos promedio últimos 5 (0-15)
  goals_scored_last_5 INTEGER DEFAULT 0,
  goals_conceded_last_5 INTEGER DEFAULT 0,
  avg_goals_scored DECIMAL(3,2) DEFAULT 0,
  avg_goals_conceded DECIMAL(3,2) DEFAULT 0,
  top_scorer TEXT DEFAULT '',
  top_scorer_goals INTEGER DEFAULT 0,
  injured_players TEXT DEFAULT '',  -- JSON array de jugadores lesionados
  suspended_players TEXT DEFAULT '',  -- JSON array de jugadores suspendidos
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de quinielas generadas
CREATE TABLE IF NOT EXISTS quiniela_predictions (
  id BIGSERIAL PRIMARY KEY,
  jornada TEXT NOT NULL,
  jornada_date DATE NOT NULL,
  match_date DATE NOT NULL,
  match_time TEXT,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  prediction TEXT NOT NULL CHECK (prediction IN ('1', 'X', '2')),
  confidence DECIMAL(3,2) DEFAULT 0.5,
  home_win_prob DECIMAL(5,4) DEFAULT 0.33,
  draw_prob DECIMAL(5,4) DEFAULT 0.33,
  away_win_prob DECIMAL(5,4) DEFAULT 0.33,
  expected_home_goals DECIMAL(3,2) DEFAULT 1.5,
  expected_away_goals DECIMAL(3,2) DEFAULT 1.5,
  -- Factores de predicción (guardados para transparencia)
  factor_team_state JSONB DEFAULT '{}',
  factor_history JSONB DEFAULT '{}',
  factor_form JSONB DEFAULT '{}',
  factor_context JSONB DEFAULT '{}',
  -- Resultado real (se llena después del partido)
  actual_result TEXT,
  actual_home_goals INTEGER,
  actual_away_goals INTEGER,
  is_correct BOOLEAN,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'checked', 'won', 'lost')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  checked_at TIMESTAMPTZ,
  UNIQUE(jornada, home_team, away_team)
);

CREATE INDEX IF NOT EXISTS idx_quiniela_jornada ON quiniela_predictions(jornada);
CREATE INDEX IF NOT EXISTS idx_quiniela_status ON quiniela_predictions(status);

-- 4. Tabla de jornadas programadas (próximos partidos)
CREATE TABLE IF NOT EXISTS scheduled_jornadas (
  id BIGSERIAL PRIMARY KEY,
  jornada TEXT NOT NULL,
  jornada_date DATE NOT NULL,
  match_date DATE NOT NULL,
  match_time TEXT,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  venue TEXT,
  is_playoff BOOLEAN DEFAULT FALSE,
  playoff_context TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'finished')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(jornada, home_team, away_team)
);

CREATE INDEX IF NOT EXISTS idx_jornada_date ON scheduled_jornadas(jornada_date);
CREATE INDEX IF NOT EXISTS idx_jornada_status ON scheduled_jornadas(status);

-- 5. Función para obtener historial entre dos equipos
CREATE OR REPLACE FUNCTION get_head_to_head(
  p_home_team TEXT,
  p_away_team TEXT,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  match_date DATE,
  home_goals INTEGER,
  away_goals INTEGER,
  result TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mh.match_date,
    mh.home_goals,
    mh.away_goals,
    CASE 
      WHEN mh.home_goals > mh.away_goals THEN '1'
      WHEN mh.home_goals = mh.away_goals THEN 'X'
      ELSE '2'
    END as result
  FROM match_history mh
  WHERE (mh.home_team = p_home_team AND mh.away_team = p_away_team)
     OR (mh.home_team = p_away_team AND mh.away_team = p_home_team)
  ORDER BY mh.match_date DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- 6. Función para obtener forma reciente de un equipo
CREATE OR REPLACE FUNCTION get_team_form(
  p_team TEXT,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  match_date DATE,
  opponent TEXT,
  is_home BOOLEAN,
  goals_for INTEGER,
  goals_against INTEGER,
  result TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mh.match_date,
    CASE 
      WHEN mh.home_team = p_team THEN mh.away_team
      ELSE mh.home_team
    END as opponent,
    CASE 
      WHEN mh.home_team = p_team THEN TRUE
      ELSE FALSE
    END as is_home,
    CASE 
      WHEN mh.home_team = p_team THEN mh.home_goals
      ELSE mh.away_goals
    END as goals_for,
    CASE 
      WHEN mh.home_team = p_team THEN mh.away_goals
      ELSE mh.home_goals
    END as goals_against,
    CASE 
      WHEN (mh.home_team = p_team AND mh.home_goals > mh.away_goals)
        OR (mh.away_team = p_team AND mh.away_goals > mh.home_goals) THEN 'W'
      WHEN mh.home_goals = mh.away_goals THEN 'D'
      ELSE 'L'
    END as result
  FROM match_history mh
  WHERE mh.home_team = p_team OR mh.away_team = p_team
  ORDER BY mh.match_date DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- 7. Habilitar RLS
ALTER TABLE match_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_current_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiniela_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_jornadas ENABLE ROW LEVEL SECURITY;

-- Políticas para service role
CREATE POLICY "Allow all for service role on match_history" ON match_history
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for service role on team_current_state" ON team_current_state
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for service role on quiniela_predictions" ON quiniela_predictions
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for service role on scheduled_jornadas" ON scheduled_jornadas
  FOR ALL USING (true) WITH CHECK (true);

-- Políticas de lectura pública
CREATE POLICY "Public read match_history" ON match_history
  FOR SELECT USING (true);

CREATE POLICY "Public read team_current_state" ON team_current_state
  FOR SELECT USING (true);

CREATE POLICY "Public read quiniela_predictions" ON quiniela_predictions
  FOR SELECT USING (true);

CREATE POLICY "Public read scheduled_jornadas" ON scheduled_jornadas
  FOR SELECT USING (true);
