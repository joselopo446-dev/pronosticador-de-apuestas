// =============================================
// API — SINCRONIZAR ESTADO DE EQUIPOS
// =============================================
// POST /api/quiniela/sync-teams → Actualiza estado actual de cada equipo

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const TSD_API_KEY = "3";
const LEAGUE_ID = "4350";

const LIGA_MX_TEAMS: Record<string, string> = {
  "América": "134193",
  "Cruz Azul": "134196",
  "Guadalajara": "134205",
  "Monterrey": "134198",
  "Tigres UANL": "134197",
  "Pumas UNAM": "134201",
  "León": "134207",
  "Santos Laguna": "134192",
  "Toluca": "134204",
  "Pachuca": "134191",
  "Atlas": "134195",
  "Puebla": "134199",
  "Necaxa": "134194",
  "San Luis": "134202",
  "Mazatlán": "47810",
  "Juárez": "134200",
};

const TEAM_NAME_MAP: Record<string, string> = {
  "Club América": "América",
  "América": "América",
  "Cruz Azul": "Cruz Azul",
  "CD Guadalajara": "Guadalajara",
  "Guadalajara": "Guadalajara",
  "Chivas": "Guadalajara",
  "Monterrey": "Monterrey",
  "Rayados": "Monterrey",
  "Tigres UANL": "Tigres UANL",
  "Tigres": "Tigres UANL",
  "Pumas UNAM": "Pumas UNAM",
  "Pumas": "Pumas UNAM",
  "Club León": "León",
  "León": "León",
  "Santos Laguna": "Santos Laguna",
  "Santos": "Santos Laguna",
  "Deportivo Toluca": "Toluca",
  "Toluca": "Toluca",
  "Club Pachuca": "Pachuca",
  "Pachuca": "Pachuca",
  "Atlas": "Atlas",
  "Club Atlas": "Atlas",
  "Club Puebla": "Puebla",
  "Puebla": "Puebla",
  "Necaxa": "Necaxa",
  "Club Necaxa": "Necaxa",
  "San Luis": "San Luis",
  "Atlético San Luis": "San Luis",
  "Mazatlán": "Mazatlán",
  "FC Juárez": "Juárez",
  "Juárez": "Juárez",
};

function normalizeTeamName(name: string): string {
  return TEAM_NAME_MAP[name] || name;
}

