// =============================================
// API — FIXTURES DE FÚTBOL (CON CACHÉ)
// =============================================
// Lee de caché en Supabase, sincroniza solo si es necesario
// Reduce llamadas a APIs externas

import { NextRequest, NextResponse } from "next/server";
import {
  getCachedFixtures,
  needsSync,
  canUseAPI,
  logAPIUsage,
  syncFixtures,
  updateSyncStatus,
} from "@/lib/football-cache";

// TheSportsDB Liga MX team IDs (para sync bajo demanda)
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jornada = searchParams.get("jornada");
    const league = searchParams.get("league") || "liga-mx";
    const forceSync = searchParams.get("forceSync") === "true";

    // 1. Intentar leer del caché primero
    const cachedFixtures = await getCachedFixtures(league, jornada || undefined);

    // 2. Si hay datos en caché, devolverlos
    if (cachedFixtures.length > 0 && !forceSync) {
      // Formatear para el frontend
      const fixtures = cachedFixtures.map((f: any) => ({
        id: f.fixture_id,
        homeTeam: f.home_team,
        awayTeam: f.away_team,
        date: f.match_date,
        time: f.match_time,
        venue: f.venue,
        jornada: f.jornada,
        status: f.status,
        homeGoals: f.home_goals,
        awayGoals: f.away_goals,
      }));

      return NextResponse.json({
        success: true,
        fixtures,
        total: fixtures.length,
        source: "cache",
        timestamp: new Date().toISOString(),
      });
    }

    // 3. Si no hay caché o forceSync, sincronizar desde API
    const needsSyncNow = await needsSync(`fixtures_${league}`, 4);

    if (needsSyncNow || forceSync) {
      // Verificar si podemos usar la API
      const canUse = await canUseAPI("thesportsdb");
      if (!canUse) {
        return NextResponse.json({
          success: true,
          fixtures: cachedFixtures.map((f: any) => ({
            id: f.fixture_id,
            homeTeam: f.home_team,
            awayTeam: f.away_team,
            date: f.match_date,
            time: f.match_time,
            venue: f.venue,
            jornada: f.jornada,
            status: f.status,
          })),
          total: cachedFixtures.length,
          source: "cache (API rate limited)",
          timestamp: new Date().toISOString(),
        });
      }

      // Sincronizar desde TheSportsDB
      await updateSyncStatus(`fixtures_${league}`, "syncing");

      const allFixtures: any[] = [];

      for (const [teamName, teamId] of Object.entries(LIGA_MX_TEAMS)) {
        try {
          const response = await fetch(
            `https://www.thesportsdb.com/api/v1/json/3/eventsnext.php?id=${teamId}`
          );
          const data = await response.json();

          if (data.events) {
            for (const event of data.events.slice(0, 3)) {
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

      // Guardar en caché
      await syncFixtures(league, "MX1", allFixtures);
      await updateSyncStatus(`fixtures_${league}`, "completed", allFixtures.length);

      // Devolver datos
      const fixtures = allFixtures.map((f) => ({
        id: f.id,
        homeTeam: f.homeTeam,
        awayTeam: f.awayTeam,
        date: f.date,
        time: f.time,
        venue: f.venue,
        jornada: f.jornada,
        status: f.status,
      }));

      return NextResponse.json({
        success: true,
        fixtures,
        total: fixtures.length,
        source: "api",
        timestamp: new Date().toISOString(),
      });
    }

    // 4. Devolver lo que haya en caché
    const fixtures = cachedFixtures.map((f: any) => ({
      id: f.fixture_id,
      homeTeam: f.home_team,
      awayTeam: f.away_team,
      date: f.match_date,
      time: f.match_time,
      venue: f.venue,
      jornada: f.jornada,
      status: f.status,
    }));

    return NextResponse.json({
      success: true,
      fixtures,
      total: fixtures.length,
      source: "cache",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error en GET /api/quiniela/fixtures:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
