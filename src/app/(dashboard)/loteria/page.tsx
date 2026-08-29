// =============================================
// MÓDULO DE LOTERÍA — PÁGINA PRINCIPAL
// =============================================
// Muestra las loterías disponibles con sus últimos sorteos.

import Link from "next/link";
import { getLotteryHistory } from "@/lib/lottery";

export default function LoteriaPage() {
  const melateDraws = getLotteryHistory("melate");
  const revanchaDraws = getLotteryHistory("revancha");
  const superLottoDraws = getLotteryHistory("super-lotto");

  const lotteries = [
    {
      name: "Melate",
      slug: "melate",
      color: "purple",
      icon: "M",
      days: "Mié, Vie, Dom",
      mainNumbers: "6 del 1-56",
      bonus: "1 del 1-56",
      probability: "1 en 32,468,436",
      draws: melateDraws,
    },
    {
      name: "Revancha",
      slug: "revancha",
      color: "pink",
      icon: "R",
      days: "Mié, Vie, Dom",
      mainNumbers: "6 del 1-56",
      bonus: "No",
      probability: "Misma que Melate",
      draws: revanchaDraws,
    },
    {
      name: "Super Lotto",
      slug: "super-lotto",
      color: "yellow",
      icon: "S",
      days: "Mar, Jue, Sáb",
      mainNumbers: "6 del 1-45",
      bonus: "No",
      probability: "1 en 8,145,060",
      draws: superLottoDraws,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Lotería</h1>
        <p className="text-gray-400 mt-2">
          Análisis estadístico de loterías mexicanas.
        </p>
      </div>

      {/* ============================================= */}
      {/* LOTERÍAS DISPONIBLES */}
      {/* ============================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {lotteries.map((lottery) => {
          const lastDraw = lottery.draws[0];
          const colorClass =
            lottery.color === "purple"
              ? "bg-purple-600"
              : lottery.color === "pink"
              ? "bg-pink-600"
              : "bg-yellow-600";
          const hoverClass =
            lottery.color === "purple"
              ? "hover:bg-purple-700"
              : lottery.color === "pink"
              ? "hover:bg-pink-700"
              : "hover:bg-yellow-700";
          const borderClass =
            lottery.color === "purple"
              ? "border-purple-500/30"
              : lottery.color === "pink"
              ? "border-pink-500/30"
              : "border-yellow-500/30";

          return (
            <div
              key={lottery.slug}
              className={`p-6 bg-gray-800 border border-gray-700 rounded-xl hover:${borderClass} transition-colors`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-12 h-12 ${colorClass} rounded-full flex items-center justify-center`}
                >
                  <span className="text-white font-bold">{lottery.icon}</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {lottery.name}
                  </h2>
                  <p className="text-sm text-gray-400">{lottery.days}</p>
                </div>
              </div>

              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Números principales</span>
                  <span className="text-white">{lottery.mainNumbers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Adicional</span>
                  <span className="text-white">{lottery.bonus}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Probabilidad jackpot</span>
                  <span className="text-white">{lottery.probability}</span>
                </div>
              </div>

              {/* Último sorteo */}
              {lastDraw && (
                <div className="mb-4 p-3 bg-gray-700/50 rounded-lg">
                  <p className="text-xs text-gray-400 mb-2">
                    Último sorteo #{lastDraw.drawNumber}
                  </p>
                  <div className="flex gap-2">
                    {lastDraw.mainNumbers.map((num, i) => (
                      <div
                        key={i}
                        className={`w-8 h-8 ${colorClass} rounded-full flex items-center justify-center`}
                      >
                        <span className="text-white text-xs font-bold">
                          {num}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Link
                href={`/loteria/${lottery.slug}`}
                className={`block w-full py-2 ${colorClass} text-white text-center rounded-lg ${hoverClass} transition-colors`}
              >
                Analizar {lottery.name}
              </Link>
            </div>
          );
        })}
      </div>

      {/* ============================================= */}
      {/* FUNCIONALIDADES */}
      {/* ============================================= */}
      <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-xl">
        <h3 className="text-lg font-semibold text-white mb-4">
          Funcionalidades del Análisis
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <span className="text-green-400 mt-1">✓</span>
            <div>
              <p className="text-white font-medium">Frecuencias</p>
              <p className="text-sm text-gray-400">
                Números calientes, fríos y atrasados
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-green-400 mt-1">✓</span>
            <div>
              <p className="text-white font-medium">Coocurrencia</p>
              <p className="text-sm text-gray-400">
                Pares y tríos que más salen juntos
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-yellow-400 mt-1">○</span>
            <div>
              <p className="text-white font-medium">Generador</p>
              <p className="text-sm text-gray-400">
                Combinaciones por estrategia estadística
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-yellow-400 mt-1">○</span>
            <div>
              <p className="text-white font-medium">Backtesting</p>
              <p className="text-sm text-gray-400">
                Validar estrategias con datos históricos
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
