// =============================================
// MOTOR DE PREDICCIÓN — QUINIELA MEXICANA
// =============================================
// Predice resultados de Liga MX usando datos históricos y estado actual

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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
  recent_form: string; // Últimos 5 resultados
}

export interface MatchContext {
  is_playoff: boolean;
  must_win_home: boolean;
  must_win_away: boolean;
  home_needs_points: boolean;
  away_needs_points: boolean;
  rivalry_intensity: number; // 0-1
}

export interface PredictionFactors {
  team_state: {
    home_strength: number;
    away_strength: number;
    form_difference: number;
    streak_factor: number;
  };
  history: {
    h2h_advantage: number;
    home_away_tendency: number;
  };
  form: {
    home_form: number;
    away_form: number;
    momentum: number;
  };
  context: {
    urgency_factor: number;
    home_advantage: number;
  };
  combined: {
    home_win_prob: number;
    draw_prob: number;
    away_win_prob: number;
    expected_home_goals: number;
    expected_away_goals: number;
  };
}

// Rivalidades conocidas (intensidad 0-1)
const RIVALRIES: Record<string, number> = {
  "América-Cruz Azul": 0.95, // Clásico Joven
  "América-Guadalajara": 0.95, // Clásico Nacional
  "América-Tigres UANL": 0.85,
  "América-Monterrey": 0.85,
  "Cruz Azul-Guadalajara": 0.80,
  "Cruz Azul-Pumas UNAM": 0.85, // Clásico Capitalino
  "Guadalajara-Tigres UANL": 0.80,
  "Guadalajara-Monterrey": 0.80,
  "Tigres UANL-Monterrey": 0.90, // Clásico Regiomontano
  "Toluca-América": 0.80,
  "León-Guadalajara": 0.75,
  "Santos Laguna-Tigres UANL": 0.75,
  "Pachuca-León": 0.70,
  "Atlas-Guadalajara": 0.70,
  "Puebla-Toluca": 0.65,
};

function getRivalry(team1: string, team2: string): number {
  const key1 = `${team1}-${team2}`;
  const key2 = `${team2}-${team1}`;
  return RIVALRIES[key1] || RIVALRIES[key2] || 0.5;
}

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
    .limit(20);

  if (error || !data || data.length === 0) {
    return {
      total_matches: 0,
      home_wins: 0,
      draws: 0,
      away_wins: 0,
      avg_home_goals: 1.5,
      avg_away_goals: 1.2,
      recent_form: "",
    };
  }

  let homeWins = 0;
  let draws = 0;
  let awayWins = 0;
  let totalHomeGoals = 0;
  let totalAwayGoals = 0;

  const formResults: string[] = [];

  for (const match of data) {
    const isHome = match.home_team === homeTeam;
    totalHomeGoals += match.home_goals;
    totalAwayGoals += match.away_goals;

    if (match.home_goals > match.away_goals) {
      if (isHome) homeWins++;
      else awayWins++;
      formResults.push(isHome ? "W" : "L");
    } else if (match.home_goals < match.away_goals) {
      if (isHome) awayWins++;
      else homeWins++;
      formResults.push(isHome ? "L" : "W");
    } else {
      draws++;
      formResults.push("D");
    }
  }

  return {
    total_matches: data.length,
    home_wins: homeWins,
    draws,
    away_wins: awayWins,
    avg_home_goals: Math.round((totalHomeGoals / data.length) * 100) / 100,
    avg_away_goals: Math.round((totalAwayGoals / data.length) * 100) / 100,
    recent_form: formResults.slice(0, 5).join("-"),
  };
}

export async function getTeamFormAtHome(teamName: string): Promise<{ wins: number; draws: number; losses: number; total: number }> {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const { data, error } = await supabase
    .from("match_history")
    .select("*")
    .eq("home_team", teamName)
    .order("match_date", { ascending: false })
    .limit(20);

  if (error || !data) return { wins: 0, draws: 0, losses: 0, total: 0 };

  let wins = 0;
  let draws = 0;
  let losses = 0;

  for (const match of data) {
    if (match.home_goals > match.away_goals) wins++;
    else if (match.home_goals === match.away_goals) draws++;
    else losses++;
  }

  return { wins, draws, losses, total: data.length };
}

