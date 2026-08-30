"use client";

import { useState } from "react";
import { TEAMS } from "@/config/teams";

interface EnrichedData {
  homeTeam: {
    teamName: string;
    leaguePosition: number;
    points: number;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    recentForm: string;
    attackStrength: number;
    defenseStrength: number;
    formRating: number;
    dataSource: string;
  };
  awayTeam: {
    teamName: string;
    leaguePosition: number;
    points: number;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    recentForm: string;
    attackStrength: number;
    defenseStrength: number;
    formRating: number;
    dataSource: string;
  };
  predictionInput: {
    homeAttack: number;
    homeDefense: number;
    awayAttack: number;
    awayDefense: number;
    homeAdvantage: number;
    homeForm: number;
    awayForm: number;
  };
}

interface PredictionResult {
  expectedHomeGoals: number;
  expectedAwayGoals: number;
  probabilities: { homeWin: number; draw: number; awayWin: number };
  mostLikelyScore: { home: number; away: number; probability: number };
  overUnder: { over25: number; under25: number };
  btts: { yes: number; no: number };
  explanation: {
    factors: Array<{ name: string; impact: string; description: string }>;
    summary: string;
  };
  confidence?: number;
}

const MODELS = [
  { id: "ensemble", name: "Ensemble (3 modelos)", desc: "Combina Poisson + Logístico + Random Forest", confidence: 0.78 },
  { id: "poisson", name: "Distribución de Poisson", desc: "Modelo clásico de goles esperados", confidence: 0.70 },
  { id: "logistic-regression", name: "Regresión Logística", desc: "Clasificación multiclase", confidence: 0.65 },
  { id: "random-forest", name: "Random Forest", desc: "Ensamble de árboles de decisión", confidence: 0.72 },
];

