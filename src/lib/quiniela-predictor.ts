// =============================================
// MOTOR DE PREDICCIÓN PROFESIONAL — QUINIELA
// =============================================
// Sistema avanzado con Poisson, ELO, análisis multivariable
// Basado en modelos estadísticos de predicción deportiva

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// =============================================
// INTERFACES
// =============================================

export interface TeamState {
  team_name: string;
  current_position: number;
  points: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  home_wins: number;
  home_draws: number;
  home_losses: number;
  away_wins: number;
  away_draws: number;
  away_losses: number;
  current_streak: string;
  streak_type: string;
  streak_count: number;
  last_5_results: string;
  form_last_5: number;
  goals_scored_last_5: number;
  goals_conceded_last_5: number;
  avg_goals_scored: number;
  avg_goals_conceded: number;
  top_scorer: string;
  top_scorer_goals: number;
  injured_players: string;
  suspended_players: string;
}

export interface HeadToHeadRecord {
  total_matches: number;
  home_wins: number;
  draws: number;
  away_wins: number;
  avg_home_goals: number;
  avg_away_goals: number;
  recent_form: string;
  last_10_results: string[];
  home_team_goals_scored: number;
  away_team_goals_scored: number;
}

export interface AdvancedStats {
  // ELO Rating
  elo_rating: number;
  elo_change_last_5: number;
  
  // Forma ponderada (más peso a partidos recientes)
  weighted_form: number;
  
  // Eficiencia ofensiva
  shots_per_game: number;
  shot_accuracy: number;
  conversion_rate: number;
  
  // Eficiencia defensiva
  clean_sheets: number;
  clean_sheet_pct: number;
  goals_conceded_per_shot: number;
  
  // Patrones de goles
  goals_first_half: number;
  goals_second_half: number;
  goals_conceded_first_half: number;
  goals_conceded_second_half: number;
  
  // Rendimiento por contexto
  performance_under_pressure: number;
  comeback_ability: number;
  
  // Fatiga
  days_since_last_match: number;
  matches_last_30_days: number;
  fatigue_factor: number;
}

export interface MatchContext {
  is_playoff: boolean;
  must_win_home: boolean;
  must_win_away: boolean;
  home_needs_points: boolean;
  away_needs_points: boolean;
  rivalry_intensity: number;
  match_importance: number; // 0-1
  home_crowd_factor: number; // 0-1
  weather_impact: number; // -1 a 1
  referee_strictness: number; // 0-1
}

export interface PredictionResult {
  // Probabilidades principales
  home_win_prob: number;
  draw_prob: number;
  away_win_prob: number;
  
  // Goles esperados
  expected_home_goals: number;
  expected_away_goals: number;
  expected_total_goals: number;
  
  // Probabilidades de goles
  over_1_5_prob: number;
  over_2_5_prob: number;
  over_3_5_prob: number;
  under_1_5_prob: number;
  under_2_5_prob: number;
  under_3_5_prob: number;
  
  // BTTS (Ambos equipos anotan)
  btts_yes_prob: number;
  btts_no_prob: number;
  
  // Clean sheets
  home_clean_sheet_prob: number;
  away_clean_sheet_prob: number;
  
  // Marcadores más probables
  likely_scores: Array<{ score: string; prob: number }>;
  
  // Confianza
  confidence: number;
  confidence_level: string;
  
  // Factor de predicción
  prediction: string;
  
  // Desglose de factores
  factors: {
    team_strength: { home: number; away: number; diff: number };
    form: { home: number; away: number; weighted_home: number; weighted_away: number };
    h2h: { advantage: number; recent_dominance: number };
    home_away: { home_advantage: number; away_performance: number };
    context: { urgency: number; importance: number; fatigue: number; momentum: number; psychological: number };
    poisson: { lambda_home: number; lambda_away: number };
    elo: { home: number; away: number; diff: number };
  };
}

// =============================================
// CONSTANTES Y PESOS DEL MODELO
// =============================================

// Pesos para cada factor en el modelo final
const MODEL_WEIGHTS = {
  poisson: 0.30,      // Distribución de Poisson
  elo: 0.20,          // ELO Rating
  form: 0.20,         // Forma reciente
  h2h: 0.15,          // Historial cara a cara
  context: 0.15,      // Contexto del partido
};

// Pesos para forma ponderada (decaimiento exponencial)
const FORM_DECAY = 0.85; // Cada partido anterior pesa 85% menos

// Parámetros de Poisson por liga
const LEAGUE_PARAMS: Record<string, { avg_home_goals: number; avg_away_goals: number; home_advantage: number; attack_strength_multiplier: number; defense_strength_multiplier: number }> = {
  "liga-mx": { avg_home_goals: 1.45, avg_away_goals: 1.15, home_advantage: 0.25, attack_strength_multiplier: 1.1, defense_strength_multiplier: 0.9 },
  "premier": { avg_home_goals: 1.53, avg_away_goals: 1.25, home_advantage: 0.30, attack_strength_multiplier: 1.15, defense_strength_multiplier: 0.85 },
  "laliga": { avg_home_goals: 1.48, avg_away_goals: 1.18, home_advantage: 0.28, attack_strength_multiplier: 1.12, defense_strength_multiplier: 0.88 },
};
const LIGA_MX_PARAMS = LEAGUE_PARAMS["liga-mx"];