export async function getTeamFormAway(teamName: string): Promise<{ wins: number; draws: number; losses: number; total: number }> {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const { data, error } = await supabase
    .from("match_history")
    .select("*")
    .eq("away_team", teamName)
    .order("match_date", { ascending: false })
    .limit(20);

  if (error || !data) return { wins: 0, draws: 0, losses: 0, total: 0 };

  let wins = 0;
  let draws = 0;
  let losses = 0;

  for (const match of data) {
    if (match.away_goals > match.home_goals) wins++;
    else if (match.home_goals === match.away_goals) draws++;
    else losses++;
  }

  return { wins, draws, losses, total: data.length };
}

function calculateTeamStrength(state: TeamState | null, isHome: boolean): number {
  if (!state) return 50; // Default si no hay datos

  let strength = 50;

  // Factor 1: Posición en tabla (0-20 puntos)
  if (state.current_position > 0) {
    strength += Math.max(0, (18 - state.current_position)) * 1.1;
  }

  // Factor 2: Forma reciente (últimos 5) (-10 a +10)
  strength += (state.form_last_5 - 7.5) * 1.3;

  // Factor 3: Racha actual (-5 a +5)
  if (state.streak_type === "W") {
    strength += Math.min(state.streak_count * 1.5, 5);
  } else if (state.streak_type === "L") {
    strength -= Math.min(state.streak_count * 1.5, 5);
  }

  // Factor 4: Goles por partido (-5 a +5)
  const goalDiff = state.avg_goals_scored - state.avg_goals_conceded;
  strength += goalDiff * 2.5;

  // Factor 5: Ventaja de localía (+5 si es local)
  if (isHome) {
    strength += 5;
  }

  return Math.max(20, Math.min(80, strength));
}

function calculateFormMomentum(last5: string): number {
  if (!last5) return 0;
  
  const results = last5.split("-");
  let momentum = 0;
  const weights = [5, 4, 3, 2, 1]; // Más peso a resultados recientes

  for (let i = 0; i < results.length && i < weights.length; i++) {
    if (results[i] === "W") momentum += weights[i];
    else if (results[i] === "L") momentum -= weights[i];
  }

  return momentum;
}

function calculateContextFactor(
  homeState: TeamState | null,
  awayState: TeamState | null,
  context: MatchContext
): { home_factor: number; away_factor: number } {
  let homeFactor = 1.0;
  let awayFactor = 1.0;

  // Factor de urgencia
  if (context.must_win_home) homeFactor *= 1.15;
  if (context.must_win_away) awayFactor *= 1.15;

  // Factor de diferencia de posición (el que va abajo presiona más)
  if (homeState && awayState) {
    const posDiff = awayState.current_position - homeState.current_position;
    if (posDiff > 3) homeFactor *= 1.05; // Local va mejor, visitante presiona
    if (posDiff < -3) awayFactor *= 1.05; // Visitante va mejor
  }

  return { home_factor: homeFactor, away_factor: awayFactor };
}

