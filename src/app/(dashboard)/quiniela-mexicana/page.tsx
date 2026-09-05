// =============================================
// PÁGINA — QUINIELA MEXICANA PROFESIONAL
// =============================================
// Predicciones avanzadas con Poisson, ELO, y análisis multivariable

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
  factor_context: any;
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
  const [expandedPrediction, setExpandedPrediction] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [fixturesRes, predictionsRes] = await Promise.all([
        fetch("/api/quiniela/fixtures"),
        fetch("/api/quiniela/predictions?status=all"),
      ]);

      const fixturesData = await fixturesRes.json();
      const predictionsData = await predictionsRes.json();

      if (fixturesData.success) setFixtures(fixturesData.fixtures);
      if (predictionsData.success) setPredictions(predictionsData.predictions);
    } catch (error) {
      console.error("Error:", error);
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
      const jornadas = new Map<string, Fixture[]>();
      for (const fixture of fixtures) {
        const jornada = fixture.jornada || "N/A";
        if (!jornadas.has(jornada)) jornadas.set(jornada, []);
        jornadas.get(jornada)!.push(fixture);
      }

      let totalGenerated = 0;
      for (const [jornada, matches] of jornadas) {
        const res = await fetch("/api/quiniela/predictions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jornada, matches }),
        });
        const data = await res.json();
        if (data.success) totalGenerated += data.generated;
      }

      setMessage(`Generadas ${totalGenerated} predicciones profesionales`);
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
      setMessage("Error verificando");
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
    if (conf >= 0.6) return "text-green-400";
    if (conf >= 0.5) return "text-blue-400";
    if (conf >= 0.4) return "text-yellow-400";
    if (conf >= 0.3) return "text-orange-400";
    return "text-red-400";
  };

  const getConfidenceLabel = (conf: number) => {
    if (conf >= 0.6) return "Muy Alta";
    if (conf >= 0.5) return "Alta";
    if (conf >= 0.4) return "Media";
    if (conf >= 0.3) return "Baja";
    return "Muy Baja";
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
    avgConfidence:
      predictions.length > 0
        ? Math.round(
            (predictions.reduce((sum, p) => sum + p.confidence, 0) /
              predictions.length) *
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
            Sistema profesional con Poisson, ELO Rating y análisis multivariable
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
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
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
        <div className="bg-gray-800 rounded-xl p-4 text-center">
          <p className={`text-3xl font-bold ${getConfidenceColor(stats.avgConfidence / 100)}`}>
            {stats.avgConfidence}%
          </p>
          <p className="text-sm text-gray-400">Confianza Prom.</p>
        </div>
      </div>

      {/* Próximos Fixtures */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Próximos Partidos</h2>
        {loading ? (
          <div className="text-center py-8 text-gray-400">Cargando fixtures...</div>
        ) : fixtures.length === 0 ? (
          <div className="text-center py-8 text-gray-400">No hay fixtures disponibles</div>
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

      {/* Filtro */}
      <div className="flex items-center gap-4">
        <label className="text-gray-400">Filtrar por jornada:</label>
        <select
          value={selectedJornada}
          onChange={(e) => setSelectedJornada(e.target.value)}
          className="bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600"
        >
          <option value="all">Todas</option>
          {jornadas.map((j) => (
            <option key={j} value={j}>{j}</option>
          ))}
        </select>
      </div>

      {/* Predicciones */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Predicciones Profesionales</h2>
        {filteredPredictions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No hay predicciones. Haz clic en &quot;Generar Predicciones&quot;.
          </div>
        ) : (
          <div className="space-y-6">
            {filteredPredictions.map((pred) => (
              <div
                key={pred.id}
                className="bg-gray-700/50 rounded-lg p-5 border border-gray-600"
              >
                {/* Header del partido */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <span className="text-white font-bold text-lg">{pred.home_team}</span>
                    <span className={`px-5 py-2 rounded-lg text-white font-bold text-lg ${getPredictionColor(pred.prediction)}`}>
                      {getPredictionLabel(pred.prediction)}
                    </span>
                    <span className="text-white font-bold text-lg">{pred.away_team}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-400">
                      {pred.match_date} {pred.match_time}
                    </span>
                    <div className="text-right">
                      <span className={`font-bold text-lg ${getConfidenceColor(pred.confidence)}`}>
                        {Math.round(pred.confidence * 100)}%
                      </span>
                      <span className="text-xs text-gray-400 block">
                        {getConfidenceLabel(pred.confidence)}
                      </span>
                    </div>
                    {pred.status === "won" && (
                      <span className="text-green-400 font-bold">✓ ACERTÓ</span>
                    )}
                    {pred.status === "lost" && (
                      <span className="text-red-400 font-bold">✗ FALLÓ</span>
                    )}
                  </div>
                </div>

                {/* Probabilidades principales */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-gray-600 rounded-lg p-4 text-center">
                    <div className="text-sm text-gray-400 mb-1">Local</div>
                    <div className="text-2xl font-bold text-green-400">
                      {Math.round(pred.home_win_prob * 100)}%
                    </div>
                    <div className="w-full bg-gray-500 rounded-full h-2 mt-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${pred.home_win_prob * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="bg-gray-600 rounded-lg p-4 text-center">
                    <div className="text-sm text-gray-400 mb-1">Empate</div>
                    <div className="text-2xl font-bold text-yellow-400">
                      {Math.round(pred.draw_prob * 100)}%
                    </div>
                    <div className="w-full bg-gray-500 rounded-full h-2 mt-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-full"
                        style={{ width: `${pred.draw_prob * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="bg-gray-600 rounded-lg p-4 text-center">
                    <div className="text-sm text-gray-400 mb-1">Visitante</div>
                    <div className="text-2xl font-bold text-red-400">
                      {Math.round(pred.away_win_prob * 100)}%
                    </div>
                    <div className="w-full bg-gray-500 rounded-full h-2 mt-2">
                      <div
                        className="bg-red-500 h-2 rounded-full"
                        style={{ width: `${pred.away_win_prob * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Goles esperados y mercados */}
                <div className="grid grid-cols-4 gap-3 mb-4">
                  <div className="bg-gray-600/50 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-400">Goles Esperados</div>
                    <div className="text-lg font-bold text-white">
                      {pred.expected_home_goals} - {pred.expected_away_goals}
                    </div>
                  </div>
                  <div className="bg-gray-600/50 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-400">Over 2.5</div>
                    <div className="text-lg font-bold text-blue-400">
                      {Math.round((pred.factor_history?.over_25 || 0.5) * 100)}%
                    </div>
                  </div>
                  <div className="bg-gray-600/50 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-400">BTTS</div>
                    <div className="text-lg font-bold text-purple-400">
                      {Math.round((pred.factor_history?.btts || 0.5) * 100)}%
                    </div>
                  </div>
                  <div className="bg-gray-600/50 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-400">Clean Sheet</div>
                    <div className="text-lg font-bold text-cyan-400">
                      {Math.round((pred.factor_history?.clean_sheet || 0.3) * 100)}%
                    </div>
                  </div>
                </div>

                {/* Botón de detalles */}
                <button
                  onClick={() => setExpandedPrediction(expandedPrediction === pred.id ? null : pred.id)}
                  className="w-full text-center py-2 text-blue-400 hover:text-blue-300 text-sm font-medium"
                >
                  {expandedPrediction === pred.id ? "Ocultar Análisis ▲" : "Ver Análisis Completo ▼"}
                </button>

                {/* Panel expandido con análisis detallado */}
                {expandedPrediction === pred.id && (
                  <div className="mt-4 p-4 bg-gray-600/30 rounded-lg space-y-4">
                    {/* Factores de predicción */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                          <span className="w-2 h-2 bg-blue-500 rounded-full" />
                          ELO Rating
                        </h4>
                        <div className="text-sm text-gray-300 space-y-1">
                          <p>Local: <span className="text-white font-medium">{pred.factor_team_state?.home || "N/A"}</span></p>
                          <p>Visitante: <span className="text-white font-medium">{pred.factor_team_state?.away || "N/A"}</span></p>
                          <p>Diferencia: <span className={`font-medium ${(pred.factor_team_state?.diff || 0) > 0 ? "text-green-400" : "text-red-400"}`}>
                            {(pred.factor_team_state?.diff || 0) > 0 ? "+" : ""}{pred.factor_team_state?.diff || 0}
                          </span></p>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full" />
                          Forma Reciente
                        </h4>
                        <div className="text-sm text-gray-300 space-y-1">
                          <p>Local: <span className="text-white font-medium">{pred.factor_form?.home || "N/A"}/15</span></p>
                          <p>Visitante: <span className="text-white font-medium">{pred.factor_form?.away || "N/A"}/15</span></p>
                          <p>Forma Ponderada: <span className="text-white font-medium">
                            {pred.factor_form?.weighted_home || "N/A"} vs {pred.factor_form?.weighted_away || "N/A"}
                          </span></p>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                          <span className="w-2 h-2 bg-yellow-500 rounded-full" />
                          Historial H2H
                        </h4>
                        <div className="text-sm text-gray-300 space-y-1">
                          <p>Ventaja: <span className={`font-medium ${(pred.factor_history?.advantage || 0) > 0 ? "text-green-400" : "text-red-400"}`}>
                            {(pred.factor_history?.advantage || 0) > 0 ? "+" : ""}{pred.factor_history?.advantage || 0} goles
                          </span></p>
                          <p>Dominio Reciente: <span className="text-white font-medium">
                            {Math.round((pred.factor_history?.recent_dominance || 0.5) * 100)}%
                          </span></p>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                          <span className="w-2 h-2 bg-purple-500 rounded-full" />
                          Contexto
                        </h4>
                        <div className="text-sm text-gray-300 space-y-1">
                          <p>Urgencia: <span className="text-white font-medium">{pred.factor_context?.urgency || "N/A"}</span></p>
                          <p>Importancia: <span className="text-white font-medium">{pred.factor_context?.importance || "N/A"}</span></p>
                          <p>Fatiga: <span className="text-white font-medium">{pred.factor_context?.fatigue || "N/A"}</span></p>
                        </div>
                      </div>
                    </div>

                    {/* Localía vs Visitante */}
                    <div className="p-3 bg-gray-600/50 rounded-lg">
                      <h4 className="text-white font-semibold mb-2">Rendimiento Local/Visitante</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="text-gray-300">
                          <p>Local como Local: <span className="text-green-400 font-medium">
                            {Math.round((pred.factor_form?.home_advantage || 0.45) * 100)}% victorias
                          </span></p>
                        </div>
                        <div className="text-gray-300">
                          <p>Visitante como Visitante: <span className="text-red-400 font-medium">
                            {Math.round((pred.factor_form?.away_performance || 0.35) * 100)}% victorias
                          </span></p>
                        </div>
                      </div>
                    </div>

                    {/* Modelo Poisson */}
                    <div className="p-3 bg-gray-600/50 rounded-lg">
                      <h4 className="text-white font-semibold mb-2">Modelo Poisson</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="text-gray-300">
                          <p>Lambda Local: <span className="text-white font-medium">{pred.factor_team_state?.lambda_home || "N/A"}</span></p>
                          <p>Lambda Visitante: <span className="text-white font-medium">{pred.factor_team_state?.lambda_away || "N/A"}</span></p>
                        </div>
                        <div className="text-gray-300">
                          <p>Goles Esperados Totales: <span className="text-white font-medium">
                            {pred.expected_home_goals + pred.expected_away_goals}
                          </span></p>
                        </div>
                      </div>
                    </div>

                    {/* Resultado real */}
                    {pred.status !== "pending" && (
                      <div className="p-3 bg-gray-600 rounded-lg">
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
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cómo funciona */}
      <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-xl">
        <h3 className="text-lg font-semibold text-white mb-4">
          Sistema de Predicción Profesional
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm text-gray-400">
          <div className="p-3 bg-gray-700/50 rounded-lg">
            <p className="text-blue-400 font-medium mb-1">Poisson (30%)</p>
            <p>Modelo estadístico de distribución de goles</p>
          </div>
          <div className="p-3 bg-gray-700/50 rounded-lg">
            <p className="text-green-400 font-medium mb-1">ELO Rating (20%)</p>
            <p>Sistema de rating adaptado del ajedrez</p>
          </div>
          <div className="p-3 bg-gray-700/50 rounded-lg">
            <p className="text-yellow-400 font-medium mb-1">Forma (20%)</p>
            <p>Análisis de rendimiento reciente ponderado</p>
          </div>
          <div className="p-3 bg-gray-700/50 rounded-lg">
            <p className="text-purple-400 font-medium mb-1">H2H (15%)</p>
            <p>Historial cara a cara con peso por recencia</p>
          </div>
          <div className="p-3 bg-gray-700/50 rounded-lg">
            <p className="text-red-400 font-medium mb-1">Contexto (15%)</p>
            <p>Urgencia, importancia, fatiga, localía</p>
          </div>
        </div>
      </div>
    </div>
  );
}