// Rivalidades conocidas por liga (intensidad 0-1)
const RIVALRIES: Record<string, number> = {
  "América-Cruz Azul": 0.98,
  "América-Guadalajara": 0.98,
  "América-Tigres UANL": 0.90,
  "América-Monterrey": 0.90,
  "Cruz Azul-Guadalajara": 0.85,
  "Cruz Azul-Pumas UNAM": 0.90,
  "Guadalajara-Tigres UANL": 0.85,
  "Guadalajara-Monterrey": 0.85,
  "Tigres UANL-Monterrey": 0.95,
  "Toluca-América": 0.85,
  "León-Guadalajara": 0.80,
  "Santos Laguna-Tigres UANL": 0.80,
  "Pachuca-León": 0.75,
  "Atlas-Guadalajara": 0.75,
  "Puebla-Toluca": 0.70,
  "Necaxa-América": 0.70,
  "Pumas UNAM-América": 0.85,
  "Monterrey-Cruz Azul": 0.75,
  // Premier League
  "Liverpool-Everton": 0.95,
  "Manchester United-Manchester City": 0.95,
  "Arsenal-Tottenham": 0.95,
  "Chelsea-Tottenham": 0.90,
  "Liverpool-Manchester United": 0.90,
  "Arsenal-Chelsea": 0.85,
  "Liverpool-Manchester City": 0.90,
  "Newcastle-Sunderland": 0.85,
  "Manchester City-Liverpool": 0.90,
  "West Ham-Tottenham": 0.80,
  // La Liga
  "Real Madrid-Barcelona": 0.99,
  "Barcelona-Espanyol": 0.90,
  "Real Madrid-Atletico Madrid": 0.95,
  "Barcelona-Atletico Madrid": 0.90,
  "Athletic Bilbao-Real Sociedad": 0.85,
  "Sevilla-Betis": 0.90,
  "Valencia-Villarreal": 0.85,
  "Real Madrid-Valencia": 0.80,
  "Barcelona-Sevilla": 0.80,
  "Atletico Madrid-Sevilla": 0.75,
};

// =============================================
// FUNCIONES AUXILIARES
// =============================================

function getRivalry(team1: string, team2: string): number {
  const key1 = `${team1}-${team2}`;
  const key2 = `${team2}-${team1}`;
  return RIVALRIES[key1] || RIVALRIES[key2] || 0.5;
}

