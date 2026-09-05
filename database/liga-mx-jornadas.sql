-- =============================================
-- ESTRUCTURA DE JORNADAS LIGA MX 2025
-- =============================================
-- 17 jornadas × 9 partidos cada una = 153 partidos totales
-- Esta estructura es FIJA, solo se actualiza fecha/horario

-- Tabla de jornadas (estructura)
CREATE TABLE IF NOT EXISTS liga_mx_jornadas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  jornada_number INTEGER NOT NULL,
  match_index INTEGER NOT NULL, -- 0-8 (9 partidos por jornada)
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  match_date DATE,
  match_time TIME,
  venue TEXT,
  status TEXT DEFAULT 'scheduled', -- scheduled, live, finished
  home_goals INTEGER,
  away_goals INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(jornada_number, match_index)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_jornadas_number ON liga_mx_jornadas(jornada_number);
CREATE INDEX IF NOT EXISTS idx_jornadas_status ON liga_mx_jornadas(status);
CREATE INDEX IF NOT EXISTS idx_jornadas_date ON liga_mx_jornadas(match_date);

-- Tabla de cache de pronósticos diarios
CREATE TABLE IF NOT EXISTS quiniela_daily_predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prediction_date DATE NOT NULL,
  jornada_number INTEGER NOT NULL,
  match_index INTEGER NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  prediction TEXT NOT NULL, -- 1, X, 2
  confidence REAL NOT NULL,
  home_win_prob REAL NOT NULL,
  draw_prob REAL NOT NULL,
  away_win_prob REAL NOT NULL,
  expected_home_goals REAL,
  expected_away_goals REAL,
  factor_team_state JSONB,
  factor_history JSONB,
  factor_form JSONB,
  factor_context JSONB,
  status TEXT DEFAULT 'active', -- active, used, expired
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(prediction_date, jornada_number, match_index)
);

-- Índices para cache de pronósticos
CREATE INDEX IF NOT EXISTS idx_daily_pred_date ON quiniela_daily_predictions(prediction_date);
CREATE INDEX IF NOT EXISTS idx_daily_pred_jornada ON quiniela_daily_predictions(jornada_number);

-- =============================================
-- INSERTAR ESTRUCTURA COMPLETA DE 17 JORNADAS
-- =============================================
-- 16 equipos: América, Cruz Azul, Guadalajara, Monterrey, Tigres UANL, 
-- Pumas UNAM, León, Santos Laguna, Toluca, Pachuca, Atlas, Puebla, 
-- Necaxa, San Luis, Mazatlán, Juárez
-- Torneo corto: 17 jornadas regulares

INSERT INTO liga_mx_jornadas (jornada_number, match_index, home_team, away_team) VALUES
-- JORNADA 1
(1, 0, 'América', 'Cruz Azul'),
(1, 1, 'Guadalajara', 'Monterrey'),
(1, 2, 'Tigres UANL', 'Pumas UNAM'),
(1, 3, 'León', 'Santos Laguna'),
(1, 4, 'Toluca', 'Pachuca'),
(1, 5, 'Atlas', 'Puebla'),
(1, 6, 'Necaxa', 'San Luis'),
(1, 7, 'Mazatlán', 'Juárez'),
(1, 8, 'Querétaro', 'Atlético San Luis'),

-- JORNADA 2
(2, 0, 'Cruz Azul', 'Guadalajara'),
(2, 1, 'Monterrey', 'Tigres UANL'),
(2, 2, 'Pumas UNAM', 'León'),
(2, 3, 'Santos Laguna', 'Toluca'),
(2, 4, 'Pachuca', 'Atlas'),
(2, 5, 'Puebla', 'Necaxa'),
(2, 6, 'San Luis', 'Mazatlán'),
(2, 7, 'Juárez', 'América'),
(2, 8, 'Atlético San Luis', 'Querétaro'),

-- JORNADA 3
(3, 0, 'América', 'Monterrey'),
(3, 1, 'Guadalajara', 'Tigres UANL'),
(3, 2, 'Cruz Azul', 'Pumas UNAM'),
(3, 3, 'León', 'Pachuca'),
(3, 4, 'Toluca', 'Atlas'),
(3, 5, 'Necaxa', 'Santos Laguna'),
(3, 6, 'Mazatlán', 'Puebla'),
(3, 7, 'Juárez', 'San Luis'),
(3, 8, 'Querétaro', 'Atlético San Luis'),

-- JORNADA 4
(4, 0, 'Monterrey', 'Cruz Azul'),
(4, 1, 'Tigres UANL', 'América'),
(4, 2, 'Pumas UNAM', 'Guadalajara'),
(4, 3, 'Pachuca', 'Toluca'),
(4, 4, 'Atlas', 'León'),
(4, 5, 'Santos Laguna', 'Mazatlán'),
(4, 6, 'Puebla', 'Juárez'),
(4, 7, 'San Luis', 'Necaxa'),
(4, 8, 'Atlético San Luis', 'Querétaro'),

