// =============================================
// UTILIDADES PARA OBTENER DATOS DEPORTIVOS
// =============================================
// Server-side data fetching para el módulo de deportes.
// Estas funciones se ejecutan en el servidor (Server Components).

import {
  getFixtures,
  getStandings,
  type ApiFixture,
  type ApiStandingResponse,
} from "./api-football";

// IDs de ligas
export const LEAGUES = {
  LIGA_MX: 262,
  LA_LIGA: 140,
} as const;

// Temporada actual
export const CURRENT_SEASON = 2025;

/**
 * Obtiene los próximos partidos de una liga.
 * Filtra solo partidos programados (status "NS" = Not Started).
 */
export async function getUpcomingFixtures(
  leagueId: number,
  limit: number = 10
): Promise<ApiFixture[]> {
  try {
    const allFixtures = await getFixtures(leagueId, CURRENT_SEASON);

    // Filtrar solo partidos programados y ordenar por fecha
    const upcoming = allFixtures
      .filter((f) => f.fixture.status.short === "NS")
      .sort(
        (a, b) =>
          new Date(a.fixture.date).getTime() -
          new Date(b.fixture.date).getTime()
      )
      .slice(0, limit);

    return upcoming;
  } catch (error) {
    console.error("Error fetching upcoming fixtures:", error);
    return [];
  }
}

/**
 * Obtiene los resultados recientes de una liga.
 * Filtra solo partidos finalizados (status "FT" = Full Time).
 */
export async function getRecentResults(
  leagueId: number,
  limit: number = 10
): Promise<ApiFixture[]> {
  try {
    const allFixtures = await getFixtures(leagueId, CURRENT_SEASON);

    // Filtrar solo partidos finalizados y ordenar por fecha descendente
    const recent = allFixtures
      .filter((f) => f.fixture.status.short === "FT")
      .sort(
        (a, b) =>
          new Date(b.fixture.date).getTime() -
          new Date(a.fixture.date).getTime()
      )
      .slice(0, limit);

    return recent;
  } catch (error) {
    console.error("Error fetching recent results:", error);
    return [];
  }
}

/**
 * Obtiene la tabla de posiciones de una liga.
 */
export async function getLeagueStandings(
  leagueId: number
): Promise<ApiStandingResponse | null> {
  try {
    const data = await getStandings(leagueId, CURRENT_SEASON);
    return data[0] ?? null;
  } catch (error) {
    console.error("Error fetching standings:", error);
    return null;
  }
}

/**
 * Obtiene los partidos de hoy de una liga.
 */
export async function getTodayFixtures(
  leagueId: number
): Promise<ApiFixture[]> {
  try {
    const allFixtures = await getFixtures(leagueId, CURRENT_SEASON);
    const today = new Date().toISOString().split("T")[0];

    return allFixtures.filter(
      (f) => f.fixture.date.split("T")[0] === today
    );
  } catch (error) {
    console.error("Error fetching today fixtures:", error);
    return [];
  }
}
