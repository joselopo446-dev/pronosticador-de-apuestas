// =============================================
// COMPONENTE COMPARTIDO — VISTA DE LIGA
// =============================================
// Muestra tabla de posiciones, resultados y próximos partidos.

import Image from "next/image";
import type { ApiFixture, ApiStandingResponse } from "@/lib/api-football";

interface LeagueViewProps {
  leagueName: string;
  country: string;
  flag: string;
  color: "green" | "red" | "blue";
  standings: ApiStandingResponse | null;
  recentResults: ApiFixture[];
  upcomingFixtures: ApiFixture[];
}

const colorClasses = {
  green: {
    badge: "bg-green-600",
    border: "border-green-500/30",
    header: "text-green-400",
  },
  red: {
    badge: "bg-red-600",
    border: "border-red-500/30",
    header: "text-red-400",
  },
  blue: {
    badge: "bg-blue-600",
    border: "border-blue-500/30",
    header: "text-blue-400",
  },
};

export default function LeagueView({
  leagueName,
  country,
  flag,
  color,
  standings,
  recentResults,
  upcomingFixtures,
}: LeagueViewProps) {
  const colors = colorClasses[color];
  const table = standings?.standings?.[0] ?? [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div
          className={`w-14 h-14 ${colors.badge} rounded-lg flex items-center justify-center`}
        >
          <span className="text-2xl">{flag}</span>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">{leagueName}</h1>
          <p className="text-gray-400">
            {country} — Temporada 2025/2026
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ============================================= */}
        {/* TABLA DE POSICIONES */}
        {/* ============================================= */}
        <div className="xl:col-span-2 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <div className={`px-6 py-4 border-b border-gray-700 ${colors.header}`}>
            <h2 className="text-lg font-semibold">Tabla de Posiciones</h2>
          </div>
          {table.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700 text-gray-400">
                    <th className="px-4 py-3 text-left">#</th>
                    <th className="px-4 py-3 text-left">Equipo</th>
                    <th className="px-4 py-3 text-center">PJ</th>
                    <th className="px-4 py-3 text-center">G</th>
                    <th className="px-4 py-3 text-center">E</th>
                    <th className="px-4 py-3 text-center">P</th>
                    <th className="px-4 py-3 text-center">GF</th>
                    <th className="px-4 py-3 text-center">GC</th>
                    <th className="px-4 py-3 text-center">DG</th>
                    <th className="px-4 py-3 text-center">Pts</th>
                    <th className="px-4 py-3 text-center">Forma</th>
                  </tr>
                </thead>
                <tbody>
                  {table.map((row) => (
                    <tr
                      key={row.team.id}
                      className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="px-4 py-3 text-gray-400">{row.rank}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Image
                            src={row.team.logo}
                            alt={row.team.name}
                            width={24}
                            height={24}
                            unoptimized
                          />
                          <span className="text-white font-medium">
                            {row.team.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-300">
                        {row.all.played}
                      </td>
                      <td className="px-4 py-3 text-center text-green-400">
                        {row.all.win}
                      </td>
                      <td className="px-4 py-3 text-center text-yellow-400">
                        {row.all.draw}
                      </td>
                      <td className="px-4 py-3 text-center text-red-400">
                        {row.all.lose}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-300">
                        {row.all.goals.for}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-300">
                        {row.all.goals.against}
                      </td>
                      <td
                        className={`px-4 py-3 text-center font-medium ${
                          row.goalsDiff > 0
                            ? "text-green-400"
                            : row.goalsDiff < 0
                            ? "text-red-400"
                            : "text-gray-400"
                        }`}
                      >
                        {row.goalsDiff > 0 ? "+" : ""}
                        {row.goalsDiff}
                      </td>
                      <td className="px-4 py-3 text-center text-white font-bold">
                        {row.points}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 justify-center">
                          {row.form.split("").map((result, i) => (
                            <span
                              key={i}
                              className={`w-5 h-5 rounded text-xs flex items-center justify-center font-bold ${
                                result === "W"
                                  ? "bg-green-600 text-white"
                                  : result === "D"
                                  ? "bg-yellow-600 text-white"
                                  : "bg-red-600 text-white"
                              }`}
                            >
                              {result === "W" ? "G" : result === "D" ? "E" : "P"}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-400">
              No hay datos de posiciones disponibles
            </div>
          )}
        </div>

        {/* ============================================= */}
        {/* COLUMNA DERECHA — RESULTADOS Y PRÓXIMOS */}
        {/* ============================================= */}
        <div className="space-y-6">
          {/* Resultados recientes */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h3 className={`text-lg font-semibold mb-4 ${colors.header}`}>
              Últimos Resultados
            </h3>
            {recentResults.length > 0 ? (
              <div className="space-y-3">
                {recentResults.map((match) => (
                  <div
                    key={match.fixture.id}
                    className="p-3 bg-gray-700/50 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-400">
                        {new Date(match.fixture.date).toLocaleDateString(
                          "es-MX",
                          {
                            day: "numeric",
                            month: "short",
                          }
                        )}
                      </span>
                      <span className="text-xs text-gray-400">
                        {match.league.round}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1">
                        <Image
                          src={match.teams.home.logo}
                          alt=""
                          width={20}
                          height={20}
                          unoptimized
                        />
                        <span className="text-sm text-white truncate">
                          {match.teams.home.name}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-white px-3">
                        {match.goals.home} - {match.goals.away}
                      </span>
                      <div className="flex items-center gap-2 flex-1 justify-end">
                        <span className="text-sm text-white truncate">
                          {match.teams.away.name}
                        </span>
                        <Image
                          src={match.teams.away.logo}
                          alt=""
                          width={20}
                          height={20}
                          unoptimized
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">
                No hay resultados recientes
              </p>
            )}
          </div>

          {/* Próximos partidos */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h3 className={`text-lg font-semibold mb-4 ${colors.header}`}>
              Próximos Partidos
            </h3>
            {upcomingFixtures.length > 0 ? (
              <div className="space-y-3">
                {upcomingFixtures.map((match) => (
                  <div
                    key={match.fixture.id}
                    className="p-3 bg-gray-700/50 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-400">
                        {new Date(match.fixture.date).toLocaleDateString(
                          "es-MX",
                          {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </span>
                      <span className="text-xs text-gray-400">
                        {match.league.round}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        <Image
                          src={match.teams.home.logo}
                          alt=""
                          width={20}
                          height={20}
                          unoptimized
                        />
                        <span className="text-sm text-white truncate">
                          {match.teams.home.name}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 px-3">VS</span>
                      <div className="flex items-center gap-2 flex-1 justify-end">
                        <span className="text-sm text-white truncate">
                          {match.teams.away.name}
                        </span>
                        <Image
                          src={match.teams.away.logo}
                          alt=""
                          width={20}
                          height={20}
                          unoptimized
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">
                No hay partidos programados
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