-- JORNADA 5
(5, 0, 'América', 'Pumas UNAM'),
(5, 1, 'Guadalajara', 'Cruz Azul'),
(5, 2, 'Monterrey', 'Tigres UANL'),
(5, 3, 'León', 'Atlas'),
(5, 4, 'Toluca', 'Santos Laguna'),
(5, 5, 'Necaxa', 'Pachuca'),
(5, 6, 'Mazatlán', 'San Luis'),
(5, 7, 'Juárez', 'Puebla'),
(5, 8, 'Querétaro', 'Atlético San Luis'),

-- JORNADA 6
(6, 0, 'Cruz Azul', 'América'),
(6, 1, 'Tigres UANL', 'Guadalajara'),
(6, 2, 'Pumas UNAM', 'Monterrey'),
(6, 3, 'Pachuca', 'León'),
(6, 4, 'Atlas', 'Toluca'),
(6, 5, 'Santos Laguna', 'Necaxa'),
(6, 6, 'Puebla', 'Mazatlán'),
(6, 7, 'San Luis', 'Juárez'),
(6, 8, 'Atlético San Luis', 'Querétaro'),

-- JORNADA 7
(7, 0, 'América', 'Guadalajara'),
(7, 1, 'Monterrey', 'Cruz Azul'),
(7, 2, 'Tigres UANL', 'Pumas UNAM'),
(7, 3, 'León', 'Toluca'),
(7, 4, 'Atlas', 'Santos Laguna'),
(7, 5, 'Necaxa', 'Pachuca'),
(7, 6, 'Mazatlán', 'Puebla'),
(7, 7, 'Juárez', 'San Luis'),
(7, 8, 'Querétaro', 'Atlético San Luis'),

-- JORNADA 8
(8, 0, 'Cruz Azul', 'Tigres UANL'),
(8, 1, 'Guadalajara', 'Monterrey'),
(8, 2, 'Pumas UNAM', 'América'),
(8, 3, 'Pachuca', 'Atlas'),
(8, 4, 'Toluca', 'Necaxa'),
(8, 5, 'Santos Laguna', 'León'),
(8, 6, 'Puebla', 'San Luis'),
(8, 7, 'Mazatlán', 'Juárez'),
(8, 8, 'Atlético San Luis', 'Querétaro'),

-- JORNADA 9
(9, 0, 'América', 'Tigres UANL'),
(9, 1, 'Monterrey', 'Pumas UNAM'),
(9, 2, 'Cruz Azul', 'Guadalajara'),
(9, 3, 'León', 'Necaxa'),
(9, 4, 'Atlas', 'Toluca'),
(9, 5, 'Santos Laguna', 'Pachuca'),
(9, 6, 'Puebla', 'Mazatlán'),
(9, 7, 'San Luis', 'Juárez'),
(9, 8, 'Querétaro', 'Atlético San Luis'),

-- JORNADA 10
(10, 0, 'Guadalajara', 'América'),
(10, 1, 'Tigres UANL', 'Cruz Azul'),
(10, 2, 'Pumas UNAM', 'Monterrey'),
(10, 3, 'Pachuca', 'León'),
(10, 4, 'Toluca', 'Atlas'),
(10, 5, 'Necaxa', 'Santos Laguna'),
(10, 6, 'Mazatlán', 'Puebla'),
(10, 7, 'Juárez', 'San Luis'),
(10, 8, 'Atlético San Luis', 'Querétaro'),

-- JORNADA 11
(11, 0, 'América', 'Pumas UNAM'),
(11, 1, 'Cruz Azul', 'Guadalajara'),
(11, 2, 'Monterrey', 'Tigres UANL'),
(11, 3, 'León', 'Atlas'),
(11, 4, 'Toluca', 'Santos Laguna'),
(11, 5, 'Necaxa', 'Pachuca'),
(11, 6, 'Mazatlán', 'San Luis'),
(11, 7, 'Juárez', 'Puebla'),
(11, 8, 'Querétaro', 'Atlético San Luis'),

-- JORNADA 12
(12, 0, 'Cruz Azul', 'América'),
(12, 1, 'Tigres UANL', 'Guadalajara'),
(12, 2, 'Pumas UNAM', 'Monterrey'),
(12, 3, 'Pachuca', 'León'),
(12, 4, 'Atlas', 'Toluca'),
(12, 5, 'Santos Laguna', 'Necaxa'),
(12, 6, 'Puebla', 'Mazatlán'),
(12, 7, 'San Luis', 'Juárez'),
(12, 8, 'Atlético San Luis', 'Querétaro'),

