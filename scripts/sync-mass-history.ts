// =============================================
// SCRIPT: SYNC MASIVO DE HISTORIAL LIGA MX
// =============================================
// Usa múltiples fuentes para obtener 100+ partidos por equipo
// Ejecutar: npx tsx scripts/sync-mass-history.ts

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const TSD_API_KEY = "3";
const LEAGUE_ID = "4350";

// Todos los equipos de Liga MX con sus IDs de TheSportsDB
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

// Mapeo de nombres
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
  "Atlante": "Atlante",
  "Chiapas": "Chiapas",
  "Veracruz": "Veracruz",
  "Monarcas Morelia": "Morelia",
  "Tijuana": "Tijuana",
};

function normalizeTeamName(name: string): string {
  return TEAM_NAME_MAP[name] || name;
}

// =============================================
// FUENTE 1: TheSportsDB (eventslast)
// =============================================
async function fetchTSDHistory(teamId: string): Promise<any[]> {
  const url = `https://www.thesportsdb.com/api/v1/json/${TSD_API_KEY}/eventslast.php?id=${teamId}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    return [];
  }
}

// =============================================
// FUENTE 2: TheSportsDB (eventslast por liga)
// =============================================
async function fetchTSDLeagueHistory(teamId: string): Promise<any[]> {
  const url = `https://www.thesportsdb.com/api/v1/json/${TSD_API_KEY}/eventsseason.php?id=${teamId}&s=2026`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.events || [];
  } catch (error) {
    return [];
  }
}

// =============================================
// FUENTE 3: TheSportsDB (buscar por evento específico)
// =============================================
async function fetchTSDEvent(eventId: string): Promise<any> {
  const url = `https://www.thesportsdb.com/api/v1/json/${TSD_API_KEY}/lookupevents.php?e=${eventId}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.results?.[0] || null;
  } catch (error) {
    return null;
  }
}

// =============================================
// FUENTE 4: API-Football (RapidAPI) - más datos
// =============================================
async function fetchAPIFootballHistory(teamName: string): Promise<any[]> {
  const rapidApiKey = process.env.RAPIDAPI_KEY;
  if (!rapidApiKey) return [];

  const url = `https://api-football-v1.p.rapidapi.com/v3/fixtures?team=${teamName}&last=50&league=262&season=2025`;
  
  try {
    const response = await fetch(url, {
      headers: {
        "x-rapidapi-key": rapidApiKey,
        "x-rapidapi-host": "api-football-v1.p.rapidapi.com",
      },
    });
    const data = await response.json();
    return data.response || [];
  } catch (error) {
    return [];
  }
}

// =============================================
// FUNCIÓN PRINCIPAL DE SINCRONIZACIÓN
// =============================================
async function syncMassHistory() {
  console.log("🔄 INICIANDO SYNC MASIVO DE HISTORIAL LIGA MX\n");
  console.log("=".repeat(50));

  let totalInserted = 0;
  let totalSkipped = 0;
  let totalErrors = 0;
  const teamStats: Record<string, number> = {};

  for (const [teamName, teamId] of Object.entries(LIGA_MX_TEAMS)) {
    console.log(`\n📊 Procesando: ${teamName} (ID: ${teamId})`);

    // Obtener datos de múltiples fuentes
    const [tsdHistory, tsdLeague] = await Promise.all([
      fetchTSDHistory(teamId),
      fetchTSDLeagueHistory(teamId),
    ]);

    console.log(`   TheSportsDB (recientes): ${tsdHistory.length}`);
    console.log(`   TheSportsDB (temporada): ${tsdLeague.length}`);

    // Combinar y deduplicar
    const allEvents = new Map<string, any>();

    // Procesar historial reciente
    for (const event of tsdHistory) {
      if (event.strLeague === "Liga MX" || event.idLeague === LEAGUE_ID) {
        allEvents.set(event.idEvent, event);
      }
    }

    // Procesar temporada actual
    for (const event of tsdLeague) {
      if (event.strLeague === "Liga MX" || event.idLeague === LEAGUE_ID) {
        allEvents.set(event.idEvent, event);
      }
    }

    console.log(`   Total único: ${allEvents.size}`);

    // Insertar en BD
    let insertedCount = 0;
    for (const event of allEvents.values()) {
      try {
        const homeTeam = normalizeTeamName(event.strHomeTeam);
        const awayTeam = normalizeTeamName(event.strAwayTeam);
        const matchDate = event.dateEvent;
        const homeGoals = parseInt(event.intHomeScore) || 0;
        const awayGoals = parseInt(event.intAwayScore) || 0;
        const jornada = event.strRound || "";
        const season = event.strSeason || "";

        if (!homeTeam || !awayTeam || !matchDate) {
          totalSkipped++;
          continue;
        }

        const { error } = await supabase.from("match_history").upsert(
          {
            home_team: homeTeam,
            away_team: awayTeam,
            home_goals: homeGoals,
            away_goals: awayGoals,
            match_date: matchDate,
            jornada: jornada,
            season: season,
            tournament: "liga-mx",
            match_type: "liga-mx",
          },
          { onConflict: "home_team,away_team,match_date" }
        );

        if (error) {
          totalErrors++;
        } else {
          insertedCount++;
          totalInserted++;
        }
      } catch (e) {
        totalErrors++;
      }
    }

    teamStats[teamName] = insertedCount;
    console.log(`   ✅ Insertados: ${insertedCount}`);

    // Pausa para API
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // Resumen
  console.log("\n" + "=".repeat(50));
  console.log("📊 RESUMEN DE SINCRONIZACIÓN:");
  console.log("=".repeat(50));
  console.log(`Total insertados: ${totalInserted}`);
  console.log(`Total omitidos: ${totalSkipped}`);
  console.log(`Total errores: ${totalErrors}`);

  // Estadísticas por equipo
  console.log("\n📈 PARTIDOS POR EQUIPO:");
  for (const [team, count] of Object.entries(teamStats)) {
    console.log(`   ${team}: ${count} partidos`);
  }

  // Verificar total en BD
  const { count } = await supabase
    .from("match_history")
    .select("*", { count: "exact", head: true });
  
  console.log(`\n✅ Total en base de datos: ${count}`);
}

syncMassHistory().catch(console.error);
