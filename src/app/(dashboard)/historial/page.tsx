"use client";

import { useEffect, useState } from "react";

interface Prediction {
  id: string;
  created_at: string;
  model_used: string;
  home_team_id: number;
  away_team_id: number;
  home_win_prob: number;
  draw_prob: number;
  away_win_prob: number;
  expected_home_goals: number;
  expected_away_goals: number;
  predicted_score_home: number;
  predicted_score_away: number;
  over25_prob: number;
  btts_yes_prob: number;
}

export default function HistorialPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/predictions?limit=${limit}&offset=${page * limit}`)
      .then((res) => res.json())
      .then((data) => {
        setPredictions(data.predictions || []);
        setTotal(data.total || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [page]);

  const totalPages = Math.ceil(total / limit);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Historial de Predicciones</h1>
        <p className="text-gray-400 mt-2">
          Todas las predicciones generadas, ordenadas por fecha.
        </p>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        {predictions.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400">No hay predicciones registradas.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700 bg-gray-750">
                    <th className="text-left text-gray-400 p-4">Fecha</th>
                    <th className="text-left text-gray-400 p-4">Modelo</th>
                    <th className="text-center text-gray-400 p-4">Local %</th>
                    <th className="text-center text-gray-400 p-4">Empate %</th>
                    <th className="text-center text-gray-400 p-4">Visitante %</th>
                    <th className="text-center text-gray-400 p-4">Goles Esp.</th>
                    <th className="text-center text-gray-400 p-4">Marcador</th>
                    <th className="text-center text-gray-400 p-4">Over 2.5</th>
                    <th className="text-center text-gray-400 p-4">BTTS</th>
                  </tr>
                </thead>
                <tbody>
                  {predictions.map((p) => (
                    <tr key={p.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                      <td className="p-4 text-gray-300">
                        {new Date(p.created_at).toLocaleDateString("es-MX", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="p-4">
                        <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded">
                          {p.model_used}
                        </span>
                      </td>
                      <td className="p-4 text-center text-green-400 font-medium">
                        {(p.home_win_prob * 100).toFixed(1)}%
                      </td>
                      <td className="p-4 text-center text-yellow-400 font-medium">
                        {(p.draw_prob * 100).toFixed(1)}%
                      </td>
                      <td className="p-4 text-center text-red-400 font-medium">
                        {(p.away_win_prob * 100).toFixed(1)}%
                      </td>
                      <td className="p-4 text-center text-gray-300">
                        {p.expected_home_goals.toFixed(1)} - {p.expected_away_goals.toFixed(1)}
                      </td>
                      <td className="p-4 text-center text-white font-mono font-bold">
                        {p.predicted_score_home} - {p.predicted_score_away}
                      </td>
                      <td className="p-4 text-center text-gray-300">
                        {(p.over25_prob * 100).toFixed(0)}%
                      </td>
                      <td className="p-4 text-center text-gray-300">
                        {(p.btts_yes_prob * 100).toFixed(0)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between p-4 border-t border-gray-700">
              <p className="text-sm text-gray-400">
                Mostrando {page * limit + 1} - {Math.min((page + 1) * limit, total)} de {total}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1 text-sm bg-gray-700 text-gray-300 rounded hover:bg-gray-600 disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1 text-sm bg-gray-700 text-gray-300 rounded hover:bg-gray-600 disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