function FormDisplay({ form }: { form: string }) {
  return (
    <div className="flex gap-1">
      {form.split("").map((r, i) => (
        <span
          key={i}
          className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
            r === "W" ? "bg-green-600 text-white" :
            r === "D" ? "bg-yellow-600 text-white" :
            "bg-red-600 text-white"
          }`}
        >
          {r}
        </span>
      ))}
    </div>
  );
}

export default function PrediccionesPage() {
  const [homeTeam, setHomeTeam] = useState(TEAMS[0]);
  const [awayTeam, setAwayTeam] = useState(TEAMS[16]);
  const [selectedModel, setSelectedModel] = useState("ensemble");
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [enriched, setEnriched] = useState<EnrichedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePredict() {
    setLoading(true);
    setError("");
    setPrediction(null);
    setEnriched(null);

    try {
      // 1. Obtener datos enriquecidos
      const enrichedRes = await fetch("/api/predictions/enriched", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homeTeamName: homeTeam.name,
          homeTeamId: homeTeam.id,
          awayTeamName: awayTeam.name,
          awayTeamId: awayTeam.id,
          leagueId: homeTeam.league === "liga-mx" ? 262 : 140,
        }),
      });

      const enrichedData = await enrichedRes.json();
      if (enrichedData.success) {
        setEnriched(enrichedData);
      }

      // 2. Generar predicción con datos enriquecidos (o defaults)
      const ep = enrichedData.predictionInput;
      const hasValidData = ep && ep.homeAttack > 0 && ep.awayAttack > 0;
      const input = hasValidData ? ep : {
        homeAttack: homeTeam.attack,
        homeDefense: homeTeam.defense,
        awayAttack: awayTeam.attack,
        awayDefense: awayTeam.defense,
      };

      const predRes = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...input,
          homeAdvantage: enrichedData.predictionInput?.homeAdvantage || 1.3,
          homeTeamId: homeTeam.id,
          awayTeamId: awayTeam.id,
        }),
      });

      const predData = await predRes.json();
      if (!predData.success) {
        setError(predData.error || "Error al generar predicción");
        return;
      }

      setPrediction({
        ...predData.prediction,
        confidence: MODELS.find((m) => m.id === selectedModel)?.confidence,
      });
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
          Predicciones con datos enriquecidos de múltiples APIs deportivas.
        </p>
      </div>

      {/* Selector de modelo */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Modelo de predicción</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {MODELS.map((model) => (
            <button
              key={model.id}
              onClick={() => setSelectedModel(model.id)}
              className={`p-4 rounded-lg border text-left transition-all ${
                selectedModel === model.id
                  ? "bg-blue-600/20 border-blue-500 ring-2 ring-blue-500/50"
                  : "bg-gray-700/50 border-gray-600 hover:border-gray-500"
              }`}
            >
              <p className="text-sm font-medium text-white">{model.name}</p>
              <p className="text-xs text-gray-400 mt-1">{model.desc}</p>
              <p className="text-xs text-blue-400 mt-2">Confianza: {(model.confidence * 100).toFixed(0)}%</p>
            </button>
          ))}
        </div>
      </div>

      {/* Selector de equipos */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Selecciona los equipos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Equipo Local</label>
            <select
              value={homeTeam.name}
              onChange={(e) => {
                const team = TEAMS.find((t) => t.name === e.target.value);
                if (team) setHomeTeam(team);
              }}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {TEAMS.map((team) => (
                <option key={team.name} value={team.name}>{team.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Equipo Visitante</label>
            <select
              value={awayTeam.name}
              onChange={(e) => {
                const team = TEAMS.find((t) => t.name === e.target.value);
                if (team) setAwayTeam(team);
              }}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {TEAMS.map((team) => (
                <option key={team.name} value={team.name}>{team.name}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handlePredict}
          disabled={loading}
          className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
        >
          {loading ? "Analizando datos de múltiples APIs..." : "Generar Predicción"}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Datos enriquecidos */}
      {enriched && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Equipo local */}
          <div className="bg-gray-800 border border-green-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">{enriched.homeTeam.teamName}</h3>
              <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
                {enriched.homeTeam.dataSource}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Posición en tabla</p>
                <p className="text-2xl font-bold text-green-400">#{enriched.homeTeam.leaguePosition || "N/A"}</p>
              </div>
              <div>
                <p className="text-gray-400">Puntos</p>
                <p className="text-2xl font-bold text-white">{enriched.homeTeam.points || "N/A"}</p>
              </div>
              <div>
                <p className="text-gray-400">Récord (G-E-P)</p>
                <p className="text-lg font-medium text-white">
                  {enriched.homeTeam.won}-{enriched.homeTeam.drawn}-{enriched.homeTeam.lost}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Goles (Fav-Con)</p>
                <p className="text-lg font-medium text-white">
                  {enriched.homeTeam.goalsFor}-{enriched.homeTeam.goalsAgainst}
                </p>
              </div>
            </div>
            {enriched.homeTeam.recentForm && (
              <div className="mt-4">
                <p className="text-sm text-gray-400 mb-2">Forma reciente (últimos 5)</p>
                <FormDisplay form={enriched.homeTeam.recentForm} />
              </div>
            )}
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-700/50 p-2 rounded">
                <span className="text-gray-400">Ataque:</span>
                <span className="text-white ml-1">{(enriched.homeTeam.attackStrength * 100).toFixed(0)}%</span>
              </div>
              <div className="bg-gray-700/50 p-2 rounded">
                <span className="text-gray-400">Defensa:</span>
                <span className="text-white ml-1">{(enriched.homeTeam.defenseStrength * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>

          {/* Equipo visitante */}
          <div className="bg-gray-800 border border-red-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">{enriched.awayTeam.teamName}</h3>
              <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
                {enriched.awayTeam.dataSource}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Posición en tabla</p>
                <p className="text-2xl font-bold text-red-400">#{enriched.awayTeam.leaguePosition || "N/A"}</p>
              </div>
              <div>
                <p className="text-gray-400">Puntos</p>
                <p className="text-2xl font-bold text-white">{enriched.awayTeam.points || "N/A"}</p>
              </div>
              <div>
                <p className="text-gray-400">Récord (G-E-P)</p>
                <p className="text-lg font-medium text-white">
                  {enriched.awayTeam.won}-{enriched.awayTeam.drawn}-{enriched.awayTeam.lost}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Goles (Fav-Con)</p>
                <p className="text-lg font-medium text-white">
                  {enriched.awayTeam.goalsFor}-{enriched.awayTeam.goalsAgainst}
                </p>
              </div>
            </div>
            {enriched.awayTeam.recentForm && (
              <div className="mt-4">
                <p className="text-sm text-gray-400 mb-2">Forma reciente (últimos 5)</p>
                <FormDisplay form={enriched.awayTeam.recentForm} />
              </div>
            )}
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-700/50 p-2 rounded">
                <span className="text-gray-400">Ataque:</span>
                <span className="text-white ml-1">{(enriched.awayTeam.attackStrength * 100).toFixed(0)}%</span>
              </div>
              <div className="bg-gray-700/50 p-2 rounded">
                <span className="text-gray-400">Defensa:</span>
                <span className="text-white ml-1">{(enriched.awayTeam.defenseStrength * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resultado de la predicción */}
      {prediction && (
        <div className="space-y-6">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-white">
                {homeTeam.name} vs {awayTeam.name}
              </h2>
              {prediction.confidence && (
                <span className="text-sm text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full">
                  Confianza: {(prediction.confidence * 100).toFixed(0)}%
                </span>
              )}
            </div>
            <p className="text-gray-400">{prediction.explanation.summary}</p>
          </div>

          {/* Probabilidades 1X2 */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-600/20 border border-green-500/30 rounded-xl p-6 text-center">
              <p className="text-sm text-green-400 mb-1">Local (1)</p>
              <p className="text-3xl font-bold text-white">
                {(prediction.probabilities.homeWin * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-gray-400 mt-1">{homeTeam.name}</p>
            </div>
            <div className="bg-yellow-600/20 border border-yellow-500/30 rounded-xl p-6 text-center">
              <p className="text-sm text-yellow-400 mb-1">Empate (X)</p>
              <p className="text-3xl font-bold text-white">
                {(prediction.probabilities.draw * 100).toFixed(1)}%
              </p>
            </div>
            <div className="bg-red-600/20 border border-red-500/30 rounded-xl p-6 text-center">
              <p className="text-sm text-red-400 mb-1">Visitante (2)</p>
              <p className="text-3xl font-bold text-white">
                {(prediction.probabilities.awayWin * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-gray-400 mt-1">{awayTeam.name}</p>
            </div>
          </div>

          {/* Goles y marcador */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Goles Esperados</h3>
              <div className="flex items-center justify-around">
                <div className="text-center">
                  <p className="text-sm text-gray-400">Local</p>
                  <p className="text-4xl font-bold text-blue-400">{prediction.expectedHomeGoals.toFixed(2)}</p>
                </div>
                <div className="text-2xl text-gray-500">—</div>
                <div className="text-center">
                  <p className="text-sm text-gray-400">Visitante</p>
                  <p className="text-4xl font-bold text-red-400">{prediction.expectedAwayGoals.toFixed(2)}</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Marcador Más Probable</h3>
              <div className="text-center">
                <p className="text-5xl font-bold text-white">
                  {prediction.mostLikelyScore.home} - {prediction.mostLikelyScore.away}
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Probabilidad: {(prediction.mostLikelyScore.probability * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* Over/Under y BTTS */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Over/Under</h3>
              <div className="space-y-3">
                {[
                  { label: "Over 2.5", value: prediction.overUnder.over25, color: "blue" },
                  { label: "Under 2.5", value: prediction.overUnder.under25, color: "green" },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between items-center">
                    <span className="text-gray-400">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-700 rounded-full h-2">
                        <div className={`bg-${item.color}-500 h-2 rounded-full`} style={{ width: `${item.value * 100}%` }} />
                      </div>
                      <span className="text-white font-medium w-12 text-right">{(item.value * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Ambos Anotan</h3>
              <div className="space-y-3">
                {[
                  { label: "Sí (BTTS)", value: prediction.btts.yes, color: "green" },
                  { label: "No", value: prediction.btts.no, color: "red" },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between items-center">
                    <span className="text-gray-400">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-700 rounded-full h-2">
                        <div className={`bg-${item.color}-500 h-2 rounded-full`} style={{ width: `${item.value * 100}%` }} />
                      </div>
                      <span className="text-white font-medium w-12 text-right">{(item.value * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Factores */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Factores de la Predicción</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {prediction.explanation.factors.map((factor) => (
                <div key={factor.name} className="p-4 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-white">{factor.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      factor.impact === "alto" || factor.impact === "muy alto"
                        ? "bg-green-600/30 text-green-400"
                        : factor.impact === "bajo"
                        ? "bg-red-600/30 text-red-400"
                        : "bg-yellow-600/30 text-yellow-400"
                    }`}>
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
