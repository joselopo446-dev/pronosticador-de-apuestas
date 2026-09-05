// =============================================
// API — OBTENER FIXTURES REALES DE LIGA MX
// =============================================
// GET /api/quiniela/fixtures → Próximos partidos de Liga MX

import { NextResponse } from "next/server";

const TSD_API_KEY = "3";
const LEAGUE_ID = "4350";

const LIGA_MX_TEAMS: Record<string, string> = {
  "134193": "América",
  "134196": "Cruz Azul",
  "134205": "Guadalajara",
  "134198": "Monterrey",
  "134197": "Tigres UANL",
  "134201": "Pumas UNAM",
  "134207": "León",
  "134192": "Santos Laguna",
  "134204": "Toluca",
  "134191": "Pachuca",
  "134195": "Atlas",
  "134199": "Puebla",
  "134194": "Necaxa",
  "134202": "San Luis",
  "47810": "Mazatlán",
  "134200": "Juárez",
};

interface Fixture {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  time: string;
  venue: string;
  jornada: string;
}

async function fetchTeamNextEvents(teamId: string): Promise<any[]> {
  const url = `https://www.thesportsdb.com/api/v1/json/${TSD_API_KEY}/eventsnext.php?id=${teamId}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.events || [];
  } catch (error) {
    console.error(`Error fetching events for team ${teamId}:`, error);
    return [];
  }
}

export async function GET() {
  try {
    console.log("🔄 Obteniendo fixtures de Liga MX...");

    // Obtener próximos eventos de todos los equipos en paralelo
    const teamIds = Object.keys(LIGA_MX_TEAMS);
    const allEvents: any[] = [];

    const batches = [];
    for (let i = 0; i < teamIds.length; i += 4) {
      batches.push(teamIds.slice(i, i + 4));
    }

    for (const batch of batches) {
      const results = await Promise.all(
        batch.map((teamId) => fetchTeamNextEvents(teamId))
      );
      allEvents.push(...results.flat());
      
      // Pequeña pausa entre batches
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Deduplicar por ID de evento
    const uniqueEvents = new Map<string, any>();
    for (const event of allEvents) {
      if (!uniqueEvents.has(event.idEvent)) {
        uniqueEvents.set(event.idEvent, event);
      }
    }

    // Filtrar solo Liga MX y partidos sin resultado
    const fixtures: Fixture[] = [];
    
    for (const event of uniqueEvents.values()) {
      if (event.idLeague !== LEAGUE_ID) continue;
      if (event.intHomeScore && event.intAwayScore) continue; // Ya tiene resultado

      const homeTeam = LIGA_MX_TEAMS[event.idHomeTeam] || event.strHomeTeam;
      const awayTeam = LIGA_MX_TEAMS[event.idAwayTeam] || event.strAwayTeam;

      // Obtener fecha y hora
      const matchDate = event.dateEvent || "";
      const matchTime = event.strTime || "00:00:00";

      // Calcular jornada (aproximada por fecha)
      const jornada = event.strRound || "N/A";

      fixtures.push({
        id: event.idEvent,
        homeTeam,
        awayTeam,
        date: matchDate,
        time: matchTime.substring(0, 5), // HH:MM
        venue: event.strVenue || "Por definir",
        jornada,
      });
    }

    // Ordenar por fecha
    fixtures.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    console.log(`✅ Encontrados ${fixtures.length} fixtures`);

    return NextResponse.json({
      success: true,
      fixtures: fixtures.slice(0, 20), // Máximo 20 partidos
      source: "TheSportsDB",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error en /api/quiniela/fixtures:", error);
    return NextResponse.json(
      { success: false, error: "Error obteniendo fixtures" },
      { status: 500 }
    );
  }
}