async function fetchTeamResults(teamId: string): Promise<any[]> {
  const url = `https://www.thesportsdb.com/api/v1/json/${TSD_API_KEY}/eventslast.php?id=${teamId}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error(`Error fetching results for team ${teamId}:`, error);
    return [];
  }
}

function calculateForm(results: any[], teamName: string): string {
  const last5 = results.slice(0, 5);
  return last5
    .map((r) => {
      const isHome = normalizeTeamName(r.strHomeTeam) === teamName;
      const homeGoals = parseInt(r.intHomeScore) || 0;
      const awayGoals = parseInt(r.intAwayScore) || 0;

      if (isHome) {
        return homeGoals > awayGoals ? "W" : homeGoals < awayGoals ? "L" : "D";
      } else {
        return awayGoals > homeGoals ? "W" : awayGoals < homeGoals ? "L" : "D";
      }
    })
    .join("-");
}

function calculateStreak(results: any[], teamName: string): { type: string; count: number } {
  if (results.length === 0) return { type: "", count: 0 };

  const firstResult = results[0];
  const isHome = normalizeTeamName(firstResult.strHomeTeam) === teamName;
  const homeGoals = parseInt(firstResult.intHomeScore) || 0;
  const awayGoals = parseInt(firstResult.intAwayScore) || 0;

  let streakType: string;
  if (isHome) {
    streakType = homeGoals > awayGoals ? "W" : homeGoals < awayGoals ? "L" : "D";
  } else {
    streakType = awayGoals > homeGoals ? "W" : awayGoals < homeGoals ? "L" : "D";
  }

  let count = 0;
  for (const r of results) {
    const rIsHome = normalizeTeamName(r.strHomeTeam) === teamName;
    const rHomeGoals = parseInt(r.intHomeScore) || 0;
    const rAwayGoals = parseInt(r.intAwayScore) || 0;

    let rResult: string;
    if (rIsHome) {
      rResult = rHomeGoals > rAwayGoals ? "W" : rHomeGoals < rAwayGoals ? "L" : "D";
    } else {
      rResult = rAwayGoals > rHomeGoals ? "W" : rAwayGoals < rHomeGoals ? "L" : "D";
    }

    if (rResult === streakType) {
      count++;
    } else {
      break;
    }
  }

  return { type: streakType, count };
}

function calculateStats(results: any[], teamName: string) {
  let wins = 0;
  let draws = 0;
  let losses = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;
  let homeWins = 0;
  let homeDraws = 0;
  let homeLosses = 0;
  let awayWins = 0;
  let awayDraws = 0;
  let awayLosses = 0;

  let last5Wins = 0;
  let last5Draws = 0;
  let last5Losses = 0;
  let last5GoalsFor = 0;
  let last5GoalsAgainst = 0;

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const isHome = normalizeTeamName(r.strHomeTeam) === teamName;
    const homeGoals = parseInt(r.intHomeScore) || 0;
    const awayGoals = parseInt(r.intAwayScore) || 0;

    const goalsF = isHome ? homeGoals : awayGoals;
    const goalsA = isHome ? awayGoals : homeGoals;
    const won = isHome ? homeGoals > awayGoals : awayGoals > homeGoals;
    const drawn = homeGoals === awayGoals;

    goalsFor += goalsF;
    goalsAgainst += goalsA;

    if (won) {
      wins++;
      if (isHome) homeWins++;
      else awayWins++;
    } else if (drawn) {
      draws++;
      if (isHome) homeDraws++;
      else awayDraws++;
    } else {
      losses++;
      if (isHome) homeLosses++;
      else awayLosses++;
    }

    if (i < 5) {
      last5GoalsFor += goalsF;
      last5GoalsAgainst += goalsA;
      if (won) last5Wins++;
      else if (drawn) last5Draws++;
      else last5Losses++;
    }
  }

  const total = results.length || 1;

  return {
    played: results.length,
    wins,
    draws,
    losses,
    goals_for: goalsFor,
    goals_against: goalsAgainst,
    goal_difference: goalsFor - goalsAgainst,
    home_wins: homeWins,
    home_draws: homeDraws,
    home_losses: homeLosses,
    away_wins: awayWins,
    away_draws: awayDraws,
    away_losses: awayLosses,
    avg_goals_scored: Math.round((goalsFor / total) * 100) / 100,
    avg_goals_conceded: Math.round((goalsAgainst / total) * 100) / 100,
    form_last_5: Math.round(((last5Wins * 3 + last5Draws) / 5) * 10) / 10,
    goals_scored_last_5: last5GoalsFor,
    goals_conceded_last_5: last5GoalsAgainst,
  };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("🔄 Sincronizando estado de equipos Liga MX...");

    let totalUpdated = 0;
    let totalErrors = 0;

    for (const [teamName, teamId] of Object.entries(LIGA_MX_TEAMS)) {
      const results = await fetchTeamResults(teamId);

      // Filtrar solo Liga MX
      const ligaMxResults = results.filter(
        (r: any) =>
          r.strLeague === "Liga MX" ||
          r.idLeague === LEAGUE_ID
      );

      if (ligaMxResults.length === 0) continue;

      const stats = calculateStats(ligaMxResults, teamName);
      const form = calculateForm(ligaMxResults, teamName);
      const streak = calculateStreak(ligaMxResults, teamName);

      const teamState = {
        team_name: teamName,
        current_position: 0,
        points: stats.wins * 3 + stats.draws,
        ...stats,
        current_streak: streak.type.repeat(streak.count),
        streak_type: streak.type,
        streak_count: streak.count,
        last_5_results: form,
        injured_players: "[]",
        suspended_players: "[]",
        top_scorer: "",
        top_scorer_goals: 0,
        last_updated: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("team_current_state")
        .upsert(teamState, { onConflict: "team_name" });

      if (error) {
        totalErrors++;
      } else {
        totalUpdated++;
      }

      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    return NextResponse.json({
      success: true,
      message: `Estados actualizados: ${totalUpdated} equipos, ${totalErrors} errores`,
      totalUpdated,
      totalErrors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error en POST /api/quiniela/sync-teams:", error);
    return NextResponse.json(
      { success: false, error: "Error sincronizando estados" },
      { status: 500 }
    );
  }
}
