// =============================================
// MÓDULO DE DEPORTES — PÁGINA PRINCIPAL
// =============================================
// Muestra las ligas disponibles con datos en tiempo real.

import Link from "next/link";
import { getUpcomingFixtures, getRecentResults, LEAGUES, CURRENT_SEASON } from "@/lib/sports";

export default async function DeportesPage() {
  // Obtener datos de ambas ligas en paralelo
  const [ligaMxUpcoming, laLigaUpcoming, ligaMxResults, laLigaResults] =
    await Promise.all([
      getUpcomingFixtures(LEAGUES.LIGA_MX, 3),
      getUpcomingFixtures(LEAGUES.LA_LIGA, 3),
      getRecentResults(LEAGUES.LIGA_MX, 3),
      getRecentResults(LEAGUES.LA_LIGA, 3),
    ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Deportes</h1>
        <p className="text-gray-400 mt-2">
          Liga MX y La Liga — Temporada {CURRENT_SEASON}/{CURRENT_SEASON + 1}
        </p>
      </div>

      {/* ============================================= */}
      {/* TARJETAS DE LIGAS */}
      {/* ============================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Liga MX */}
        <Link href="/deportes/liga-mx" className="block p-6 bg-gray-800 border border-gray-700 rounded-xl hover:border-green-500/50 transition-colors">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-green-600/20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🇲🇽</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Liga MX</h2>
              <p className="text-gray-400">México — Apertura {CURRENT_SEASON}</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Próximos partidos</span>
              <span className="text-white">{ligaMxUpcoming.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Resultados recientes</span>
              <span className="text-white">{ligaMxResults.length}</span>
            </div>
          </div>
        </Link>

        {/* La Liga */}
        <Link href="/deportes/la-liga" className="block p-6 bg-gray-800 border border-gray-700 rounded-xl hover:border-red-500/50 transition-colors">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-red-600/20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🇪🇸</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">La Liga</h2>
              <p className="text-gray-400">España — {CURRENT_SEASON}/{CURRENT_SEASON + 1}</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Próximos partidos</span>
              <span className="text-white">{laLigaUpcoming.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Resultados recientes</span>
              <span className="text-white">{laLigaResults.length}</span>
            </div>
          </div>
        </Link>
      </div>

      {/* ============================================= */}
      {/* ACTIVIDAD RECIENTE GLOBAL */}
      {/* ============================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Últimos resultados Liga MX */}
        {ligaMxResults.length > 0 && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              🇲🇽 Últimos resultados — Liga MX
            </h3>
            <div className="space-y-3">
              {ligaMxResults.map((match) => (
                <div
                  key={match.fixture.id}
                  className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
                >
                  <div className="flex items-center gap-2 text-sm text-gray-400 w-20">
                    {new Date(match.fixture.date).toLocaleDateString("es-MX", {
                      day: "numeric",
                      month: "short",
                    })}
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-sm text-white w-32 truncate">
                      {match.teams.home.name}
                    </span>
                    <span className="text-sm font-bold text-white px-3">
                      {match.goals.home} - {match.goals.away}
                    </span>
                    <span className="text-sm text-white w-32 text-right truncate">
                      {match.teams.away.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Últimos resultados La Liga */}
        {laLigaResults.length > 0 && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              🇪🇸 Últimos resultados — La Liga
            </h3>
            <div className="space-y-3">
              {laLigaResults.map((match) => (
                <div
                  key={match.fixture.id}
                  className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
                >
                  <div className="flex items-center gap-2 text-sm text-gray-400 w-20">
                    {new Date(match.fixture.date).toLocaleDateString("es-MX", {
                      day: "numeric",
                      month: "short",
                    })}
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-sm text-white w-32 truncate">
                      {match.teams.home.name}
                    </span>
                    <span className="text-sm font-bold text-white px-3">
                      {match.goals.home} - {match.goals.away}
                    </span>
                    <span className="text-sm text-white w-32 text-right truncate">
                      {match.teams.away.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ============================================= */}
      {/* PRÓXIMOS PARTIDOS */}
      {/* ============================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximos Liga MX */}
        {ligaMxUpcoming.length > 0 && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              🇲🇽 Próximos partidos — Liga MX
            </h3>
            <div className="space-y-3">
              {ligaMxUpcoming.map((match) => (
                <div
                  key={match.fixture.id}
                  className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
                >
                  <div className="flex items-center gap-2 text-sm text-gray-400 w-20">
                    {new Date(match.fixture.date).toLocaleDateString("es-MX", {
                      day: "numeric",
                      month: "short",
                    })}
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-sm text-white w-32 truncate">
                      {match.teams.home.name}
                    </span>
                    <span className="text-xs text-gray-400 px-3">VS</span>
                    <span className="text-sm text-white w-32 text-right truncate">
                      {match.teams.away.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Próximos La Liga */}
        {laLigaUpcoming.length > 0 && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              🇪🇸 Próximos partidos — La Liga
            </h3>
            <div className="space-y-3">
              {laLigaUpcoming.map((match) => (
                <div
                  key={match.fixture.id}
                  className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
                >
                  <div className="flex items-center gap-2 text-sm text-gray-400 w-20">
                    {new Date(match.fixture.date).toLocaleDateString("es-MX", {
                      day: "numeric",
                      month: "short",
                    })}
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-sm text-white w-32 truncate">
                      {match.teams.home.name}
                    </span>
                    <span className="text-xs text-gray-400 px-3">VS</span>
                    <span className="text-sm text-white w-32 text-right truncate">
                      {match.teams.away.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
