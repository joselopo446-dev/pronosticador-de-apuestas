"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";

interface Prediction {
  id: string;
  created_at: string;
  model_used: string;
  home_win_prob: number;
  draw_prob: number;
  away_win_prob: number;
  predicted_score_home: number;
  predicted_score_away: number;
  home_team_id: number;
  away_team_id: number;
}

const COLORS = ["#22c55e", "#eab308", "#ef4444", "#3b82f6"];

export default function AnalyticsPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/predictions?limit=100")
      .then((res) => res.json())
      .then((data) => {
        setPredictions(data.predictions || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Stats
  const totalPredictions = predictions.length;
  const modelCounts = predictions.reduce(
    (acc, p) => {
      acc[p.model_used] = (acc[p.model_used] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const avgHomeWin =
    predictions.length > 0
      ? predictions.reduce((s, p) => s + p.home_win_prob, 0) / predictions.length
      : 0;
  const avgDraw =
    predictions.length > 0
      ? predictions.reduce((s, p) => s + p.draw_prob, 0) / predictions.length
      : 0;
  const avgAwayWin =
    predictions.length > 0
      ? predictions.reduce((s, p) => s + p.away_win_prob, 0) / predictions.length
      : 0;

  // Model distribution for pie chart
  const modelDistribution = Object.entries(modelCounts).map(([name, value]) => ({
    name,
    value,
  }));

  // Probability distribution for bar chart
  const probBuckets = [
    { range: "0-20%", home: 0, draw: 0, away: 0 },
    { range: "20-40%", home: 0, draw: 0, away: 0 },
    { range: "40-60%", home: 0, draw: 0, away: 0 },
    { range: "60-80%", home: 0, draw: 0, away: 0 },
    { range: "80-100%", home: 0, draw: 0, away: 0 },
  ];

  predictions.forEach((p) => {
    const bucket = (v: number) => {
      if (v < 0.2) return 0;
      if (v < 0.4) return 1;
      if (v < 0.6) return 2;
      if (v < 0.8) return 3;
      return 4;
    };
    probBuckets[bucket(p.home_win_prob)].home++;
    probBuckets[bucket(p.draw_prob)].draw++;
    probBuckets[bucket(p.away_win_prob)].away++;
  });

  // Timeline (last 10 predictions)
  const timeline = predictions
    .slice(0, 10)
    .reverse()
    .map((p, i) => ({
      name: `#${i + 1}`,
      local: +(p.home_win_prob * 100).toFixed(1),
      empate: +(p.draw_prob * 100).toFixed(1),
      visitante: +(p.away_win_prob * 100).toFixed(1),
    }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Analytics</h1>
        <p className="text-gray-400 mt-2">
          Rendimiento y estadísticas de las predicciones generadas.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Predicciones", value: totalPredictions, color: "blue" },
          { label: "Promedio Victoria Local", value: `${(avgHomeWin * 100).toFixed(1)}%`, color: "green" },
          { label: "Promedio Empate", value: `${(avgDraw * 100).toFixed(1)}%`, color: "yellow" },
          { label: "Promedio Victoria Visitante", value: `${(avgAwayWin * 100).toFixed(1)}%`, color: "red" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-gray-800 border border-gray-700 rounded-xl p-5">
            <p className="text-sm text-gray-400">{kpi.label}</p>
            <p className={`text-2xl font-bold text-${kpi.color}-400 mt-1`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {totalPredictions === 0 ? (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-12 text-center">
          <p className="text-gray-400 text-lg">No hay predicciones registradas aún.</p>
          <p className="text-gray-500 text-sm mt-2">
            Ve a <span className="text-blue-400">Predicciones</span> para generar tu primera predicción.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Distribución de modelos */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Modelos Utilizados</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={modelDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  >
                    {modelDistribution.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Distribución de probabilidades */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Distribución de Probabilidades</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={probBuckets}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="range" tick={{ fill: "#9ca3af", fontSize: 12 }} />
                  <YAxis tick={{ fill: "#9ca3af", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <Bar dataKey="home" fill="#22c55e" name="Local" />
                  <Bar dataKey="draw" fill="#eab308" name="Empate" />
                  <Bar dataKey="away" fill="#ef4444" name="Visitante" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Últimas 10 Predicciones</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 12 }} />
                <YAxis tick={{ fill: "#9ca3af", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
                  labelStyle={{ color: "#fff" }}
                />
                <Legend />
                <Line type="monotone" dataKey="local" stroke="#22c55e" name="Local %" strokeWidth={2} />
                <Line type="monotone" dataKey="empate" stroke="#eab308" name="Empate %" strokeWidth={2} />
                <Line type="monotone" dataKey="visitante" stroke="#ef4444" name="Visitante %" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Tabla de predicciones recientes */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Historial de Predicciones</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left text-gray-400 pb-3">Fecha</th>
                    <th className="text-left text-gray-400 pb-3">Modelo</th>
                    <th className="text-center text-gray-400 pb-3">Local</th>
                    <th className="text-center text-gray-400 pb-3">Empate</th>
                    <th className="text-center text-gray-400 pb-3">Visitante</th>
                    <th className="text-center text-gray-400 pb-3">Marcador</th>
                  </tr>
                </thead>
                <tbody>
                  {predictions.slice(0, 15).map((p) => (
                    <tr key={p.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                      <td className="py-3 text-gray-300">
                        {new Date(p.created_at).toLocaleDateString("es-MX")}
                      </td>
                      <td className="py-3 text-gray-400">{p.model_used}</td>
                      <td className="py-3 text-center text-green-400">
                        {(p.home_win_prob * 100).toFixed(1)}%
                      </td>
                      <td className="py-3 text-center text-yellow-400">
                        {(p.draw_prob * 100).toFixed(1)}%
                      </td>
                      <td className="py-3 text-center text-red-400">
                        {(p.away_win_prob * 100).toFixed(1)}%
                      </td>
                      <td className="py-3 text-center text-white font-mono">
                        {p.predicted_score_home} - {p.predicted_score_away}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