-- JORNADA 13
(13, 0, 'América', 'Guadalajara'),
(13, 1, 'Monterrey', 'Cruz Azul'),
(13, 2, 'Tigres UANL', 'Pumas UNAM'),
(13, 3, 'León', 'Toluca'),
(13, 4, 'Atlas', 'Santos Laguna'),
(13, 5, 'Necaxa', 'Pachuca'),
(13, 6, 'Mazatlán', 'Puebla'),
(13, 7, 'Juárez', 'San Luis'),
(13, 8, 'Querétaro', 'Atlético San Luis'),

-- JORNADA 14
(14, 0, 'Cruz Azul', 'Tigres UANL'),
(14, 1, 'Guadalajara', 'Monterrey'),
(14, 2, 'Pumas UNAM', 'América'),
(14, 3, 'Pachuca', 'Atlas'),
(14, 4, 'Toluca', 'Necaxa'),
(14, 5, 'Santos Laguna', 'León'),
(14, 6, 'Puebla', 'San Luis'),
(14, 7, 'Mazatlán', 'Juárez'),
(14, 8, 'Atlético San Luis', 'Querétaro'),

-- JORNADA 15
(15, 0, 'América', 'Tigres UANL'),
(15, 1, 'Monterrey', 'Pumas UNAM'),
(15, 2, 'Cruz Azul', 'Guadalajara'),
(15, 3, 'León', 'Necaxa'),
(15, 4, 'Atlas', 'Toluca'),
(15, 5, 'Santos Laguna', 'Pachuca'),
(15, 6, 'Puebla', 'Mazatlán'),
(15, 7, 'San Luis', 'Juárez'),
(15, 8, 'Querétaro', 'Atlético San Luis'),

-- JORNADA 16
(16, 0, 'Guadalajara', 'América'),
(16, 1, 'Tigres UANL', 'Cruz Azul'),
(16, 2, 'Pumas UNAM', 'Monterrey'),
(16, 3, 'Pachuca', 'León'),
(16, 4, 'Toluca', 'Atlas'),
(16, 5, 'Necaxa', 'Santos Laguna'),
(16, 6, 'Mazatlán', 'Puebla'),
(16, 7, 'Juárez', 'San Luis'),
(16, 8, 'Atlético San Luis', 'Querétaro'),

-- JORNADA 17
(17, 0, 'América', 'Pumas UNAM'),
(17, 1, 'Cruz Azul', 'Guadalajara'),
(17, 2, 'Monterrey', 'Tigres UANL'),
(17, 3, 'León', 'Atlas'),
(17, 4, 'Toluca', 'Santos Laguna'),
(17, 5, 'Necaxa', 'Pachuca'),
(17, 6, 'Mazatlán', 'San Luis'),
(17, 7, 'Juárez', 'Puebla'),
(17, 8, 'Querétaro', 'Atlético San Luis')

ON CONFLICT (jornada_number, match_index) DO NOTHING;

-- =============================================
-- FUNCIÓN: Obtener jornada actual
-- =============================================
CREATE OR REPLACE FUNCTION get_current_jornada()
RETURNS INTEGER AS $$
DECLARE
  v_current_jornada INTEGER;
  v_today DATE := CURRENT_DATE;
BEGIN
  -- Buscar la jornada más próxima que no haya comenzado
  SELECT jornada_number INTO v_current_jornada
  FROM liga_mx_jornadas
  WHERE match_date >= v_today
    OR (match_date IS NULL AND jornada_number = (
      SELECT MIN(jornada_number) 
      FROM liga_mx_jornadas 
      WHERE match_date IS NULL
    ))
  ORDER BY jornada_number
  LIMIT 1;
  
  -- Si no hay jornada próxima, devolver la 1
  IF v_current_jornada IS NULL THEN
    v_current_jornada := 1;
  END IF;
  
  RETURN v_current_jornada;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCIÓN: Actualizar horarios de jornada
-- =============================================
CREATE OR REPLACE FUNCTION update_jornada_schedule(
  p_jornada INTEGER,
  p_match_index INTEGER,
  p_date DATE,
  p_time TIME,
  p_venue TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE liga_mx_jornadas
  SET match_date = p_date,
      match_time = p_time,
      venue = p_venue,
      updated_at = NOW()
  WHERE jornada_number = p_jornada
    AND match_index = p_match_index;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCIÓN: Marcar resultado de partido
-- =============================================
CREATE OR REPLACE FUNCTION update_match_result(
  p_jornada INTEGER,
  p_match_index INTEGER,
  p_home_goals INTEGER,
  p_away_goals INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE liga_mx_jornadas
  SET home_goals = p_home_goals,
      away_goals = p_away_goals,
      status = 'finished',
      updated_at = NOW()
  WHERE jornada_number = p_jornada
    AND match_index = p_match_index;
END;
$$ LANGUAGE plpgsql;