export async function predictMatch(
  homeTeam: string,
  awayTeam: string,
  context: MatchContext = {
    is_playoff: false,
    must_win_home: false,
    must_win_away: false,
    home_needs_points: false,
    away_needs_points: false,
    rivalry_intensity: 0.5,
  }
): Promise<PredictionFactors> {
  // Obtener datos
  const [homeState, awayState, h2h, homeForm, awayForm] = await Promise.all([
    getTeamState(homeTeam),
    getTeamState(awayTeam),
    getHeadToHead(homeTeam, awayTeam),
    getTeamFormAtHome(homeTeam),
    getTeamFormAway(awayTeam),
  ]);

  // Calcular fuerza de cada equipo
  const homeStrength = calculateTeamStrength(homeState, true);
  const awayStrength = calculateTeamStrength(awayState, false);

  // Calcular forma
  const homeFormScore = homeState ? homeState.form_last_5 : 7.5;
  const awayFormScore = awayState ? awayState.form_last_5 : 7.5;
  const formDifference = homeFormScore - awayFormScore;

  // Calcular momento (momentum reciente)
  const homeMomentum = homeState ? calculateFormMomentum(homeState.last_5_results) : 0;
  const awayMomentum = awayState ? calculateFormMomentum(awayState.last_5_results) : 0;

  // Factor de historial
  let h2hAdvantage = 0;
  if (h2h.total_matches > 0) {
    const homeWinRate = h2h.home_wins / h2h.total_matches;
    const awayWinRate = h2h.away_wins / h2h.total_matches;
    h2hAdvantage = (homeWinRate - awayWinRate) * 15; // -15 a +15
  }

  // Factor de tendencia local/visitante
  let homeAwayTendency = 0;
  if (homeForm.total > 0 && awayForm.total > 0) {
    const homeWinPct = homeForm.wins / homeForm.total;
    const awayWinPctPct = awayForm.wins / awayForm.total;
    homeAwayTendency = (homeWinPct - awayWinPctPct) * 10;
  }

  // Factor de contexto
  const contextFactors = calculateContextFactor(homeState, awayState, context);

  // Calcular probabilidades
  const totalStrength = homeStrength + awayStrength;
  let homeWinProb = (homeStrength / totalStrength) * 0.6; // Base 60%
  let drawProb = 0.25; // Base 25%
  let awayWinProb = (awayStrength / totalStrength) * 0.6; // Base 60%

  // Ajustar por forma
  homeWinProb += formDifference * 0.008;
  awayWinProb -= formDifference * 0.008;

  // Ajustar por historial
  homeWinProb += h2hAdvantage * 0.005;
  awayWinProb -= h2hAdvantage * 0.005;

  // Ajustar por momentum
  homeWinProb += homeMomentum * 0.003;
  awayWinProb -= homeMomentum * 0.003;

  // Ajustar por contexto
  homeWinProb *= contextFactors.home_factor;
  awayWinProb *= contextFactors.away_factor;

  // Ajustar por tipo de partido (playoffs = más empates)
  if (context.is_playoff) {
    drawProb += 0.05;
    homeWinProb *= 0.95;
    awayWinProb *= 0.95;
  }

  // Normalizar probabilidades
  const total = homeWinProb + drawProb + awayWinProb;
  homeWinProb = homeWinProb / total;
  drawProb = drawProb / total;
  awayWinProb = awayWinProb / total;

  // Calcular goles esperados (usando promedios históricos)
  const avgHomeGoals = homeState ? homeState.avg_goals_scored : 1.5;
  const avgAwayGoals = awayState ? awayState.avg_goals_scored : 1.2;
  const avgHomeConceded = homeState ? homeState.avg_goals_conceded : 1.2;
  const avgAwayConceded = awayState ? awayState.avg_goals_conceded : 1.5;

  const expectedHomeGoals = Math.round(((avgHomeGoals + avgAwayConceded) / 2) * 100) / 100;
  const expectedAwayGoals = Math.round(((avgAwayGoals + avgHomeConceded) / 2) * 100) / 100;

  // Determinar predicción
  let prediction = "X";
  if (homeWinProb > awayWinProb && homeWinProb > drawProb) prediction = "1";
  else if (awayWinProb > homeWinProb && awayWinProb > drawProb) prediction = "2";

  return {
    team_state: {
      home_strength: Math.round(homeStrength * 10) / 10,
      away_strength: Math.round(awayStrength * 10) / 10,
      form_difference: Math.round(formDifference * 10) / 10,
      streak_factor: (homeState?.streak_count || 0) - (awayState?.streak_count || 0),
    },
    history: {
      h2h_advantage: Math.round(h2hAdvantage * 10) / 10,
      home_away_tendency: Math.round(homeAwayTendency * 10) / 10,
    },
    form: {
      home_form: homeFormScore,
      away_form: awayFormScore,
      momentum: homeMomentum - awayMomentum,
    },
    context: {
      urgency_factor: (contextFactors.home_factor + contextFactors.away_factor) / 2,
      home_advantage: 5, // Constante de ventaja de localía
    },
    combined: {
      home_win_prob: Math.round(homeWinProb * 10000) / 10000,
      draw_prob: Math.round(drawProb * 10000) / 10000,
      away_win_prob: Math.round(awayWinProb * 10000) / 10000,
      expected_home_goals: expectedHomeGoals,
      expected_away_goals: expectedAwayGoals,
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
  if (confidence >= 0.7) return "Alta";
  if (confidence >= 0.5) return "Media";
  if (confidence >= 0.3) return "Baja";
  return "Muy Baja";
}
