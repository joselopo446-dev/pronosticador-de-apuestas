// =============================================
// SEED — INSERTAR JORNADAS PREMIER & LALIGA
// =============================================
// POST /api/football/seed-jornadas

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PREMIER_TEAMS = [
  "Arsenal", "Aston Villa", "Bournemouth", "Brentford", "Brighton",
  "Chelsea", "Crystal Palace", "Everton", "Fulham", "Ipswich Town",
  "Leicester City", "Liverpool", "Manchester City", "Manchester United",
  "Newcastle United", "Nottingham Forest", "Southampton", "Tottenham", "West Ham", "Wolves"
];

const LALIGA_TEAMS = [
  "Real Madrid", "Barcelona", "Atletico Madrid", "Athletic Bilbao",
  "Real Sociedad", "Real Betis", "Villarreal", "Valencia",
  "Sevilla", "Girona", "Osasuna", "Celta Vigo",
  "Mallorca", "Las Palmas", "Rayo Vallecano", "Getafe",
  "Alaves", "Espanyol", "Leganes", "Real Valladolid"
];

function generateRoundRobin(teams: string[]): { jornada_number: number; match_index: number; home_team: string; away_team: string }[] {
  const n = teams.length;
  if (n % 2 !== 0) throw new Error("Teams must be even");
  
  const arr = [...teams];
  const totalRounds = n - 1;
  const matchesPerRound = n / 2;
  const allMatches: { jornada_number: number; match_index: number; home_team: string; away_team: string }[] = [];

  for (let round = 0; round < totalRounds; round++) {
    const jornada = round + 1;
    for (let i = 0; i < matchesPerRound; i++) {
      const home = arr[i];
      const away = arr[n - 1 - i];
      allMatches.push({
        jornada_number: jornada,
        match_index: i,
        home_team: home,
        away_team: away,
      });
    }
    // Rotate: last element moves to position 1
    const last = arr.pop()!;
    arr.splice(1, 0, last);
  }

  // Second half: swap home/away
  const secondHalf = allMatches.map(m => ({
    jornada_number: m.jornada_number + totalRounds,
    match_index: m.match_index,
    home_team: m.away_team,
    away_team: m.home_team,
  }));

  return [...allMatches, ...secondHalf];
}

export async function POST() {
  try {
    const premierMatches = generateRoundRobin(PREMIER_TEAMS);
    const laligaMatches = generateRoundRobin(LALIGA_TEAMS);

    // Clear existing data first
    await supabase.from("premier_jornadas").delete().neq("id", 0);
    await supabase.from("laliga_jornadas").delete().neq("id", 0);

    // Insert Premier League
    const { error: premierError } = await supabase
      .from("premier_jornadas")
      .insert(premierMatches);

    if (premierError) {
      return NextResponse.json({ success: false, error: `Premier: ${premierError.message}` }, { status: 500 });
    }

    // Insert La Liga
    const { error: laligaError } = await supabase
      .from("laliga_jornadas")
      .insert(laligaMatches);

    if (laligaError) {
      return NextResponse.json({ success: false, error: `LaLiga: ${laligaError.message}` }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      premier: premierMatches.length,
      laliga: laligaMatches.length,
      premierJornadas: premierMatches.filter(m => m.jornada_number <= 38).length / matchesPerRoundCount(premierMatches),
      message: `Premier: ${premierMatches.length} partidos (38 jornadas), LaLiga: ${laligaMatches.length} partidos (38 jornadas)`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

function matchesPerRoundCount(matches: { jornada_number: number }[]): number {
  const firstJornada = matches.filter(m => m.jornada_number === 1).length;
  return firstJornada || 10;
}