// Factorial para Poisson
function factorial(n: number): number {
  if (n <= 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

// Distribución de Poisson: P(X = k) = (λ^k * e^-λ) / k!
function poissonProbability(lambda: number, k: number): number {
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

// ELO Rating inicial para Liga MX
const INITIAL_ELO = 1500;

// Calcular ELO esperado
function eloExpected(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

// Actualizar ELO
function eloUpdate(rating: number, expected: number, actual: number, kFactor: number = 32): number {
  return rating + kFactor * (actual - expected);
}

// =============================================
// OBTENER DATOS DE LA BASE DE DATOS
// =============================================

export async function getTeamState(teamName: string): Promise<TeamState | null> {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const { data, error } = await supabase
    .from("team_current_state")
    .select("*")
    .eq("team_name", teamName)
    .single();

  if (error || !data) return null;
  return data as TeamState;
}

export async function getHeadToHead(homeTeam: string, awayTeam: string): Promise<HeadToHeadRecord> {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const { data, error } = await supabase
    .from("match_history")
    .select("*")
    .or(`and(home_team.eq.${homeTeam},away_team.eq.${awayTeam}),and(home_team.eq.${awayTeam},away_team.eq.${homeTeam})`)
    .order("match_date", { ascending: false })
    .limit(30);

  if (error || !data || data.length === 0) {
    return {
      total_matches: 0,
      home_wins: 0,
      draws: 0,
      away_wins: 0,
      avg_home_goals: 1.5,
      avg_away_goals: 1.2,
      recent_form: "",
      last_10_results: [],
      home_team_goals_scored: 0,
      away_team_goals_scored: 0,
    };
  }

  let homeWins = 0;
  let draws = 0;
  let awayWins = 0;
  let totalHomeGoals = 0;
  let totalAwayGoals = 0;
  let homeTeamGoals = 0;
  let awayTeamGoals = 0;

  const last10Results: string[] = [];

  for (const match of data) {
    const isHome = match.home_team === homeTeam;
    totalHomeGoals += match.home_goals;
    totalAwayGoals += match.away_goals;
    
    if (isHome) {
      homeTeamGoals += match.home_goals;
      awayTeamGoals += match.away_goals;
    } else {
      homeTeamGoals += match.away_goals;
      awayTeamGoals += match.home_goals;
    }

    if (match.home_goals > match.away_goals) {
      if (isHome) homeWins++;
      else awayWins++;
      last10Results.push(isHome ? "W" : "L");
    } else if (match.home_goals < match.away_goals) {
      if (isHome) awayWins++;
      else homeWins++;
      last10Results.push(isHome ? "L" : "W");
    } else {
      draws++;
      last10Results.push("D");
    }
  }

  return {
    total_matches: data.length,
    home_wins: homeWins,
    draws,
    away_wins: awayWins,
    avg_home_goals: Math.round((totalHomeGoals / data.length) * 100) / 100,
    avg_away_goals: Math.round((totalAwayGoals / data.length) * 100) / 100,
    recent_form: last10Results.slice(0, 5).join("-"),
    last_10_results: last10Results.slice(0, 10),
    home_team_goals_scored: homeTeamGoals,
    away_team_goals_scored: awayTeamGoals,
  };
}

export async function getTeamMatchHistory(teamName: string, limit: number = 20): Promise<any[]> {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const { data, error } = await supabase
    .from("match_history")
    .select("*")
    .or(`home_team.eq.${teamName},away_team.eq.${teamName}`)
    .order("match_date", { ascending: false })
    .limit(limit);

  return error ? [] : (data || []);
}

// =============================================
// CÁLCULO DE ELO RATINGS
// =============================================

function calculateELOFromHistory(matches: any[], teamName: string): { elo: number; last5Change: number } {
  let elo = INITIAL_ELO;
  const eloHistory: number[] = [elo];

  // Procesar partidos del más antiguo al más reciente
  const sortedMatches = [...matches].reverse();

  for (const match of sortedMatches) {
    const isHome = match.home_team === teamName;
    const opponent = isHome ? match.away_team : match.home_team;
    
    // ELO del oponente (simplificado: todos en 1500)
    const opponentElo = INITIAL_ELO;
    
    const expected = eloExpected(elo, opponentElo);
    let actual = 0.5; // Empate
    
    if (isHome) {
      if (match.home_goals > match.away_goals) actual = 1;
      else if (match.home_goals < match.away_goals) actual = 0;
    } else {
      if (match.away_goals > match.home_goals) actual = 1;
      else if (match.away_goals < match.home_goals) actual = 0;
    }

    elo = eloUpdate(elo, expected, actual);
    eloHistory.push(elo);
  }

  // Cambio en últimos 5 partidos
  const last5Change = eloHistory.length > 5 
    ? eloHistory[eloHistory.length - 1] - eloHistory[eloHistory.length - 6]
    : 0;

  return { elo, last5Change };
}

// =============================================
// ANÁLISIS DE PATRONES DE GOLES
// =============================================

function analyzeGoalPatterns(matches: any[], teamName: string): {
  firstHalfGoalsPct: number;
  secondHalfGoalsPct: number;
  earlyGoalTendency: number;
  lateGoalTendency: number;
  goalsWhenLeading: number;
  goalsWhenTrailing: number;
  comebackRate: number;
} {
  if (matches.length === 0) {
    return {
      firstHalfGoalsPct: 0.45,
      secondHalfGoalsPct: 0.55,
      earlyGoalTendency: 0.3,
      lateGoalTendency: 0.25,
      goalsWhenLeading: 0.6,
      goalsWhenTrailing: 0.3,
      comebackRate: 0.2,
    };
  }

  let firstHalfGoals = 0;
  let secondHalfGoals = 0;
  let totalGoals = 0;
  let goalsWhenLeading = 0;
  let goalsWhenTrailing = 0;
  let comebacks = 0;
  let trailingMatches = 0;

  for (const match of matches) {
    const isHome = match.home_team === teamName;
    const goalsFor = isHome ? match.home_goals : match.away_goals;
    const goalsAgainst = isHome ? match.away_goals : match.home_goals;
    
    // Estimar goles por mitad (40% primero, 60% segundo es típico)
    const firstHalf = Math.round(goalsFor * 0.4);
    const secondHalf = goalsFor - firstHalf;
    
    firstHalfGoals += firstHalf;
    secondHalfGoals += secondHalf;
    totalGoals += goalsFor;

    // Análisis de situación
    if (goalsFor > goalsAgainst) {
      goalsWhenLeading += goalsFor;
    } else if (goalsFor < goalsAgainst) {
      goalsWhenTrailing += goalsFor;
      trailingMatches++;
      if (goalsFor >= goalsAgainst) comebacks++;
    }
  }

  return {
    firstHalfGoalsPct: totalGoals > 0 ? firstHalfGoals / totalGoals : 0.45,
    secondHalfGoalsPct: totalGoals > 0 ? secondHalfGoals / totalGoals : 0.55,
    earlyGoalTendency: 0.3, // Típico en Liga MX
    lateGoalTendency: 0.25,
    goalsWhenLeading: totalGoals > 0 ? goalsWhenLeading / totalGoals : 0.6,
    goalsWhenTrailing: totalGoals > 0 ? goalsWhenTrailing / totalGoals : 0.3,
    comebackRate: trailingMatches > 0 ? comebacks / trailingMatches : 0.2,
  };
}

// =============================================
// ANÁLISIS DE MOMENTUM
// =============================================

function analyzeMomentum(results: string[]): {
  currentMomentum: number;
  momentumTrend: string;
  consistency: number;
  volatility: number;
} {
  if (results.length === 0) {
    return { currentMomentum: 0, momentumTrend: "stable", consistency: 0.5, volatility: 0.5 };
  }

  // Calcular momentum con pesos exponenciales
  let momentum = 0;
  const weights = results.map((_, i) => Math.pow(0.7, i));
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  results.forEach((result, i) => {
    if (result === "W") momentum += 3 * weights[i];
    else if (result === "D") momentum += 1 * weights[i];
    else momentum += 0 * weights[i];
  });

  momentum = momentum / totalWeight;

  // Tendencia del momentum
  const recentHalf = results.slice(0, Math.floor(results.length / 2));
  const olderHalf = results.slice(Math.floor(results.length / 2));
  
  const recentMomentum = recentHalf.reduce((sum, r) => 
    sum + (r === "W" ? 3 : r === "D" ? 1 : 0), 0) / (recentHalf.length || 1);
  const olderMomentum = olderHalf.reduce((sum, r) => 
    sum + (r === "W" ? 3 : r === "D" ? 1 : 0), 0) / (olderHalf.length || 1);

  let trend = "stable";
  if (recentMomentum > olderMomentum + 0.5) trend = "improving";
  else if (recentMomentum < olderMomentum - 0.5) trend = "declining";

  // Consistencia (desviación estándar inversa)
  const mean = results.reduce((sum, r) => 
    sum + (r === "W" ? 3 : r === "D" ? 1 : 0), 0) / results.length;
  const variance = results.reduce((sum, r) => {
    const val = r === "W" ? 3 : r === "D" ? 1 : 0;
    return sum + Math.pow(val - mean, 2);
  }, 0) / results.length;
  const consistency = 1 - Math.min(1, Math.sqrt(variance) / 3);

  // Volatilidad (cambios de resultado)
  let changes = 0;
  for (let i = 1; i < results.length; i++) {
    if (results[i] !== results[i - 1]) changes++;
  }
  const volatility = changes / (results.length - 1 || 1);

  return {
    currentMomentum: Math.round(momentum * 100) / 100,
    momentumTrend: trend,
    consistency: Math.round(consistency * 100) / 100,
    volatility: Math.round(volatility * 100) / 100,
  };
}

// =============================================
// FACTORES PSICOLÓGICOS
// =============================================

function analyzePsychologicalFactors(
  homeState: TeamState | null,
  awayState: TeamState | null,
  h2h: HeadToHeadRecord,
  context: MatchContext
): {
  homePsychological: number;
  awayPsychological: number;
  pressureFactor: number;
  confidenceFactor: number;
} {
  let homePsych = 1.0;
  let awayPsych = 1.0;

  // Factor de confianza basado en racha
  if (homeState) {
    if (homeState.streak_type === "W" && homeState.streak_count >= 3) {
      homePsych *= 1.15; // Racha ganadora aumenta confianza
    } else if (homeState.streak_type === "L" && homeState.streak_count >= 3) {
      homePsych *= 0.85; // Racha perdedora baja confianza
    }
  }

  if (awayState) {
    if (awayState.streak_type === "W" && awayState.streak_count >= 3) {
      awayPsych *= 1.12;
    } else if (awayState.streak_type === "L" && awayState.streak_count >= 3) {
      awayPsych *= 0.88;
    }
  }

  // Factor de presión
  let pressureFactor = 1.0;
  if (context.must_win_home) pressureFactor *= 1.1; // Presión adicional
  if (context.must_win_away) pressureFactor *= 1.08;

  // Factor de confianza en H2H
  if (h2h.total_matches >= 5) {
    const homeH2HWins = h2h.last_10_results.filter(r => r === "W").length;
    if (homeH2HWins >= 3) homePsych *= 1.08;
    else if (homeH2HWins <= 1) homePsych *= 0.92;
  }

  return {
    homePsychological: Math.round(homePsych * 100) / 100,
    awayPsychological: Math.round(awayPsych * 100) / 100,
    pressureFactor,
    confidenceFactor: (homePsych + awayPsych) / 2,
  };
}

// =============================================
// ANÁLISIS DE LOCALÍA AVANZADO
// =============================================

function analyzeHomeAdvantage(
  homeState: TeamState | null,
  awayState: TeamState | null,
  homeAdvanced: AdvancedStats,
  awayAdvanced: AdvancedStats
): {
  homeAdvantageFactor: number;
  awayDisadvantageFactor: number;
  homeWinPctAtHome: number;
  awayWinPctAway: number;
} {
  // Calcular porcentajes de victoria
  let homeWinPct = 0.45; // Default Liga MX
  let awayWinPct = 0.30; // Default Liga MX

  if (homeState && homeState.home_wins + homeState.home_draws + homeState.home_losses > 0) {
    const homeTotal = homeState.home_wins + homeState.home_draws + homeState.home_losses;
    homeWinPct = homeState.home_wins / homeTotal;
  }

  if (awayState && awayState.away_wins + awayState.away_draws + awayState.away_losses > 0) {
    const awayTotal = awayState.away_wins + awayState.away_draws + awayState.away_losses;
    awayWinPct = awayState.away_wins / awayTotal;
  }

  // Factor de ventaja de localía
  const homeAdvantageFactor = 1 + (homeWinPct - 0.4) * 0.5;
  const awayDisadvantageFactor = 1 - (awayWinPct - 0.35) * 0.3;

  return {
    homeAdvantageFactor: Math.round(homeAdvantageFactor * 100) / 100,
    awayDisadvantageFactor: Math.round(awayDisadvantageFactor * 100) / 100,
    homeWinPctAtHome: Math.round(homeWinPct * 100) / 100,
    awayWinPctAway: Math.round(awayWinPct * 100) / 100,
  };
}

// =============================================
// CÁLCULO DE FORMA PONDERADA
// =============================================

function calculateWeightedForm(results: string[]): number {
  let weightedSum = 0;
  let weightSum = 0;

  results.forEach((result, index) => {
    const weight = Math.pow(FORM_DECAY, index);
    let points = 0;
    
    if (result === "W") points = 3;
    else if (result === "D") points = 1;
    else points = 0;

    weightedSum += points * weight;
    weightSum += weight;
  });

  return weightSum > 0 ? (weightedSum / weightSum) * 10 / 3 : 5; // Normalizar a 0-10
}

// =============================================
// CÁLCULO DE ESTADÍSTICAS AVANZADAS
// =============================================

function calculateAdvancedStats(
  matches: any[],
  teamName: string,
  teamState: TeamState | null
): AdvancedStats {
  const results = matches.map(match => {
    const isHome = match.home_team === teamName;
    const goalsFor = isHome ? match.home_goals : match.away_goals;
    const goalsAgainst = isHome ? match.away_goals : match.home_goals;
    
    let result = "D";
    if (goalsFor > goalsAgainst) result = "W";
    else if (goalsFor < goalsAgainst) result = "L";
    
    return {
      goalsFor,
      goalsAgainst,
      result,
      isHome,
      date: new Date(match.match_date),
    };
  });

  // Forma ponderada
  const weightedForm = calculateWeightedForm(results.map(r => r.result));

  // Calcular ELO
  const { elo, last5Change } = calculateELOFromHistory(matches, teamName);

  // Estadísticas básicas
  const totalMatches = results.length || 1;
  const goalsScored = results.reduce((sum, r) => sum + r.goalsFor, 0);
  const goalsConceded = results.reduce((sum, r) => sum + r.goalsAgainst, 0);
  
  // Clean sheets
  const cleanSheets = results.filter(r => r.goalsAgainst === 0).length;
  const cleanSheetPct = cleanSheets / totalMatches;

  // Goles por mitad (estimación: 45% primero, 55% segundo)
  const goalsFirstHalf = Math.round(goalsScored * 0.45);
  const goalsSecondHalf = goalsScored - goalsFirstHalf;
  const goalsConcededFirstHalf = Math.round(goalsConceded * 0.42);
  const goalsConcededSecondHalf = goalsConceded - goalsConcededFirstHalf;

  // Días desde último partido
  const lastMatchDate = results.length > 0 ? results[0].date : new Date();
  const daysSinceLastMatch = Math.floor(
    (Date.now() - lastMatchDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Partidos en últimos 30 días
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const matchesLast30Days = results.filter(r => r.date >= thirtyDaysAgo).length;

  // Factor de fatiga (0.8-1.2)
  let fatigueFactor = 1.0;
  if (matchesLast30Days >= 8) fatigueFactor = 0.85; // Sobrecarga
  else if (matchesLast30Days >= 6) fatigueFactor = 0.92;
  else if (matchesLast30Days <= 3) fatigueFactor = 1.1; // Descansado

  // Rendimiento bajo presión (últimos 10 partidos decisivos)
  const recentResults = results.slice(0, 10);
  const performanceUnderPressure = recentResults.length > 0
    ? recentResults.filter(r => r.result === "W").length / recentResults.length
    : 0.5;

  // Capacidad de comeback (partidos donde ganó después de ir perdiendo)
  // Simplificado: usamos proporción de victorias
  const comebackAbility = teamState ? 
    Math.min(1, (teamState.wins / (teamState.played || 1)) * 1.5) : 0.5;

  // Estadísticas de tiro (estimación basada en goles)
  const shotsPerGame = goalsScored / totalMatches * 4.5; // Ratio típico
  const conversionRate = goalsScored / (shotsPerGame * totalMatches || 1);
  const shotAccuracy = conversionRate * 2.5; // Factor de precisión

  return {
    elo_rating: elo,
    elo_change_last_5: last5Change,
    weighted_form: weightedForm,
    shots_per_game: Math.round(shotsPerGame * 10) / 10,
    shot_accuracy: Math.round(shotAccuracy * 100) / 100,
    conversion_rate: Math.round(conversionRate * 100) / 100,
    clean_sheets: cleanSheets,
    clean_sheet_pct: Math.round(cleanSheetPct * 100) / 100,
    goals_conceded_per_shot: goalsConceded / (shotsPerGame * totalMatches || 1),
    goals_first_half: goalsFirstHalf,
    goals_second_half: goalsSecondHalf,
    goals_conceded_first_half: goalsConcededFirstHalf,
    goals_conceded_second_half: goalsConcededSecondHalf,
    performance_under_pressure: Math.round(performanceUnderPressure * 100) / 100,
    comeback_ability: Math.round(comebackAbility * 100) / 100,
    days_since_last_match: daysSinceLastMatch,
    matches_last_30_days: matchesLast30Days,
    fatigue_factor: fatigueFactor,
  };
}

// =============================================
// MODELO DE POISSON MEJORADO
// =============================================

function poissonModel(
  homeAttack: number,
  homeDefense: number,
  awayAttack: number,
  awayDefense: number,
  homeAdvantage: number,
  leagueParams: typeof LIGA_MX_PARAMS = LIGA_MX_PARAMS
): {
  lambdaHome: number;
  lambdaAway: number;
  homeWinProb: number;
  drawProb: number;
  awayWinProb: number;
  over15: number;
  over25: number;
  over35: number;
  under15: number;
  under25: number;
  under35: number;
  bttsYes: number;
  bttsNo: number;
  homeCleanSheet: number;
  awayCleanSheet: number;
  likelyScores: Array<{ score: string; prob: number }>;
} {
  // Calcular lambda (goles esperados) para cada equipo
  const lambdaHome = homeAttack * leagueParams.avg_home_goals * homeAdvantage;
  const lambdaAway = awayAttack * leagueParams.avg_away_goals;

  // Matriz de probabilidades para cada marcador
  const maxGoals = 8;
  const scoreProbs: number[][] = [];
  
  for (let i = 0; i <= maxGoals; i++) {
    scoreProbs[i] = [];
    for (let j = 0; j <= maxGoals; j++) {
      scoreProbs[i][j] = poissonProbability(lambdaHome, i) * poissonProbability(lambdaAway, j);
    }
  }

  // Calcular probabilidades de resultado
  let homeWinProb = 0;
  let drawProb = 0;
  let awayWinProb = 0;

  for (let i = 0; i <= maxGoals; i++) {
    for (let j = 0; j <= maxGoals; j++) {
      if (i > j) homeWinProb += scoreProbs[i][j];
      else if (i === j) drawProb += scoreProbs[i][j];
      else awayWinProb += scoreProbs[i][j];
    }
  }

  // Over/Under
  let over15 = 0, over25 = 0, over35 = 0;
  for (let i = 0; i <= maxGoals; i++) {
    for (let j = 0; j <= maxGoals; j++) {
      const total = i + j;
      if (total > 1.5) over15 += scoreProbs[i][j];
      if (total > 2.5) over25 += scoreProbs[i][j];
      if (total > 3.5) over35 += scoreProbs[i][j];
    }
  }

  // BTTS
  let bttsYes = 0;
  for (let i = 1; i <= maxGoals; i++) {
    for (let j = 1; j <= maxGoals; j++) {
      bttsYes += scoreProbs[i][j];
    }
  }

  // Clean sheets
  let homeCleanSheet = 0;
  let awayCleanSheet = 0;
  for (let i = 0; i <= maxGoals; i++) {
    homeCleanSheet += scoreProbs[i][0];
    awayCleanSheet += scoreProbs[0][i];
  }

  // Marcadores más probables
  const scores: Array<{ score: string; prob: number }> = [];
  for (let i = 0; i <= 5; i++) {
    for (let j = 0; j <= 5; j++) {
      scores.push({
        score: `${i}-${j}`,
        prob: Math.round(scoreProbs[i][j] * 10000) / 100,
      });
    }
  }
  scores.sort((a, b) => b.prob - a.prob);

  return {
    lambdaHome: Math.round(lambdaHome * 100) / 100,
    lambdaAway: Math.round(lambdaAway * 100) / 100,
    homeWinProb: Math.round(homeWinProb * 10000) / 10000,
    drawProb: Math.round(drawProb * 10000) / 10000,
    awayWinProb: Math.round(awayWinProb * 10000) / 10000,
    over15: Math.round(over15 * 10000) / 10000,
    over25: Math.round(over25 * 10000) / 10000,
    over35: Math.round(over35 * 10000) / 10000,
    under15: Math.round((1 - over15) * 10000) / 10000,
    under25: Math.round((1 - over25) * 10000) / 10000,
    under35: Math.round((1 - over35) * 10000) / 10000,
    bttsYes: Math.round(bttsYes * 10000) / 10000,
    bttsNo: Math.round((1 - bttsYes) * 10000) / 10000,
    homeCleanSheet: Math.round(homeCleanSheet * 10000) / 10000,
    awayCleanSheet: Math.round(awayCleanSheet * 10000) / 10000,
    likelyScores: scores.slice(0, 10),
  };
}

// =============================================
// MODELO ELO
// =============================================

function eloModel(homeElo: number, awayElo: number): {
  homeWinProb: number;
  drawProb: number;
  awayWinProb: number;
} {
  const homeAdvantage = 65; // Ventaja de localía en puntos ELO
  const adjustedHomeElo = homeElo + homeAdvantage;

  const homeExpected = eloExpected(adjustedHomeElo, awayElo);
  const awayExpected = eloExpected(awayElo, adjustedHomeElo);

  // Ajustar para empate (ELO no predice empates directamente)
  const drawFactor = 0.26; // Tasa típica de empates en Liga MX
  const homeWinProb = (1 - drawFactor) * homeExpected;
  const awayWinProb = (1 - drawFactor) * awayExpected;
  const drawProb = drawFactor;

  return {
    homeWinProb: Math.round(homeWinProb * 10000) / 10000,
    drawProb: Math.round(drawProb * 10000) / 10000,
    awayWinProb: Math.round(awayWinProb * 10000) / 10000,
  };
}

// =============================================
// MODELO DE FORMA
// =============================================

function formModel(
  homeForm: number,
  awayForm: number,
  homeWeightedForm: number,
  awayWeightedForm: number,
  homeStreak: { type: string; count: number },
  awayStreak: { type: string; count: number }
): {
  homeWinProb: number;
  drawProb: number;
  awayWinProb: number;
} {
  // Diferencia de forma
  const formDiff = homeForm - awayForm;
  const weightedFormDiff = homeWeightedForm - awayWeightedForm;

  // Factor de racha
  let streakFactor = 0;
  if (homeStreak.type === "W") streakFactor += homeStreak.count * 0.03;
  else if (homeStreak.type === "L") streakFactor -= homeStreak.count * 0.03;
  
  if (awayStreak.type === "W") streakFactor -= awayStreak.count * 0.02;
  else if (awayStreak.type === "L") streakFactor += awayStreak.count * 0.02;

  // Convertir a probabilidades
  const baseHome = 0.42;
  const baseDraw = 0.26;
  const baseAway = 0.32;

  const homeWinProb = baseHome + formDiff * 0.02 + weightedFormDiff * 0.03 + streakFactor;
  const awayWinProb = baseAway - formDiff * 0.02 - weightedFormDiff * 0.03 + streakFactor * 0.8;
  const drawProb = baseDraw - Math.abs(formDiff) * 0.01 - Math.abs(weightedFormDiff) * 0.01;

  // Normalizar
  const total = homeWinProb + drawProb + awayWinProb;
  return {
    homeWinProb: Math.max(0.1, Math.min(0.7, homeWinProb / total)),
    drawProb: Math.max(0.15, Math.min(0.35, drawProb / total)),
    awayWinProb: Math.max(0.1, Math.min(0.7, awayWinProb / total)),
  };
}

// =============================================
// MODELO H2H (HEAD-TO-HEAD)
// =============================================

function h2hModel(h2h: HeadToHeadRecord, homeTeam: string): {
  homeWinProb: number;
  drawProb: number;
  awayWinProb: number;
} {
  if (h2h.total_matches < 3) {
    return { homeWinProb: 0.42, drawProb: 0.26, awayWinProb: 0.32 };
  }

  const homeWinRate = h2h.home_wins / h2h.total_matches;
  const awayWinRate = h2h.away_wins / h2h.total_matches;
  const drawRate = h2h.draws / h2h.total_matches;

  // Ponderar por recencia (últimos 10 pesan más)
  const recentResults = h2h.last_10_results.slice(0, 10);
  let recentHomeWins = 0;
  let recentDraws = 0;
  let recentAwayWins = 0;

  recentResults.forEach((r, i) => {
    const weight = Math.pow(0.85, i);
    if (r === "W") recentHomeWins += weight;
    else if (r === "D") recentDraws += weight;
    else recentAwayWins += weight;
  });

  const recentTotal = recentHomeWins + recentDraws + recentAwayWins || 1;

  // Combinar histórico y reciente
  const homeWinProb = (homeWinRate * 0.4 + (recentHomeWins / recentTotal) * 0.6);
  const awayWinProb = (awayWinRate * 0.4 + (recentAwayWins / recentTotal) * 0.6);
  const drawProb = (drawRate * 0.4 + (recentDraws / recentTotal) * 0.6);

  return {
    homeWinProb: Math.round(homeWinProb * 10000) / 10000,
    drawProb: Math.round(drawProb * 10000) / 10000,
    awayWinProb: Math.round(awayWinProb * 10000) / 10000,
  };
}

// =============================================
// MODELO DE CONTEXTO
// =============================================

function contextModel(
  homeState: TeamState | null,
  awayState: TeamState | null,
  homeAdvanced: AdvancedStats,
  awayAdvanced: AdvancedStats,
  context: MatchContext
): {
  homeWinProb: number;
  drawProb: number;
  awayWinProb: number;
} {
  let homeFactor = 1.0;
  let awayFactor = 1.0;

  // Factor de urgencia
  if (context.must_win_home) homeFactor *= 1.20;
  if (context.must_win_away) awayFactor *= 1.20;

  // Factor de importancia del partido
  const importanceFactor = 1 + context.match_importance * 0.15;
  homeFactor *= importanceFactor;
  awayFactor *= importanceFactor;

  // Factor de fatiga
  homeFactor *= homeAdvanced.fatigue_factor;
  awayFactor *= awayAdvanced.fatigue_factor;

  // Factor de ventaja de localía (crowd)
  homeFactor *= (1 + context.home_crowd_factor * 0.1);

  // Factor de rivalidad (los clásicos son más impredecibles)
  const rivalryFactor = context.rivalry_intensity;
  const unpredictability = 1 - rivalryFactor * 0.3; // Más rivalidad = más empates

  // Diferencia de posición
  if (homeState && awayState) {
    const posDiff = homeState.current_position - awayState.current_position;
    if (posDiff < -4) homeFactor *= 1.10; // Local va mejor, presiona
    if (posDiff > 4) awayFactor *= 1.10; // Visitante va mejor
  }

  // Convertir a probabilidades
  const baseHome = 0.42;
  const baseDraw = 0.26;
  const baseAway = 0.32;

  let homeWinProb = baseHome * homeFactor;
  let awayWinProb = baseAway * awayFactor;
  let drawProb = baseDraw * unpredictability;

  // Normalizar
  const total = homeWinProb + drawProb + awayWinProb;
  return {
    homeWinProb: Math.round(homeWinProb / total * 10000) / 10000,
    drawProb: Math.round(drawProb / total * 10000) / 10000,
    awayWinProb: Math.round(awayWinProb / total * 10000) / 10000,
  };
}

// =============================================
// PREDICCIÓN PRINCIPAL (VERSIÓN MEJORADA)
// =============================================

export async function predictMatch(
  homeTeam: string,
  awayTeam: string,
  league: string = "liga-mx",
  context: MatchContext = {
    is_playoff: false,
    must_win_home: false,
    must_win_away: false,
    home_needs_points: false,
    away_needs_points: false,
    rivalry_intensity: 0.5,
    match_importance: 0.5,
    home_crowd_factor: 0.7,
    weather_impact: 0,
    referee_strictness: 0.5,
  }
): Promise<PredictionResult> {
  // Parámetros de la liga
  const leagueParams = LEAGUE_PARAMS[league] || LEAGUE_PARAMS["liga-mx"];
  
  // Obtener todos los datos
  const [homeState, awayState, h2h, homeMatches, awayMatches] = await Promise.all([
    getTeamState(homeTeam),
    getTeamState(awayTeam),
    getHeadToHead(homeTeam, awayTeam),
    getTeamMatchHistory(homeTeam, 30),
    getTeamMatchHistory(awayTeam, 30),
  ]);

  // Calcular estadísticas avanzadas
  const homeAdvanced = calculateAdvancedStats(homeMatches, homeTeam, homeState);
  const awayAdvanced = calculateAdvancedStats(awayMatches, awayTeam, awayState);

  // Nuevos análisis avanzados
  const homeGoalPatterns = analyzeGoalPatterns(homeMatches, homeTeam);
  const awayGoalPatterns = analyzeGoalPatterns(awayMatches, awayTeam);
  
  const homeMomentum = analyzeMomentum(
    homeMatches.map(m => {
      const isHome = m.home_team === homeTeam;
      if (m.home_goals > m.away_goals) return isHome ? "W" : "L";
      if (m.home_goals < m.away_goals) return isHome ? "L" : "W";
      return "D";
    })
  );
  const awayMomentum = analyzeMomentum(
    awayMatches.map(m => {
      const isHome = m.home_team === awayTeam;
      if (m.home_goals > m.away_goals) return isHome ? "W" : "L";
      if (m.home_goals < m.away_goals) return isHome ? "L" : "W";
      return "D";
    })
  );

  const psychological = analyzePsychologicalFactors(homeState, awayState, h2h, context);
  const homeAdvantage = analyzeHomeAdvantage(homeState, awayState, homeAdvanced, awayAdvanced);

  // Calcular fuerza de ataque y defensa
  const homeAttack = homeState 
    ? (homeState.avg_goals_scored / leagueParams.avg_home_goals) * leagueParams.attack_strength_multiplier
    : 1.0;
  const homeDefense = homeState
    ? (homeState.avg_goals_conceded / leagueParams.avg_away_goals) * leagueParams.defense_strength_multiplier
    : 1.0;
  const awayAttack = awayState
    ? (awayState.avg_goals_scored / leagueParams.avg_away_goals) * leagueParams.attack_strength_multiplier
    : 1.0;
  const awayDefense = awayState
    ? (awayState.avg_goals_conceded / leagueParams.avg_home_goals) * leagueParams.defense_strength_multiplier
    : 1.0;

  // 1. Modelo de Poisson (ajustado por patrones de goles)
  const poisson = poissonModel(homeAttack, homeDefense, awayAttack, awayDefense, 1.0, leagueParams);

  // 2. Modelo ELO
  const elo = eloModel(homeAdvanced.elo_rating, awayAdvanced.elo_rating);

  // 3. Modelo de Forma (ajustado por momentum)
  const homeStreak = homeState ? { type: homeState.streak_type, count: homeState.streak_count } : { type: "", count: 0 };
  const awayStreak = awayState ? { type: awayState.streak_type, count: awayState.streak_count } : { type: "", count: 0 };
  
  const form = formModel(
    homeState?.form_last_5 || 5,
    awayState?.form_last_5 || 5,
    homeAdvanced.weighted_form,
    awayAdvanced.weighted_form,
    homeStreak,
    awayStreak
  );

  // 4. Modelo H2H
  const h2hModelResult = h2hModel(h2h, homeTeam);

  // 5. Modelo de Contexto (ajustado por psicología y localía)
  const contextModelResult = contextModel(homeState, awayState, homeAdvanced, awayAdvanced, context);

  // =============================================
  // MODELO DE ENSEMBLE MEJORADO
  // =============================================
  
  // Pesos adaptativos basados en cantidad de datos
  const homeDataQuality = homeMatches.length / 30; // 0-1
  const awayDataQuality = awayMatches.length / 30;
  const dataQuality = (homeDataQuality + awayDataQuality) / 2;

  // Ajustar pesos según calidad de datos
  const adjustedWeights = {
    poisson: MODEL_WEIGHTS.poisson * (0.8 + dataQuality * 0.4),
    elo: MODEL_WEIGHTS.elo * (0.9 + dataQuality * 0.2),
    form: MODEL_WEIGHTS.form * (0.85 + dataQuality * 0.3),
    h2h: MODEL_WEIGHTS.h2h * (0.7 + dataQuality * 0.6),
    context: MODEL_WEIGHTS.context,
  };

  // Normalizar pesos
  const totalWeight = Object.values(adjustedWeights).reduce((a, b) => a + b, 0);
  Object.keys(adjustedWeights).forEach(key => {
    adjustedWeights[key as keyof typeof adjustedWeights] /= totalWeight;
  });

  // Combinar modelos
  let homeWinProb = 
    poisson.homeWinProb * adjustedWeights.poisson +
    elo.homeWinProb * adjustedWeights.elo +
    form.homeWinProb * adjustedWeights.form +
    h2hModelResult.homeWinProb * adjustedWeights.h2h +
    contextModelResult.homeWinProb * adjustedWeights.context;

  let drawProb = 
    poisson.drawProb * adjustedWeights.poisson +
    elo.drawProb * adjustedWeights.elo +
    form.drawProb * adjustedWeights.form +
    h2hModelResult.drawProb * adjustedWeights.h2h +
    contextModelResult.drawProb * adjustedWeights.context;

  let awayWinProb = 
    poisson.awayWinProb * adjustedWeights.poisson +
    elo.awayWinProb * adjustedWeights.elo +
    form.awayWinProb * adjustedWeights.form +
    h2hModelResult.awayWinProb * adjustedWeights.h2h +
    contextModelResult.awayWinProb * adjustedWeights.context;

  // =============================================
  // AJUSTES FINALES
  // =============================================

  // Ajuste por momentum
  const momentumDiff = homeMomentum.currentMomentum - awayMomentum.currentMomentum;
  homeWinProb += momentumDiff * 0.02;
  awayWinProb -= momentumDiff * 0.02;

  // Ajuste por factores psicológicos
  homeWinProb *= psychological.homePsychological;
  awayWinProb *= psychological.awayPsychological;

  // Ajuste por ventaja de localía
  homeWinProb *= homeAdvantage.homeAdvantageFactor;
  awayWinProb *= homeAdvantage.awayDisadvantageFactor;

  // Ajuste por patrones de goles
  if (homeGoalPatterns.secondHalfGoalsPct > 0.55) {
    homeWinProb *= 1.03; // Equipo que anota más en segundo tiempo
  }
  if (awayGoalPatterns.secondHalfGoalsPct > 0.55) {
    awayWinProb *= 1.03;
  }

  // Ajuste por capacidad de comeback
  if (homeGoalPatterns.comebackRate > 0.3) {
    homeWinProb *= 1.05; // Buen comeback
  }
  if (awayGoalPatterns.comebackRate > 0.3) {
    awayWinProb *= 1.05;
  }

  // Normalizar probabilidades
  const total = homeWinProb + drawProb + awayWinProb;
  const normalizedHome = homeWinProb / total;
  const normalizedDraw = drawProb / total;
  const normalizedAway = awayWinProb / total;

  // Calcular confianza (entropía normalizada)
  const entropy = -(
    normalizedHome * Math.log2(normalizedHome) +
    normalizedDraw * Math.log2(normalizedDraw) +
    normalizedAway * Math.log2(normalizedAway)
  );
  const confidence = Math.round((1 - entropy / Math.log2(3)) * 100) / 100;

  let confidenceLevel = "Baja";
  if (confidence >= 0.6) confidenceLevel = "Muy Alta";
  else if (confidence >= 0.5) confidenceLevel = "Alta";
  else if (confidence >= 0.4) confidenceLevel = "Media";

  // Determinar predicción
  let prediction = "X";
  if (normalizedHome > normalizedDraw && normalizedHome > normalizedAway) prediction = "1";
  else if (normalizedAway > normalizedDraw && normalizedAway > normalizedHome) prediction = "2";

  // Calcular goles esperados (ajustados por patrones)
  const expectedHomeGoals = poisson.lambdaHome * (1 + homeGoalPatterns.goalsWhenLeading * 0.1);
  const expectedAwayGoals = poisson.lambdaAway * (1 + awayGoalPatterns.goalsWhenLeading * 0.1);
  const expectedTotalGoals = expectedHomeGoals + expectedAwayGoals;

  return {
    home_win_prob: Math.round(normalizedHome * 10000) / 10000,
    draw_prob: Math.round(normalizedDraw * 10000) / 10000,
    away_win_prob: Math.round(normalizedAway * 10000) / 10000,
    expected_home_goals: Math.round(expectedHomeGoals * 100) / 100,
    expected_away_goals: Math.round(expectedAwayGoals * 100) / 100,
    expected_total_goals: Math.round(expectedTotalGoals * 100) / 100,
    over_1_5_prob: poisson.over15,
    over_2_5_prob: poisson.over25,
    over_3_5_prob: poisson.over35,
    under_1_5_prob: poisson.under15,
    under_2_5_prob: poisson.under25,
    under_3_5_prob: poisson.under35,
    btts_yes_prob: poisson.bttsYes,
    btts_no_prob: poisson.bttsNo,
    home_clean_sheet_prob: poisson.homeCleanSheet,
    away_clean_sheet_prob: poisson.awayCleanSheet,
    likely_scores: poisson.likelyScores.slice(0, 5),
    confidence: confidence,
    confidence_level: confidenceLevel,
    prediction,
    factors: {
      team_strength: {
        home: homeAdvanced.elo_rating,
        away: awayAdvanced.elo_rating,
        diff: homeAdvanced.elo_rating - awayAdvanced.elo_rating,
      },
      form: {
        home: homeState?.form_last_5 || 5,
        away: awayState?.form_last_5 || 5,
        weighted_home: Math.round(homeAdvanced.weighted_form * 100) / 100,
        weighted_away: Math.round(awayAdvanced.weighted_form * 100) / 100,
      },
      h2h: {
        advantage: h2h.home_team_goals_scored - h2h.away_team_goals_scored,
        recent_dominance: h2h.last_10_results.filter(r => r === "W").length / (h2h.last_10_results.length || 1),
      },
      home_away: {
        home_advantage: homeAdvantage.homeWinPctAtHome,
        away_performance: homeAdvantage.awayWinPctAway,
      },
      context: {
        urgency: context.must_win_home ? 1.2 : context.must_win_away ? 0.8 : 1.0,
        importance: context.match_importance,
        fatigue: (homeAdvanced.fatigue_factor + awayAdvanced.fatigue_factor) / 2,
        momentum: momentumDiff,
        psychological: psychological.confidenceFactor,
      },
      poisson: {
        lambda_home: poisson.lambdaHome,
        lambda_away: poisson.lambdaAway,
      },
      elo: {
        home: homeAdvanced.elo_rating,
        away: awayAdvanced.elo_rating,
        diff: homeAdvanced.elo_rating - awayAdvanced.elo_rating,
      },
    },
  };
}

export function getPredictionLabel(prediction: string): string {
  switch (prediction) {
    case "1": return "Local";
    case "X": return "Empate";
    case "2": return "Visitante";
    default: return "N/A";
  }
}

export function getConfidenceLabel(confidence: number): string {
  if (confidence >= 0.6) return "Muy Alta";
  if (confidence >= 0.5) return "Alta";
  if (confidence >= 0.4) return "Media";
  if (confidence >= 0.3) return "Baja";
  return "Muy Baja";
}
