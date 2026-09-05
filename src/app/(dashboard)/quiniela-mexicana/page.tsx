// =============================================
// PÁGINA — QUINIELA MEXICANA
// =============================================
// Predicciones de Liga MX basadas en datos históricos reales

"use client";

import { useState, useEffect, useCallback } from "react";

interface Fixture {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  time: string;
  venue: string;
  jornada: string;
}

interface Prediction {
  id: number;
  jornada: string;
  match_date: string;
  match_time: string;
  home_team: string;
  away_team: string;
  prediction: string;
  confidence: number;
  home_win_prob: number;
  draw_prob: number;
  away_win_prob: number;
  expected_home_goals: number;
  expected_away_goals: number;
  factor_team_state: any;
  factor_history: any;
  factor_form: any;
  status: string;
  actual_result?: string;
  actual_home_goals?: number;
  actual_away_goals?: number;
  is_correct?: boolean;
}

export default function QuinielaMexicanaPage() {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedJornada, setSelectedJornada] = useState<string>("all");
  const [showFactors, setShowFactors] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [fixturesRes, predictionsRes] = await Promise.all([
        fetch("/api/quiniela/fixtures"),
        fetch("/api/quiniela/predictions?status=all"),
      ]);

      const fixturesData = await fixturesRes.json();
      const predictionsData = await predictionsRes.json();

      if (fixturesData.success) {
        setFixtures(fixturesData.fixtures);
      }
      if (predictionsData.success) {
        setPredictions(predictionsData.predictions);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleGenerate = async () => {
    if (fixtures.length === 0) {
      setMessage("No hay fixtures disponibles");
      return;
    }

    setGenerating(true);
    setMessage(null);

    try {
      // Agrupar por jornada
      const jornadas = new Map<string, Fixture[]>();
      for (const fixture of fixtures) {
        const jornada = fixture.jornada || "N/A";
        if (!jornadas.has(jornada)) {
          jornadas.set(jornada, []);
        }
        jornadas.get(jornada)!.push(fixture);
      }

      // Generar predicciones para cada jornada
      let totalGenerated = 0;
      for (const [jornada, matches] of jornadas) {
        const res = await fetch("/api/quiniela/predictions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jornada, matches }),
        });
        const data = await res.json();
        if (data.success) {
          totalGenerated += data.generated;
        }
      }

      setMessage(`Generadas ${totalGenerated} predicciones nuevas`);
      fetchData();
    } catch (error) {
      setMessage("Error generando predicciones");
    }
    setGenerating(false);
  };

  const handleCheck = async () => {
    setChecking(true);
    setMessage(null);

    try {
      const res = await fetch("/api/quiniela/check", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setMessage(
          `Verificadas ${data.totalChecked} predicciones, ${data.totalWon} ganadoras (${data.accuracy}% efectividad)`
        );
        fetchData();
      }
    } catch (error) {
      setMessage("Error verificando predicciones");
    }
    setChecking(false);
  };

  const getPredictionLabel = (pred: string) => {
    switch (pred) {
      case "1": return "Local";
      case "X": return "Empate";
      case "2": return "Visitante";
      default: return pred;
    }
  };

  const getPredictionColor = (pred: string) => {
    switch (pred) {
      case "1": return "bg-green-600";
      case "X": return "bg-yellow-600";
      case "2": return "bg-red-600";
      default: return "bg-gray-600";
    }
  };

  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.7) return "text-green-400";
    if (conf >= 0.5) return "text-yellow-400";
    if (conf >= 0.3) return "text-orange-400";
    return "text-red-400";
  };

  const filteredPredictions = predictions.filter(
    (p) => selectedJornada === "all" || p.jornada === selectedJornada
  );

  const jornadas = [...new Set(predictions.map((p) => p.jornada))].sort();

  const stats = {
    total: predictions.length,
    pending: predictions.filter((p) => p.status === "pending").length,
    won: predictions.filter((p) => p.status === "won").length,
    lost: predictions.filter((p) => p.status === "lost").length,
    accuracy:
      predictions.filter((p) => p.status !== "pending").length > 0
        ? Math.round(
            (predictions.filter((p) => p.status === "won").length /
              predictions.filter((p) => p.status !== "pending").length) *
              100
          )
        : 0,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Quiniela Mexicana</h1>
          <p className="text-gray-400 mt-2">
            Predicciones de Liga MX basadas en datos históricos y estado actual
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleGenerate}
            disabled={generating || fixtures.length === 0}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
          >
            {generating ? "Generando..." : "Generar Predicciones"}
          </button>
          <button
            onClick={handleCheck}
            disabled={checking}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {checking ? "Verificando..." : "Verificar Resultados"}
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400">
          {message}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-gray-800 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-white">{stats.total}</p>
          <p className="text-sm text-gray-400">Total</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-yellow-400">{stats.pending}</p>
          <p className="text-sm text-gray-400">Pendientes</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-green-400">{stats.won}</p>
          <p className="text-sm text-gray-400">Ganadas</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-red-400">{stats.lost}</p>
          <p className="text-sm text-gray-400">Perdidas</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-purple-400">{stats.accuracy}%</p>
          <p className="text-sm text-gray-400">Efectividad</p>
        </div>
      </div>

      {/* Próximos Fixtures */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Próximos Partidos</h2>
        {loading ? (
          <div className="text-center py-8 text-gray-400">Cargando fixtures...</div>
        ) : fixtures.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No hay fixtures disponibles. Verifica la conexión con TheSportsDB.
          </div>
        ) : (
          <div className="space-y-3">
            {fixtures.slice(0, 10).map((fixture) => (
              <div
                key={fixture.id}
                className="flex items-center justify-between bg-gray-700/50 rounded-lg p-4"
              >
                <div className="flex-1 text-right">
                  <span className="text-white font-medium">{fixture.homeTeam}</span>
                </div>
                <div className="mx-4 text-center">
                  <div className="text-xs text-gray-400">
                    {fixture.date} {fixture.time}
                  </div>
                  <div className="bg-gray-600 px-3 py-1 rounded text-sm text-white font-bold">
                    VS
                  </div>
                  <div className="text-xs text-gray-400">Jornada {fixture.jornada}</div>
                </div>
                <div className="flex-1 text-left">
                  <span className="text-white font-medium">{fixture.awayTeam}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filtro de jornada */}
      <div className="flex items-center gap-4">
        <label className="text-gray-400">Filtrar por jornada:</label>
        <select
          value={selectedJornada}
          onChange={(e) => setSelectedJornada(e.target.value)}
          className="bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600"
        >
          <option value="all">Todas</option>
          {jornadas.map((j) => (
            <option key={j} value={j}>
              {j}
            </option>
          ))}
        </select>
      </div>

      {/* Predicciones */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Predicciones</h2>
        {filteredPredictions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No hay predicciones. Haz clic en &quot;Generar Predicciones&quot;.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPredictions.map((pred) => (
              <div
                key={pred.id}
                className="bg-gray-700/50 rounded-lg p-4 border border-gray-600"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <span className="text-white font-medium text-lg">
                      {pred.home_team}
                    </span>
                    <span className={`px-4 py-2 rounded-lg text-white font-bold ${getPredictionColor(pred.prediction)}`}>
                      {getPredictionLabel(pred.prediction)}
                    </span>
                    <span className="text-white font-medium text-lg">
                      {pred.away_team}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-400">
                      {pred.match_date} {pred.match_time}
                    </span>
                    <span className={`font-bold ${getConfidenceColor(pred.confidence)}`}>
                      {Math.round(pred.confidence * 100)}%
                    </span>
                    {pred.status === "won" && (
                      <span className="text-green-400 font-bold">✓ CORRECTA</span>
                    )}
                    {pred.status === "lost" && (
                      <span className="text-red-400 font-bold">✗ INCORRECTA</span>
                    )}
                  </div>
                </div>

                {/* Probabilidades */}
                <div className="flex gap-4 mb-3">
                  <div className="flex-1 bg-gray-600 rounded-lg p-3 text-center">
                    <div className="text-sm text-gray-400">Local</div>
                    <div className="text-xl font-bold text-green-400">
                      {Math.round(pred.home_win_prob * 100)}%
                    </div>
                  </div>
                  <div className="flex-1 bg-gray-600 rounded-lg p-3 text-center">
                    <div className="text-sm text-gray-400">Empate</div>
                    <div className="text-xl font-bold text-yellow-400">
                      {Math.round(pred.draw_prob * 100)}%
                    </div>
                  </div>
                  <div className="flex-1 bg-gray-600 rounded-lg p-3 text-center">
                    <div className="text-sm text-gray-400">Visitante</div>
                    <div className="text-xl font-bold text-red-400">
                      {Math.round(pred.away_win_prob * 100)}%
                    </div>
                  </div>
                </div>

                {/* Goles esperados */}
                <div className="text-sm text-gray-400 mb-3">
                  Goles esperados: {pred.home_team} {pred.expected_home_goals} - {pred.expected_away_goals} {pred.away_team}
                </div>

                {/* Botón de factores */}
                <button
                  onClick={() => setShowFactors(showFactors === pred.id ? null : pred.id)}
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  {showFactors === pred.id ? "Ocultar factores" : "Ver factores de predicción"}
                </button>

                {/* Factores detallados */}
                {showFactors === pred.id && (
                  <div className="mt-4 p-4 bg-gray-600/50 rounded-lg space-y-3">
                    <div>
                      <h4 className="text-white font-medium mb-2">Estado del Equipo</h4>
                      <div className="text-sm text-gray-300">
                        <p>Fuerza Local: {pred.factor_team_state?.home_strength} | Fuerza Visitante: {pred.factor_team_state?.away_strength}</p>
                        <p>Diferencia de forma: {pred.factor_team_state?.form_difference}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-white font-medium mb-2">Historial</h4>
                      <div className="text-sm text-gray-300">
                        <p>Ventaja H2H: {pred.factor_history?.h2h_advantage} | Tendencia Local/Visitante: {pred.factor_history?.home_away_tendency}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-white font-medium mb-2">Forma Reciente</h4>
                      <div className="text-sm text-gray-300">
                        <p>Forma Local: {pred.factor_form?.home_form}/15 | Forma Visitante: {pred.factor_form?.away_form}/15</p>
                        <p>Momentum: {pred.factor_form?.momentum}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Resultado real */}
                {pred.status !== "pending" && (
                  <div className="mt-3 p-3 bg-gray-600 rounded-lg">
                    <span className="text-gray-400">Resultado real: </span>
                    <span className="text-white font-bold">
                      {pred.home_team} {pred.actual_home_goals} - {pred.actual_away_goals} {pred.away_team}
                    </span>
                    <span className={`ml-3 font-bold ${pred.is_correct ? "text-green-400" : "text-red-400"}`}>
                      {pred.is_correct ? "✓ ACERTÓ" : "✗ FALLÓ"}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cómo funciona */}
      <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-xl">
        <h3 className="text-lg font-semibold text-white mb-4">
          Cómo Funciona la Quiniela Mexicana
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-400">
          <div>
            <p className="text-white font-medium mb-1">1. Datos Históricos</p>
            <p>Se almacenan los últimos 100 partidos entre cada par de equipos en Supabase.</p>
          </div>
          <div>
            <p className="text-white font-medium mb-1">2. Estado Actual</p>
            <p>Se actualiza semanalmente: posición, forma, rachas, goles, lesiones.</p>
          </div>
          <div>
            <p className="text-white font-medium mb-1">3. Factores de Predicción</p>
            <p>Fuerza del equipo, historial, forma reciente, contexto del partido, rivalidad.</p>
          </div>
          <div>
            <p className="text-white font-medium mb-1">4. Generación Automática</p>
            <p>Se generan predicciones 2 días antes de cada jornada de Liga MX.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
