// =============================================
// MÓDULO DE PREDICCIONES
// =============================================
// Permite generar predicciones usando el modelo Poisson.

"use client";

import { useState } from "react";
import { TEAMS } from "@/config/teams";

interface PredictionResult {
  expectedHomeGoals: number;
  expectedAwayGoals: number;
  probabilities: {
    homeWin: number;
    draw: number;
    awayWin: number;
  };
  mostLikelyScore: {
    home: number;
    away: number;
    probability: number;
  };
  overUnder: {
    over25: number;
    under25: number;
  };
  btts: {
    yes: number;
    no: number;
  };
  explanation: {
    factors: Array<{
      name: string;
      value: number;
      impact: string;
      description: string;
    }>;
    summary: string;
  };
}

export default function PrediccionesPage() {
  const [homeTeam, setHomeTeam] = useState(TEAMS[0]);
  const [awayTeam, setAwayTeam] = useState(TEAMS[16]);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePredict() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homeTeamAttack: homeTeam.attack,
          homeTeamDefense: homeTeam.defense,
          awayTeamAttack: awayTeam.attack,
          awayTeamDefense: awayTeam.defense,
          homeAdvantage: 1.3,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Error al generar predicción");
        return;
      }

      setPrediction(data.prediction);
    } catch {
      setError("Error de conexión con el servicio");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Predicciones</h1>
        <p className="text-gray-400 mt-2">
          Genera predicciones usando el modelo Poisson para cualquier partido.
        </p>
      </div>

      {/* ============================================= */}
      {/* SELECTOR DE EQUIPOS */}
      {/* ============================================= */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          Selecciona los equipos
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Equipo local */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Equipo Local
            </label>
            <select
              value={homeTeam.name}
              onChange={(e) => {
                const team = TEAMS.find((t) => t.name === e.target.value);
                if (team) setHomeTeam(team);
              }}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {TEAMS.map((team) => (
                <option key={team.name} value={team.name}>
                  {team.name}
                </option>
              ))}
            </select>
            <div className="mt-2 flex gap-2 text-xs text-gray-400">
              <span>Ataque: {homeTeam.attack}</span>
              <span>•</span>
              <span>Defensa: {homeTeam.defense}</span>
            </div>
          </div>

          {/* Equipo visitante */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Equipo Visitante
            </label>
            <select
              value={awayTeam.name}
              onChange={(e) => {
                const team = TEAMS.find((t) => t.name === e.target.value);
                if (team) setAwayTeam(team);
              }}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {TEAMS.map((team) => (
                <option key={team.name} value={team.name}>
                  {team.name}
                </option>
              ))}
            </select>
            <div className="mt-2 flex gap-2 text-xs text-gray-400">
              <span>Ataque: {awayTeam.attack}</span>
              <span>•</span>
              <span>Defensa: {awayTeam.defense}</span>
            </div>
          </div>
        </div>

        <button
          onClick={handlePredict}
          disabled={loading}
          className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
        >
          {loading ? "Calculando..." : "Generar Predicción"}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* ============================================= */}
      {/* RESULTADO DE LA PREDICCIÓN */}
      {/* ============================================= */}
      {prediction && (
        <div className="space-y-6">
          {/* Resumen */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              {homeTeam.name} vs {awayTeam.name}
            </h2>
            <p className="text-gray-400">{prediction.explanation.summary}</p>
          </div>

          {/* Probabilidades 1X2 */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-600/20 border border-green-500/30 rounded-xl p-6 text-center">
              <p className="text-sm text-green-400 mb-1">Local (1)</p>
              <p className="text-3xl font-bold text-white">
                {(prediction.probabilities.homeWin * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {homeTeam.name}
              </p>
            </div>
            <div className="bg-yellow-600/20 border border-yellow-500/30 rounded-xl p-6 text-center">
              <p className="text-sm text-yellow-400 mb-1">Empate (X)</p>
              <p className="text-3xl font-bold text-white">
                {(prediction.probabilities.draw * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-gray-400 mt-1">Empate</p>
            </div>
            <div className="bg-red-600/20 border border-red-500/30 rounded-xl p-6 text-center">
              <p className="text-sm text-red-400 mb-1">Visitante (2)</p>
              <p className="text-3xl font-bold text-white">
                {(prediction.probabilities.awayWin * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {awayTeam.name}
              </p>
            </div>
          </div>

          {/* Goles esperados y marcador */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Goles Esperados
              </h3>
              <div className="flex items-center justify-around">
                <div className="text-center">
                  <p className="text-sm text-gray-400">Local</p>
                  <p className="text-4xl font-bold text-blue-400">
                    {prediction.expectedHomeGoals.toFixed(2)}
                  </p>
                </div>
                <div className="text-2xl text-gray-500">—</div>
                <div className="text-center">
                  <p className="text-sm text-gray-400">Visitante</p>
                  <p className="text-4xl font-bold text-red-400">
                    {prediction.expectedAwayGoals.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Marcador Más Probable
              </h3>
              <div className="text-center">
                <p className="text-5xl font-bold text-white">
                  {prediction.mostLikelyScore.home} -{" "}
                  {prediction.mostLikelyScore.away}
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Probabilidad:{" "}
                  {(prediction.mostLikelyScore.probability * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* Over/Under y BTTS */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Over/Under
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Over 2.5</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{
                          width: `${prediction.overUnder.over25 * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-white font-medium w-12 text-right">
                      {(prediction.overUnder.over25 * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Under 2.5</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{
                          width: `${prediction.overUnder.under25 * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-white font-medium w-12 text-right">
                      {(prediction.overUnder.under25 * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Ambos Equipos Anotan
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Sí (BTTS)</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${prediction.btts.yes * 100}%` }}
                      />
                    </div>
                    <span className="text-white font-medium w-12 text-right">
                      {(prediction.btts.yes * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">No</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full"
                        style={{ width: `${prediction.btts.no * 100}%` }}
                      />
                    </div>
                    <span className="text-white font-medium w-12 text-right">
                      {(prediction.btts.no * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Factores de explicación */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Factores de la Predicción
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {prediction.explanation.factors.map((factor) => (
                <div
                  key={factor.name}
                  className="p-4 bg-gray-700/50 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-white">
                      {factor.name}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        factor.impact === "alto"
                          ? "bg-green-600/30 text-green-400"
                          : factor.impact === "bajo"
                          ? "bg-red-600/30 text-red-400"
                          : "bg-yellow-600/30 text-yellow-400"
                      }`}
                    >
                      {factor.impact}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">{factor.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
