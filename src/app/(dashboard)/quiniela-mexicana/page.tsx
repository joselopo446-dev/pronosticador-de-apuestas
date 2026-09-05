// =============================================
// QUINIELA MEXICANA — UI PROFESIONAL V3
// =============================================
// Solo muestra jornada actual por defecto
// Admin puede ver historial completo

"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, Button, StatCard, Badge, ProgressBar, LoadingSpinner } from "@/components/ui";

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

// Secret key para acceder al historial (cambiar por algo más seguro en producción)
const ADMIN_SECRET = "pronosticador2026";

export default function QuinielaMexicanaPage() {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [allPredictions, setAllPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [expandedPrediction, setExpandedPrediction] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [selectedJornada, setSelectedJornada] = useState<string>("current");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Cargar jornadas desde BD
      const [jornadasRes, predictionsRes] = await Promise.all([
        fetch("/api/football/jornadas?current=true"),
        fetch("/api/quiniela/predictions/daily"),
      ]);
      const jornadasData = await jornadasRes.json();
      const predictionsData = await predictionsRes.json();

      if (jornadasData.success && jornadasData.jornadas.length > 0) {
        // Convertir formato de jornadas a fixtures
        const currentJornada = jornadasData.jornadas[0];
        const fixturesFormatted = currentJornada.matches.map((m: any) => ({
          id: m.id,
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
          date: m.date || "Por definir",
          time: m.time || "00:00",
          venue: m.venue || "",
          jornada: currentJornada.jornada.toString(),
          status: m.status,
        }));
        setFixtures(fixturesFormatted);
      }

      if (predictionsData.success) {
        const preds = predictionsData.predictions.map((p: any) => ({
          id: p.id,
          jornada: p.jornada?.toString() || p.jornada_number?.toString() || "7",
          match_date: "",
          match_time: "",
          home_team: p.home_team,
          away_team: p.away_team,
          prediction: p.prediction,
          confidence: p.confidence,
          home_win_prob: p.home_win_prob,
          draw_prob: p.draw_prob,
          away_win_prob: p.away_win_prob,
          expected_home_goals: p.expected_home_goals,
          expected_away_goals: p.expected_away_goals,
          factor_team_state: p.factor_team_state,
          factor_history: p.factor_history,
          factor_form: p.factor_form,
          factor_context: p.factor_context,
          status: p.status || "pending",
        }));
        setPredictions(preds);
        if (isAdmin) setAllPredictions(preds);
      }
    } catch (error) {
      console.error("Error:", error);
    }
    setLoading(false);
  }, [isAdmin]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Obtener jornada actual de los fixtures
  const currentJornada = fixtures.length > 0 ? fixtures[0].jornada : "7";

  // Obtener todas las jornadas disponibles
  const allJornadas = [...new Set([...predictions.map(p => p.jornada), ...fixtures.map(f => f.jornada)])].sort();

  // Filtrar predicciones según modo
  const filteredPredictions = isAdmin && selectedJornada !== "current"
    ? predictions.filter(p => p.jornada === selectedJornada)
    : predictions.filter(p => p.jornada === currentJornada);

  const handleGenerate = async () => {
    setGenerating(true);
    setMessage(null);
    try {
      const res = await fetch("/api/quiniela/predictions/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: true }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: data.message || `Generados ${data.total} pronósticos del día` });
        fetchData();
      } else {
        setMessage({ type: "error", text: data.error || "Error generando pronósticos" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Error generando pronósticos" });
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
        setMessage({
          type: "success",
          text: `Verificadas ${data.totalChecked} predicciones, ${data.totalWon} ganadoras (${data.accuracy}% efectividad)`,
        });
        fetchData();
      }
    } catch (error) {
      setMessage({ type: "error", text: "Error verificando" });
    }
    setChecking(false);
  };

  const handleAdminLogin = () => {
    if (adminPassword === ADMIN_SECRET) {
      setIsAdmin(true);
      setShowAdminLogin(false);
      setAdminPassword("");
      setMessage({ type: "success", text: "Modo admin activado. Puedes ver todas las jornadas." });
    } else {
      setMessage({ type: "error", text: "Contraseña incorrecta" });
    }
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
      case "1": return "from-green-500 to-green-600";
      case "X": return "from-yellow-500 to-yellow-600";
      case "2": return "from-red-500 to-red-600";
      default: return "from-gray-500 to-gray-600";
    }
  };

  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.6) return "success";
    if (conf >= 0.5) return "info";
    if (conf >= 0.4) return "warning";
    return "danger";
  };

  const getConfidenceLabel = (conf: number) => {
    if (conf >= 0.6) return "Muy Alta";
    if (conf >= 0.5) return "Alta";
    if (conf >= 0.4) return "Media";
    if (conf >= 0.3) return "Baja";
    return "Muy Baja";
  };

  const stats = {
    total: filteredPredictions.length,
    pending: filteredPredictions.filter((p) => p.status === "pending").length,
    won: filteredPredictions.filter((p) => p.status === "won").length,
    lost: filteredPredictions.filter((p) => p.status === "lost").length,
    accuracy:
      filteredPredictions.filter((p) => p.status !== "pending").length > 0
        ? Math.round(
            (filteredPredictions.filter((p) => p.status === "won").length /
              filteredPredictions.filter((p) => p.status !== "pending").length) *
              100
          )
        : 0,
    avgConfidence:
      filteredPredictions.length > 0
        ? Math.round(
            (filteredPredictions.reduce((sum, p) => sum + p.confidence, 0) /
              filteredPredictions.length) *
              100
          )
        : 0,
  };

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-800/80 via-gray-900/80 to-gray-800/80 border border-gray-700/50 p-8">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-blue-500/5" />
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold text-white">Quiniela Mexicana</h1>
              <Badge variant="success">Jornada {currentJornada}</Badge>
            </div>
            <p className="text-gray-400 text-lg">
              Sistema profesional con Poisson, ELO Rating y análisis multivariable
            </p>
          </div>
          <div className="flex gap-4">
            <Button
              onClick={handleGenerate}
              loading={generating}
              variant="success"
              size="lg"
              disabled={fixtures.length === 0}
            >
              Generar Predicciones
            </Button>
            <Button
              onClick={handleCheck}
              loading={checking}
              variant="primary"
              size="lg"
            >
              Verificar Resultados
            </Button>
          </div>
        </div>
      </div>

      {/* Admin Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {isAdmin ? (
            <div className="flex items-center gap-4">
              <Badge variant="success" size="md">Admin Mode</Badge>
              <select
                value={selectedJornada}
                onChange={(e) => setSelectedJornada(e.target.value)}
                className="bg-gray-800/50 text-white rounded-xl px-4 py-2.5 border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
              >
                <option value="current">Jornada Actual ({currentJornada})</option>
                {allJornadas.map((j) => (
                  <option key={j} value={j}>Jornada {j}</option>
                ))}
              </select>
              <Button
                onClick={() => setIsAdmin(false)}
                variant="ghost"
                size="sm"
              >
                Salir Admin
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => setShowAdminLogin(true)}
              variant="ghost"
              size="sm"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Ver Historial
            </Button>
          )}
        </div>
      </div>

      {/* Admin Login Modal */}
      {showAdminLogin && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-white mb-4">Acceso Admin</h3>
            <p className="text-gray-400 text-sm mb-4">
              Ingresa la contraseña para ver todas las jornadas
            </p>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Contraseña"
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all mb-4"
              onKeyPress={(e) => e.key === "Enter" && handleAdminLogin()}
            />
            <div className="flex gap-3">
              <Button onClick={handleAdminLogin} variant="primary" fullWidth>
                Entrar
              </Button>
              <Button onClick={() => { setShowAdminLogin(false); setAdminPassword(""); }} variant="secondary" fullWidth>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-xl border ${
          message.type === "success"
            ? "bg-green-500/10 border-green-500/30 text-green-400"
            : message.type === "error"
            ? "bg-red-500/10 border-red-500/30 text-red-400"
            : "bg-blue-500/10 border-blue-500/30 text-blue-400"
        }`}>
          <div className="flex items-center gap-3">
            {message.type === "success" && (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {message.type === "error" && (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            {message.text}
          </div>
        </div>
      )}

      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          label="Total"
          value={stats.total}
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
          color="blue"
        />
        <StatCard
          label="Pendientes"
          value={stats.pending}
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          color="yellow"
        />
        <StatCard
          label="Ganadas"
          value={stats.won}
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          color="green"
        />
        <StatCard
          label="Perdidas"
          value={stats.lost}
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l2-2m-2 2l-2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          color="red"
        />
        <StatCard
          label="Efectividad"
          value={`${stats.accuracy}%`}
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
          color="purple"
          trend={stats.accuracy >= 50 ? "up" : "down"}
        />
        <StatCard
          label="Confianza Prom."
          value={`${stats.avgConfidence}%`}
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>}
          color={stats.avgConfidence >= 50 ? "green" : "yellow"}
        />
      </div>

      {/* Próximos Fixtures - Solo Jornada Actual */}
      <Card padding="lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white">
              {isAdmin && selectedJornada !== "current" 
                ? `Jornada ${selectedJornada}`
                : `Jornada Actual — ${currentJornada}`
              }
            </h2>
            <p className="text-gray-400 text-sm">Liga MX — Temporada 2025</p>
          </div>
          <Badge variant="info">{fixtures.filter(f => f.jornada === currentJornada).length} partidos</Badge>
        </div>
        {loading ? (
          <div className="py-12"><LoadingSpinner /></div>
        ) : fixtures.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No hay fixtures disponibles</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(isAdmin && selectedJornada !== "current" 
              ? fixtures.filter(f => f.jornada === selectedJornada)
              : fixtures.filter(f => f.jornada === currentJornada)
            ).map((fixture) => (
              <div
                key={fixture.id}
                className="flex items-center justify-between p-4 bg-gray-700/30 rounded-xl border border-gray-600/30 hover:border-gray-500/50 transition-all duration-200"
              >
                <div className="flex-1 text-right">
                  <span className="text-white font-semibold">{fixture.homeTeam}</span>
                </div>
                <div className="mx-4 text-center">
                  <div className="text-xs text-gray-500 mb-1">{fixture.date}</div>
                  <div className="bg-gradient-to-r from-gray-600 to-gray-700 px-4 py-1.5 rounded-lg text-sm text-white font-bold shadow-lg">
                    VS
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{fixture.time}</div>
                </div>
                <div className="flex-1 text-left">
                  <span className="text-white font-semibold">{fixture.awayTeam}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Predicciones - Solo Jornada Actual */}
      <Card padding="lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white">
              {isAdmin && selectedJornada !== "current"
                ? `Predicciones Jornada ${selectedJornada}`
                : `Predicciones Jornada ${currentJornada}`
              }
            </h2>
            <p className="text-gray-400 text-sm">Análisis multivariable con 5 modelos</p>
          </div>
          <Badge variant="info">{filteredPredictions.length} predicciones</Badge>
        </div>
        {filteredPredictions.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            {loading ? (
              <LoadingSpinner />
            ) : (
              <>
                <p className="mb-4">No hay predicciones para esta jornada</p>
                <Button onClick={handleGenerate} variant="success">
                  Generar Predicciones
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredPredictions.map((pred) => (
              <div
                key={pred.id}
                className={`bg-gray-700/30 rounded-2xl border overflow-hidden transition-all duration-200 ${
                  pred.status === "won"
                    ? "border-green-500/30"
                    : pred.status === "lost"
                    ? "border-red-500/30"
                    : "border-gray-600/30 hover:border-gray-500/50"
                }`}
              >
                {/* Header del partido */}
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex-1 text-right">
                        <span className="text-white font-bold text-lg">{pred.home_team}</span>
                      </div>
                      <div className={`px-6 py-3 rounded-xl bg-gradient-to-r ${getPredictionColor(pred.prediction)} text-white font-bold text-lg shadow-lg`}>
                        {getPredictionLabel(pred.prediction)}
                      </div>
                      <div className="flex-1">
                        <span className="text-white font-bold text-lg">{pred.away_team}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-gray-400">
                        {pred.match_date} {pred.match_time}
                      </div>
                      <Badge variant={getConfidenceColor(pred.confidence) as any}>
                        {Math.round(pred.confidence * 100)}% — {getConfidenceLabel(pred.confidence)}
                      </Badge>
                      {pred.status === "won" && <Badge variant="success" size="md">ACERTÓ</Badge>}
                      {pred.status === "lost" && <Badge variant="danger" size="md">FALLÓ</Badge>}
                      {pred.status === "pending" && <Badge variant="warning" size="md">PENDIENTE</Badge>}
                    </div>
                  </div>

                  {/* Resultado real si ya se jugó */}
                  {pred.status !== "pending" && (
                    <div className={`mt-4 p-4 rounded-xl ${
                      pred.is_correct 
                        ? "bg-green-500/10 border border-green-500/30" 
                        : "bg-red-500/10 border border-red-500/30"
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-gray-400">Resultado final:</span>
                          <span className="text-white font-bold text-lg">
                            {pred.home_team} {pred.actual_home_goals} - {pred.actual_away_goals} {pred.away_team}
                          </span>
                        </div>
                        <Badge variant={pred.is_correct ? "success" : "danger"} size="md">
                          {pred.is_correct ? "✓ Pronóstico Correcto" : "✗ Pronóstico Incorrecto"}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Probabilidades */}
                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="p-4 bg-gray-600/30 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Local</span>
                        <span className="text-lg font-bold text-green-400">
                          {Math.round(pred.home_win_prob * 100)}%
                        </span>
                      </div>
                      <ProgressBar value={pred.home_win_prob * 100} color="green" size="sm" />
                    </div>
                    <div className="p-4 bg-gray-600/30 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Empate</span>
                        <span className="text-lg font-bold text-yellow-400">
                          {Math.round(pred.draw_prob * 100)}%
                        </span>
                      </div>
                      <ProgressBar value={pred.draw_prob * 100} color="yellow" size="sm" />
                    </div>
                    <div className="p-4 bg-gray-600/30 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Visitante</span>
                        <span className="text-lg font-bold text-red-400">
                          {Math.round(pred.away_win_prob * 100)}%
                        </span>
                      </div>
                      <ProgressBar value={pred.away_win_prob * 100} color="red" size="sm" />
                    </div>
                  </div>

                  {/* Mercados */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                    <div className="p-3 bg-gray-600/20 rounded-lg text-center">
                      <div className="text-xs text-gray-400 mb-1">Goles Esperados</div>
                      <div className="text-lg font-bold text-white">
                        {pred.expected_home_goals} - {pred.expected_away_goals}
                      </div>
                    </div>
                    <div className="p-3 bg-gray-600/20 rounded-lg text-center">
                      <div className="text-xs text-gray-400 mb-1">Over 2.5</div>
                      <div className="text-lg font-bold text-blue-400">
                        {Math.round((pred.factor_history?.over_25 || 0.5) * 100)}%
                      </div>
                    </div>
                    <div className="p-3 bg-gray-600/20 rounded-lg text-center">
                      <div className="text-xs text-gray-400 mb-1">BTTS</div>
                      <div className="text-lg font-bold text-purple-400">
                        {Math.round((pred.factor_history?.btts || 0.5) * 100)}%
                      </div>
                    </div>
                    <div className="p-3 bg-gray-600/20 rounded-lg text-center">
                      <div className="text-xs text-gray-400 mb-1">Clean Sheet</div>
                      <div className="text-lg font-bold text-cyan-400">
                        {Math.round((pred.factor_history?.clean_sheet || 0.3) * 100)}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botón de detalles */}
                <button
                  onClick={() => setExpandedPrediction(expandedPrediction === pred.id ? null : pred.id)}
                  className="w-full py-3 bg-gray-700/30 border-t border-gray-600/30 text-blue-400 hover:text-blue-300 hover:bg-gray-700/50 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <span className="text-sm font-medium">
                    {expandedPrediction === pred.id ? "Ocultar Análisis" : "Ver Análisis Completo"}
                  </span>
                  <svg className={`w-4 h-4 transition-transform duration-200 ${expandedPrediction === pred.id ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Panel expandido */}
                {expandedPrediction === pred.id && (
                  <div className="p-6 bg-gray-800/50 border-t border-gray-700/50 space-y-6">
                    {/* Factores de predicción */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-700/30 rounded-xl">
                        <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          ELO Rating
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Local</span>
                            <span className="text-white font-medium">{pred.factor_team_state?.home || "N/A"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Visitante</span>
                            <span className="text-white font-medium">{pred.factor_team_state?.away || "N/A"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Diferencia</span>
                            <span className={`font-medium ${(pred.factor_team_state?.diff || 0) > 0 ? "text-green-400" : "text-red-400"}`}>
                              {(pred.factor_team_state?.diff || 0) > 0 ? "+" : ""}{pred.factor_team_state?.diff || 0}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-gray-700/30 rounded-xl">
                        <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          Forma Reciente
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Local</span>
                            <span className="text-white font-medium">{pred.factor_form?.home || "N/A"}/15</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Visitante</span>
                            <span className="text-white font-medium">{pred.factor_form?.away || "N/A"}/15</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Forma Ponderada</span>
                            <span className="text-white font-medium">
                              {pred.factor_form?.weighted_home || "N/A"} vs {pred.factor_form?.weighted_away || "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-gray-700/30 rounded-xl">
                        <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                          Historial H2H
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Ventaja</span>
                            <span className={`font-medium ${(pred.factor_history?.advantage || 0) > 0 ? "text-green-400" : "text-red-400"}`}>
                              {(pred.factor_history?.advantage || 0) > 0 ? "+" : ""}{pred.factor_history?.advantage || 0} goles
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Dominio Reciente</span>
                            <span className="text-white font-medium">
                              {Math.round((pred.factor_history?.recent_dominance || 0.5) * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-gray-700/30 rounded-xl">
                        <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full" />
                          Contexto
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Urgencia</span>
                            <span className="text-white font-medium">{pred.factor_context?.urgency || "N/A"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Importancia</span>
                            <span className="text-white font-medium">{pred.factor_context?.importance || "N/A"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Fatiga</span>
                            <span className="text-white font-medium">{pred.factor_context?.fatigue || "N/A"}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Rendimiento Local/Visitante */}
                    <div className="p-4 bg-gray-700/30 rounded-xl">
                      <h4 className="text-white font-semibold mb-3">Rendimiento Local/Visitante</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-400">Local como Local</span>
                            <span className="text-green-400 font-medium">
                              {Math.round((pred.factor_form?.home_advantage || 0.45) * 100)}%
                            </span>
                          </div>
                          <ProgressBar value={(pred.factor_form?.home_advantage || 0.45) * 100} color="green" size="sm" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-400">Visitante como Visitante</span>
                            <span className="text-red-400 font-medium">
                              {Math.round((pred.factor_form?.away_performance || 0.35) * 100)}%
                            </span>
                          </div>
                          <ProgressBar value={(pred.factor_form?.away_performance || 0.35) * 100} color="red" size="sm" />
                        </div>
                      </div>
                    </div>

                    {/* Modelo Poisson */}
                    <div className="p-4 bg-gray-700/30 rounded-xl">
                      <h4 className="text-white font-semibold mb-3">Modelo Poisson</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Lambda Local</span>
                            <span className="text-white font-medium">{pred.factor_team_state?.lambda_home || "N/A"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Lambda Visitante</span>
                            <span className="text-white font-medium">{pred.factor_team_state?.lambda_away || "N/A"}</span>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Goles Esperados Totales</span>
                            <span className="text-white font-medium">
                              {pred.expected_home_goals + pred.expected_away_goals}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Cómo funciona */}
      <Card padding="lg">
        <h3 className="text-xl font-semibold text-white mb-6">
          Sistema de Predicción Profesional
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            { name: "Poisson", weight: "30%", color: "blue", desc: "Modelo estadístico de distribución de goles" },
            { name: "ELO Rating", weight: "20%", color: "green", desc: "Sistema de rating adaptado del ajedrez" },
            { name: "Forma", weight: "20%", color: "yellow", desc: "Análisis de rendimiento reciente ponderado" },
            { name: "H2H", weight: "15%", color: "purple", desc: "Historial cara a cara con peso por recencia" },
            { name: "Contexto", weight: "15%", color: "red", desc: "Urgencia, importancia, fatiga, localía" },
          ].map((model) => (
            <div key={model.name} className={`p-4 bg-gradient-to-br from-${model.color}-500/10 to-${model.color}-600/5 rounded-xl border border-${model.color}-500/20`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-${model.color}-400 font-semibold`}>{model.name}</span>
                <Badge variant={model.color === "blue" ? "info" : model.color === "green" ? "success" : model.color === "yellow" ? "warning" : model.color === "purple" ? "info" : "danger"}>
                  {model.weight}
                </Badge>
              </div>
              <p className="text-sm text-gray-400">{model.desc}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
