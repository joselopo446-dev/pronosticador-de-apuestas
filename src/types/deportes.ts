// =============================================
// TIPOS DEL DOMINIO DEPORTIVO
// =============================================
// Estos tipos definen la estructura de datos que usamos internamente.
// Se mapean desde la respuesta de API-Football a estos tipos simplificados.
//
// ¿Por qué tipos separados?
// - Los tipos de la API son muy verbosos (contienen info innecesaria).
// - Estos tipos son más limpios y fáciles de usar en el frontend.
// - Si cambiamos de proveedor, solo modificamos el mapeo en api-football.ts.

/**
 * Liga deportiva (ej: Liga MX, La Liga)
 */
export interface League {
  id: number;
  name: string;
  country: string;
  logo: string;
  flag: string;
}

/**
 * Equipo deportivo (ej: Club América, Real Madrid)
 */
export interface Team {
  id: number;
  name: string;
  logo: string;
  venue: string;
}

/**
 * Partido/Fixture programado o jugado
 */
export interface Fixture {
  id: number;
  date: string;
  time?: string;
  status: {
    short: string; // "NS" (Not Started), "1H", "2H", "FT", etc.
    long: string; // "Not Started", "First Half", "Full Time", etc.
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
      winner?: boolean;
    };
    away: {
      id: number;
      name: string;
      logo: string;
      winner?: boolean;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  league: {
    id: number;
    name: string;
    round: string;
  };
}

/**
 * Posición en la tabla de un equipo
 */
export interface Standing {
  rank: number;
  team: Team;
  points: number;
  goalsDiff: number;
  form: string; // "WWLDW" - últimos 5 resultados
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: {
      for: number;
      against: number;
    };
  };
}

/**
 * Estadísticas de un partido (para ambos equipos)
 */
export interface MatchStatistics {
  team: Team;
  statistics: {
    possession: number;
    shots: number;
    shotsOnTarget: number;
    corners: number;
    fouls: number;
    yellowCards: number;
    redCards: number;
  };
}

/**
 * Predicción generada por el modelo
 */
export interface Prediction {
  id: string;
  matchId: string;
  modelVersion: string;
  probabilities: {
    homeWin: number;
    draw: number;
    awayWin: number;
  };
  expectedGoals: {
    home: number;
    away: number;
  };
  markets: {
    over25: number;
    btts: number; // Both Teams To Score
  };
  mostLikelyScore: string;
  confidence: "alta" | "media" | "baja";
  explanation: Record<string, unknown>;
  createdAt: string;
}
