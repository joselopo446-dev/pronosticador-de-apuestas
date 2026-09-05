// =============================================
// QUINIELA PAGE GENÉRICA — MULTI-LIGA
// =============================================
// Componente reutilizable para Liga MX, Premier League, La Liga

"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, Button, Badge, LoadingSpinner } from "@/components/ui";

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

interface LeagueConfig {
  slug: string;
  name: string;
  fullName: string;
  color: string;
  gradient: string;
  accentColor: string;
}

const ADMIN_SECRET = "pronosticador2026";

export default function QuinielaPage({ config }: { config: LeagueConfig }) {
  const { slug, name, fullName, color, gradient, accentColor } = config;

  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [expandedPrediction, setExpandedPrediction] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [selectedJornada, setSelectedJornada] = useState<string>("current");
  const [allJornadas, setAllJornadas] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [jornadasRes, predictionsRes] = await Promise.all([
        fetch(`/api/football/jornadas?current=true&league=${slug}`),
        fetch(`/api/quiniela/predictions/daily?league=${slug}`),
      ]);
      const jornadasData = await jornadasRes.json();
      const predictionsData = await predictionsRes.json();

      if (jornadasData.success && jornadasData.jornadas.length > 0) {
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
          jornada: p.jornada?.toString() || "1",
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
        const jornadas = [...new Set(preds.map((p: Prediction) => p.jornada))].sort() as string[];
        setAllJornadas(jornadas);
      }
    } catch (error) {
      console.error("Error:", error);
    }
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const currentJornada = fixtures.length > 0 ? fixtures[0].jornada : "1";

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
        body: JSON.stringify({ force: true, league: slug }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: data.message || `Generados ${data.total} pronósticos` });
        fetchData();
      } else {
        setMessage({ type: "error", text: data.error || "Error generando pronósticos" });
      }
    } catch {
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
    } catch {
      setMessage({ type: "error", text: "Error verificando" });
    }
    setChecking(false);
  };

  const handleAdminLogin = () => {
    if (adminPassword === ADMIN_SECRET) {
      setIsAdmin(true);
      setShowAdminLogin(false);
      setAdminPassword("");
      setMessage({ type: "success", text: "Modo admin activado" });
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
    if (conf >= 0.6) return "success" as const;
    if (conf >= 0.5) return "info" as const;
    if (conf >= 0.4) return "warning" as const;
    return "danger" as const;
  };

  const stats = {
    total: filteredPredictions.length,
    pending: filteredPredictions.filter(p => p.status === "pending").length,
    won: filteredPredictions.filter(p => p.status === "won").length,
    lost: filteredPredictions.filter(p => p.status === "lost").length,
    accuracy: filteredPredictions.filter(p => p.status !== "pending").length > 0
      ? Math.round((filteredPredictions.filter(p => p.status === "won").length / filteredPredictions.filter(p => p.status !== "pending").length) * 100)
      : 0,
    avgConfidence: filteredPredictions.length > 0
      ? Math.round((filteredPredictions.reduce((sum, p) => sum + p.confidence, 0) / filteredPredictions.length) * 100)
      : 0,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} border border-gray-700/50 p-8`}>
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold text-white">{fullName}</h1>
              <Badge variant="success">Jornada {currentJornada}</Badge>
            </div>
            <p className="text-gray-400 text-lg">Sistema profesional de predicciones con Poisson, ELO y análisis multivariable</p>
          </div>
          <div className="flex gap-4">
            <Button onClick={handleGenerate} loading={generating} variant="success" size="lg" disabled={fixtures.length === 0}>
              Generar Predicciones
            </Button>
            <Button onClick={handleCheck} loading={checking} variant="primary" size="lg">
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
                className="bg-gray-800/50 text-white rounded-xl px-4 py-2.5 border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              >
                <option value="current">Jornada Actual ({currentJornada})</option>
                {allJornadas.map(j => (
                  <option key={j} value={j}>Jornada {j}</option>
                ))}
              </select>
              <Button onClick={() => setIsAdmin(false)} variant="ghost" size="sm">Salir Admin</Button>
            </div>
          ) : (
            <Button onClick={() => setShowAdminLogin(true)} variant="ghost" size="sm">
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
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Contraseña"
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all mb-4"
              onKeyPress={(e) => e.key === "Enter" && handleAdminLogin()}
            />
            <div className="flex gap-3">
              <Button onClick={handleAdminLogin} variant="primary" fullWidth>Entrar</Button>
              <Button onClick={() => { setShowAdminLogin(false); setAdminPassword(""); }} variant="secondary" fullWidth>Cancelar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-xl border ${
          message.type === "success" ? "bg-green-500/10 border-green-500/30 text-green-400"
          : message.type === "error" ? "bg-red-500/10 border-red-500/30 text-red-400"
          : "bg-blue-500/10 border-blue-500/30 text-blue-400"
        }`}>
          {message.text}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card padding="sm" className="text-center">
          <p className="text-3xl font-bold text-white">{stats.total}</p>
          <p className="text-xs text-gray-400">Predicciones</p>
        </Card>
        <Card padding="sm" className="text-center">
          <p className="text-3xl font-bold text-yellow-400">{stats.pending}</p>
          <p className="text-xs text-gray-400">Pendientes</p>
        </Card>
        <Card padding="sm" className="text-center">
          <p className="text-3xl font-bold text-green-400">{stats.won}</p>
          <p className="text-xs text-gray-400">Ganadas</p>
        </Card>
        <Card padding="sm" className="text-center">
          <p className="text-3xl font-bold text-blue-400">{stats.avgConfidence}%</p>
          <p className="text-xs text-gray-400">Confianza Prom.</p>
        </Card>
      </div>

      {/* Fixtures */}
      {fixtures.length > 0 && (
        <Card padding="lg">
          <h3 className="text-xl font-semibold text-white mb-6">Partidos Jornada {currentJornada}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fixtures.map((f, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-700/30 rounded-xl">
                <span className="text-white font-medium flex-1 text-right">{f.homeTeam}</span>
                <div className="mx-4 px-3 py-1 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-400 text-sm">VS</span>
                </div>
                <span className="text-white font-medium flex-1 text-left">{f.awayTeam}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Predictions */}
      {filteredPredictions.length > 0 && (
        <Card padding="lg">
          <h3 className="text-xl font-semibold text-white mb-6">Predicciones</h3>
          <div className="space-y-4">
            {filteredPredictions.map((pred) => (
              <div key={pred.id} className="bg-gray-700/30 rounded-xl p-4 border border-gray-600/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-white font-medium">{pred.home_team}</span>
                    <span className="text-gray-500">vs</span>
                    <span className="text-white font-medium">{pred.away_team}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={getConfidenceColor(pred.confidence)}>
                      {Math.round(pred.confidence * 100)}%
                    </Badge>
                    <div className={`w-10 h-10 bg-gradient-to-br ${getPredictionColor(pred.prediction)} rounded-lg flex items-center justify-center`}>
                      <span className="text-white font-bold text-sm">{pred.prediction}</span>
                    </div>
                  </div>
                </div>

                {/* Probability bars */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">Local</span>
                      <span className="text-green-400">{Math.round(pred.home_win_prob * 100)}%</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${pred.home_win_prob * 100}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">Empate</span>
                      <span className="text-yellow-400">{Math.round(pred.draw_prob * 100)}%</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${pred.draw_prob * 100}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">Visitante</span>
                      <span className="text-red-400">{Math.round(pred.away_win_prob * 100)}%</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 rounded-full" style={{ width: `${pred.away_win_prob * 100}%` }} />
                    </div>
                  </div>
                </div>

                {/* Expand details */}
                <button
                  onClick={() => setExpandedPrediction(expandedPrediction === pred.id ? null : pred.id)}
                  className="text-xs text-gray-400 hover:text-white transition-colors"
                >
                  {expandedPrediction === pred.id ? "▲ Ocultar detalles" : "▼ Ver análisis detallado"}
                </button>

                {expandedPrediction === pred.id && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 bg-gray-800/50 rounded-lg">
                      <p className="text-xs text-gray-400 mb-1">Goles Esperados</p>
                      <p className="text-sm text-white font-medium">{pred.expected_home_goals.toFixed(1)} - {pred.expected_away_goals.toFixed(1)}</p>
                    </div>
                    <div className="p-3 bg-gray-800/50 rounded-lg">
                      <p className="text-xs text-gray-400 mb-1">Forma del Equipo</p>
                      <p className="text-sm text-white font-medium">{typeof pred.factor_form === "string" ? pred.factor_form : JSON.stringify(pred.factor_form).substring(0, 30)}</p>
                    </div>
                    <div className="p-3 bg-gray-800/50 rounded-lg">
                      <p className="text-xs text-gray-400 mb-1">Historial</p>
                      <p className="text-sm text-white font-medium">{typeof pred.factor_history === "string" ? pred.factor_history : JSON.stringify(pred.factor_history).substring(0, 30)}</p>
                    </div>
                    <div className="p-3 bg-gray-800/50 rounded-lg">
                      <p className="text-xs text-gray-400 mb-1">Contexto</p>
                      <p className="text-sm text-white font-medium">{typeof pred.factor_context === "string" ? pred.factor_context : JSON.stringify(pred.factor_context).substring(0, 30)}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {fixtures.length === 0 && !loading && (
        <Card padding="lg">
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No hay partidos disponibles para esta jornada</p>
            <p className="text-gray-500 text-sm mt-2">Haz click en &quot;Generar Predicciones&quot; para comenzar</p>
          </div>
        </Card>
      )}
    </div>
  );
}
