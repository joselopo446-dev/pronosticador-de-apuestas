// =============================================
// PÁGINA — PRONÓSTICOS DE LOTERÍA
// =============================================
// Muestra predicciones generadas automáticamente y su historial de aciertos.

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import ActionButtons from "./ActionButtons";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const LOTTERY_IDS: Record<string, string> = {
  melate: "f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66",
  revancha: "a6eebc99-9c0b-4ef8-bb6d-6bb9bd380a77",
  "super-lotto": "b7eebc99-9c0b-4ef8-bb6d-6bb9bd380a88",
};

const LOTTERY_NAMES: Record<string, string> = {
  melate: "Melate",
  revancha: "Revancha",
  "super-lotto": "Super Lotto",
};

const LOTTERY_COLORS: Record<string, string> = {
  melate: "purple",
  revancha: "pink",
  "super-lotto": "yellow",
};

export const revalidate = 300;

export default async function PronosticosPage() {
  const allPredictions: Record<string, any[]> = {
    melate: [],
    revancha: [],
    "super-lotto": [],
  };

  const allStats: Record<string, { total: number; checked: number; wins: number; avgMatch: number }> = {
    melate: { total: 0, checked: 0, wins: 0, avgMatch: 0 },
    revancha: { total: 0, checked: 0, wins: 0, avgMatch: 0 },
    "super-lotto": { total: 0, checked: 0, wins: 0, avgMatch: 0 },
  };

  for (const [slug, lotteryId] of Object.entries(LOTTERY_IDS)) {
    const { data: pending } = await supabase
      .from("lottery_predictions")
      .select("*")
      .eq("lottery_id", lotteryId)
      .eq("status", "pending")
      .order("draw_date", { ascending: true })
      .limit(10);

    allPredictions[slug] = pending || [];

    const { data: allPreds } = await supabase
      .from("lottery_predictions")
      .select("matched_numbers, status")
      .eq("lottery_id", lotteryId);

    if (allPreds && allPreds.length > 0) {
      const checked = allPreds.filter(p => p.status !== "pending");
      const wins = allPreds.filter(p => p.status === "won");
      const totalMatch = checked.reduce((sum, p) => sum + (p.matched_numbers || 0), 0);

      allStats[slug] = {
        total: allPreds.length,
        checked: checked.length,
        wins: wins.length,
        avgMatch: checked.length > 0 ? Math.round((totalMatch / checked.length) * 10) / 10 : 0,
      };
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Pronósticos</h1>
          <p className="text-gray-400 mt-2">
            Predicciones automáticas generadas 1 día antes de cada sorteo.
          </p>
        </div>
        <ActionButtons />
      </div>

      {/* Stats generales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(LOTTERY_NAMES).map(([slug, name]) => {
          const stats = allStats[slug];
          const color = LOTTERY_COLORS[slug];
          const colorClass = color === "purple" ? "bg-purple-600" : color === "pink" ? "bg-pink-600" : "bg-yellow-600";
          const borderClass = color === "purple" ? "border-purple-500/30" : color === "pink" ? "border-pink-500/30" : "border-yellow-500/30";
          const textClass = color === "purple" ? "text-purple-400" : color === "pink" ? "text-pink-400" : "text-yellow-400";

          return (
            <div key={slug} className={`bg-gray-800 border ${borderClass} rounded-xl p-6`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 ${colorClass} rounded-full flex items-center justify-center`}>
                  <span className="text-white font-bold">{name[0]}</span>
                </div>
                <h2 className="text-lg font-bold text-white">{name}</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                  <p className="text-xs text-gray-400">Predicciones</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-400">{stats.checked}</p>
                  <p className="text-xs text-gray-400">Verificadas</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-400">{stats.wins}</p>
                  <p className="text-xs text-gray-400">Ganadoras</p>
                </div>
                <div className="text-center">
                  <p className={`text-2xl font-bold ${textClass}`}>{stats.avgMatch}</p>
                  <p className="text-xs text-gray-400">Prom. aciertos</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Predicciones por lotería */}
      {Object.entries(LOTTERY_NAMES).map(([slug, name]) => {
        const predictions = allPredictions[slug];
        const color = LOTTERY_COLORS[slug];
        const colorClass = color === "purple" ? "bg-purple-600" : color === "pink" ? "bg-pink-600" : "bg-yellow-600";
        const borderClass = color === "purple" ? "border-purple-500/30" : color === "pink" ? "border-pink-500/30" : "border-yellow-500/30";

        return (
          <div key={slug} className={`bg-gray-800 border ${borderClass} rounded-xl p-6`}>
            <h2 className="text-xl font-bold text-white mb-4">
              Próximos Pronósticos — {name}
            </h2>

            {predictions.length === 0 ? (
              <p className="text-gray-400 text-center py-8">
                No hay predicciones pendientes. Haz clic en &quot;Generar Predicciones&quot;.
              </p>
            ) : (
              <div className="space-y-4">
                {predictions.map((pred) => (
                  <div key={pred.id} className="bg-gray-700/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="text-white font-medium">Sorteo #{pred.draw_number}</span>
                        <span className="text-gray-400 ml-2">
                          {new Date(pred.draw_date + "T12:00:00").toLocaleDateString("es-MX", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 bg-gray-600 px-2 py-1 rounded">
                          {pred.strategy}
                        </span>
                        <span className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded">
                          {Math.round(pred.confidence * 100)}% confianza
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {pred.predicted_numbers.map((num: number, i: number) => (
                        <div
                          key={i}
                          className={`w-10 h-10 ${colorClass} rounded-full flex items-center justify-center`}
                        >
                          <span className="text-white font-bold text-sm">{num}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Link
              href={`/loteria/${slug}`}
              className={`block w-full mt-4 py-2 ${colorClass} text-white text-center rounded-lg hover:opacity-90 transition-colors`}
            >
              Ver Análisis de {name}
            </Link>
          </div>
        );
      })}

      {/* Cómo funciona */}
      <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-xl">
        <h3 className="text-lg font-semibold text-white mb-4">
          Cómo Funcionan los Pronósticos
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-400">
          <div>
            <p className="text-white font-medium mb-1">1. Generación Automática</p>
            <p>Se crean 2 predicciones por sorteo usando 4 estrategias: ensemble, caliente, atrasado, balanceado.</p>
          </div>
          <div>
            <p className="text-white font-medium mb-1">2. Verificación</p>
            <p>Después de cada sorteo, se comparan las predicciones con los resultados reales.</p>
          </div>
          <div>
            <p className="text-white font-medium mb-1">3. Mejora Continua</p>
            <p>El sistema aprende de aciertos/fallos y ajusta las estrategias para próximos pronósticos.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
