-- =============================================
-- TABLAS JORNADAS MULTI-LIGA
-- =============================================
-- Premier League y La Liga: 20 equipos, 38 jornadas

-- Tabla Premier League
CREATE TABLE IF NOT EXISTS premier_jornadas (
  id SERIAL PRIMARY KEY,
  jornada_number INTEGER NOT NULL,
  match_index INTEGER NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  match_date TEXT,
  match_time TEXT,
  venue TEXT DEFAULT '',
  status TEXT DEFAULT 'scheduled',
  home_goals INTEGER,
  away_goals INTEGER,
  UNIQUE (jornada_number, match_index)
);

-- Tabla La Liga
CREATE TABLE IF NOT EXISTS laliga_jornadas (
  id SERIAL PRIMARY KEY,
  jornada_number INTEGER NOT NULL,
  match_index INTEGER NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  match_date TEXT,
  match_time TEXT,
  venue TEXT DEFAULT '',
  status TEXT DEFAULT 'scheduled',
  home_goals INTEGER,
  away_goals INTEGER,
  UNIQUE (jornada_number, match_index)
);

-- Agregar columna league a tablas de predicciones si no existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quiniela_predictions' AND column_name = 'league') THEN
    ALTER TABLE quiniela_predictions ADD COLUMN league TEXT DEFAULT 'liga-mx';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quiniela_daily_predictions' AND column_name = 'league') THEN
    ALTER TABLE quiniela_daily_predictions ADD COLUMN league TEXT DEFAULT 'liga-mx';
  END IF;
END $$;

-- Función genérica para obtener jornada actual por liga
CREATE OR REPLACE FUNCTION get_current_jornada_by_league(p_league TEXT)
RETURNS INTEGER AS $$
DECLARE
  result INTEGER;
BEGIN
  IF p_league = 'premier' THEN
    SELECT jornada_number INTO result FROM premier_jornadas
    WHERE match_date IS NOT NULL AND match_date::date >= CURRENT_DATE
    ORDER BY match_date::date ASC LIMIT 1;
  ELSIF p_league = 'laliga' THEN
    SELECT jornada_number INTO result FROM laliga_jornadas
    WHERE match_date IS NOT NULL AND match_date::date >= CURRENT_DATE
    ORDER BY match_date::date ASC LIMIT 1;
  ELSE
    SELECT jornada_number INTO result FROM liga_mx_jornadas
    WHERE match_date IS NOT NULL AND match_date::date >= CURRENT_DATE
    ORDER BY match_date::date ASC LIMIT 1;
  END IF;

  IF result IS NULL THEN
    IF p_league = 'premier' THEN
      SELECT MIN(jornada_number) INTO result FROM premier_jornadas WHERE match_date IS NULL;
    ELSIF p_league = 'laliga' THEN
      SELECT MIN(jornada_number) INTO result FROM laliga_jornadas WHERE match_date IS NULL;
    ELSE
      result := 1;
    END IF;
  END IF;

  RETURN COALESCE(result, 1);
END;
$$ LANGUAGE plpgsql;
