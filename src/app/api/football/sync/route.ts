// =============================================
// API — SINCRONIZACIÓN DE FÚTBOL
// =============================================
// POST /api/football/sync → Sincroniza datos de APIs externas a caché
// GET /api/football/sync → Estado de sincronización

import { NextRequest, NextResponse } from "next/server";
import {
  canUseAPI,
  logAPIUsage,
  syncFixtures,
  syncTeams,
  syncMatchHistory,
  getSyncStatus,
  updateSyncStatus,
  needsSync,
  getCachedFixtures,
  getCachedTeams,
  getCachedMatchHistory,
} from "@/lib/football-cache";

// TheSportsDB Liga MX team IDs
const LIGA_MX_TEAMS: Record<string, number> = {
  América: 134193,
  "Cruz Azul": 134196,
  Guadalajara: 134205,
  Monterrey: 134198,
  "Tigres UANL": 134197,
  "Pumas UNAM": 134201,
  León: 134207,
  "Santos Laguna": 134192,
  Toluca: 134204,
  Pachuca: 134191,
  Atlas: 134195,
  Puebla: 134199,
  Necaxa: 134194,
  "San Luis": 134202,
  Mazatlán: 47810,
  Juárez: 134200,
};

const THE_SPORTS_DB_LEAGUE_ID = "4350";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, force } = body;

    // Verificar si necesita sincronización
    if (!force) {
      const needs = await needsSync(type, 4);
      if (!needs) {
        return NextResponse.json({
          success: true,
          message: "Sincronización no necesaria aún",
          cached: true,
        });
      }
    }

    let result: any = { inserted: 0, errors: 0 };

    switch (type) {
      case "fixtures_liga_mx":
        result = await syncLigaMXFixtures();
        break;
      case "teams_liga_mx":
        result = await syncLigaMXTeams();
        break;
      case "match_history":
        result = await syncLigaMXHistory();
        break;
      case "all":
        const fixturesResult = await syncLigaMXFixtures();
        const teamsResult = await syncLigaMXTeams();
        const historyResult = await syncLigaMXHistory();
        result = {
          fixtures: fixturesResult,
          teams: teamsResult,
          history: historyResult,
        };
        break;
      default:
        return NextResponse.json(
          { success: false, error: "Tipo de sincronización no válido" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `Sincronización completada: ${type}`,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error en sincronización:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const syncTypes = [
      "fixtures_liga_mx",
      "teams_liga_mx",
      "match_history",
    ];

    const statuses = await Promise.all(
      syncTypes.map(async (type) => {
        const status = await getSyncStatus(type);
        return { type, ...status };
      })
    );

    // Contar registros en caché
    const fixturesCount = await getCachedFixtures("liga-mx");
    const teamsCount = await getCachedTeams("liga-mx");
    const historyCount = await getCachedMatchHistory("liga-mx");

    return NextResponse.json({
      success: true,
      syncStatuses: statuses,
      cacheStats: {
        fixtures: fixturesCount.length,
        teams: teamsCount.length,
        matchHistory: historyCount.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// =============================================
// FUNCIONES DE SINCRONIZACIÓN
// =============================================

async function syncLigaMXFixtures() {
  await updateSyncStatus("fixtures_liga_mx", "syncing");

  try {
    // Verificar límite de API
    const canUse = await canUseAPI("thesportsdb");
    if (!canUse) {
      await updateSyncStatus("fixtures_liga_mx", "rate_limited", 0, "Límite de API alcanzado");
      return { inserted: 0, errors: 0, rateLimited: true };
    }

    // Obtener fixtures de TheSportsDB
    const teamIds = Object.values(LIGA_MX_TEAMS);
    const allFixtures: any[] = [];

    // Consultar próximos partidos de cada equipo (solo 5 por equipo)
    for (const [teamName, teamId] of Object.entries(LIGA_MX_TEAMS)) {
      try {
        const response = await fetch(
          `https://www.thesportsdb.com/api/v1/json/3/eventsnext.php?id=${teamId}`
        );
        const data = await response.json();

        if (data.events) {
          for (const event of data.events.slice(0, 3)) {
            // Solo partidos de Liga MX
            if (event.strLeague === "Liga MX" || event.idLeague === THE_SPORTS_DB_LEAGUE_ID) {
              allFixtures.push({
                id: event.idEvent,
                homeTeam: event.strHomeTeam,
                awayTeam: event.strAwayTeam,
                date: event.dateEvent,
                time: event.strTime || "00:00",
                venue: event.strVenue || "",
                jornada: event.strRound || "",
                status: "scheduled",
              });
            }
          }
        }

        await logAPIUsage("thesportsdb", `eventsnext.php?id=${teamId}`);
      } catch (e) {
        console.error(`Error fetching fixtures for ${teamName}:`, e);
      }
    }

    // Sincronizar a caché
    const result = await syncFixtures("liga-mx", "MX1", allFixtures);
    await updateSyncStatus("fixtures_liga_mx", "completed", result.inserted);

    return result;
  } catch (error: any) {
    await updateSyncStatus("fixtures_liga_mx", "error", 0, error.message);
    throw error;
  }
}

async function syncLigaMXTeams() {
  await updateSyncStatus("teams_liga_mx", "syncing");

  try {
    const canUse = await canUseAPI("thesportsdb");
    if (!canUse) {
      await updateSyncStatus("teams_liga_mx", "rate_limited", 0, "Límite de API alcanzado");
      return { inserted: 0, errors: 0, rateLimited: true };
    }

    // Obtener tabla de posiciones de TheSportsDB
    const response = await fetch(
      `https://www.thesportsdb.com/api/v1/json/3/lookuptable.php?l=${THE_SPORTS_DB_LEAGUE_ID}&s=2025`
    );
    const data = await response.json();

    const teams: any[] = [];
    if (data.table) {
      for (const row of data.table) {
        teams.push({
          id: parseInt(row.idTeam) || 0,
          name: row.strTeam,
          position: parseInt(row.intRank) || 0,
          played: parseInt(row.intPlayed) || 0,
          wins: parseInt(row.intWin) || 0,
          draws: parseInt(row.intDraw) || 0,
          losses: parseInt(row.intLoss) || 0,
          goalsFor: parseInt(row.intGoalsFor) || 0,
          goalsAgainst: parseInt(row.intGoalsAgainst) || 0,
          points: parseInt(row.intPoints) || 0,
          form: row.strForm || "",
        });
      }
    }

    await logAPIUsage("thesportsdb", `lookuptable.php?l=${THE_SPORTS_DB_LEAGUE_ID}`);
    const result = await syncTeams("liga-mx", teams);
    await updateSyncStatus("teams_liga_mx", "completed", result.inserted);

    return result;
  } catch (error: any) {
    await updateSyncStatus("teams_liga_mx", "error", 0, error.message);
    throw error;
  }
}

async function syncLigaMXHistory() {
  await updateSyncStatus("match_history", "syncing");

  try {
    const canUse = await canUseAPI("thesportsdb");
    if (!canUse) {
      await updateSyncStatus("match_history", "rate_limited", 0, "Límite de API alcanzado");
      return { inserted: 0, errors: 0, rateLimited: true };
    }

    const allMatches: any[] = [];

    // Obtener últimos partidos de cada equipo
    for (const [teamName, teamId] of Object.entries(LIGA_MX_TEAMS)) {
      try {
        const response = await fetch(
          `https://www.thesportsdb.com/api/v1/json/3/eventslast.php?id=${teamId}`
        );
        const data = await response.json();

        if (data.results) {
          for (const event of data.results.slice(0, 5)) {
            if (event.strLeague === "Liga MX" || event.idLeague === THE_SPORTS_DB_LEAGUE_ID) {
              allMatches.push({
                fixture_id: event.idEvent,
                league: "liga-mx",
                date: event.dateEvent,
                homeTeam: event.strHomeTeam,
                awayTeam: event.strAwayTeam,
                home_goals: parseInt(event.intHomeScore) || 0,
                away_goals: parseInt(event.intAwayScore) || 0,
                home_score_ht: parseInt(event.intHomeScoreHalf) || 0,
                away_score_ht: parseInt(event.intAwayScoreHalf) || 0,
                venue: event.strVenue || "",
                referee: event.strOfficial || "",
              });
            }
          }
        }

        await logAPIUsage("thesportsdb", `eventslast.php?id=${teamId}`);
      } catch (e) {
        console.error(`Error fetching history for ${teamName}:`, e);
      }
    }

    const result = await syncMatchHistory(allMatches);
    await updateSyncStatus("match_history", "completed", result.inserted);

    return result;
  } catch (error: any) {
    await updateSyncStatus("match_history", "error", 0, error.message);
    throw error;
  }
}
