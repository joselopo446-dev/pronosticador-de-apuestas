// =============================================
// COMPONENTE COMPARTIDO — VISTA DE LOTERÍA
// =============================================
// Muestra análisis estadístico de una lotería específica.

"use client";

import { useState, useMemo } from "react";
import type { LotteryDraw, NumberFrequency, Cooccurrence } from "@/types/loteria";
import {
  calculateFrequencies,
  calculateCooccurrence,
  findHotNumbers,
  findOverdueNumbers,
} from "@/lib/lottery";

interface LotteryViewProps {
  name: string;
  slug: string;
  color: "purple" | "pink" | "yellow";
  minNumber: number;
  maxNumber: number;
  numbersCount: number;
  draws: LotteryDraw[];
}

const colorClasses = {
  purple: {
    badge: "bg-purple-600",
    text: "text-purple-400",
    border: "border-purple-500/30",
  },
  pink: {
    badge: "bg-pink-600",
    text: "text-pink-400",
    border: "border-pink-500/30",
  },
  yellow: {
    badge: "bg-yellow-600",
    text: "text-yellow-400",
    border: "border-yellow-500/30",
  },
};

export default function LotteryView({
  name,
  slug,
  color,
  minNumber,
  maxNumber,
  numbersCount,
  draws,
}: LotteryViewProps) {
  const [activeTab, setActiveTab] = useState<"frecuencias" | "calientes" | "atrasados" | "coocurrencia">("frecuencias");
  const colors = colorClasses[color];

  const frequencies = useMemo(
    () => calculateFrequencies(draws, minNumber, maxNumber),
    [draws, minNumber, maxNumber]
  );

  const hotNumbers = useMemo(
    () => findHotNumbers(draws, minNumber, maxNumber, 10),
    [draws, minNumber, maxNumber]
  );

  const overdueNumbers = useMemo(
    () => findOverdueNumbers(draws, minNumber, maxNumber, 10),
    [draws, minNumber, maxNumber]
  );

  const cooccurrences = useMemo(
    () => calculateCooccurrence(draws, minNumber, maxNumber),
    [draws, minNumber, maxNumber]
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 ${colors.badge} rounded-full flex items-center justify-center`}>
          <span className="text-white font-bold text-xl">{name[0]}</span>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">{name}</h1>
          <p className="text-gray-400">
            {numbersCount} números del {minNumber}-{maxNumber} — {draws.length} sorteos analizados
          </p>
        </div>
      </div>

      {/* Último sorteo */}
      {draws.length > 0 && (
        <div className={`bg-gray-800 border ${colors.border} rounded-xl p-6`}>
          <h2 className={`text-lg font-semibold ${colors.text} mb-4`}>
            Último Sorteo — {draws[0].drawNumber}
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">
              {new Date(draws[0].drawDate).toLocaleDateString("es-MX", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
          <div className="flex gap-3 mt-4">
            {draws[0].mainNumbers.map((num, i) => (
              <div
                key={i}
                className={`w-12 h-12 ${colors.badge} rounded-full flex items-center justify-center`}
              >
                <span className="text-white font-bold">{num}</span>
              </div>
            ))}
            {draws[0].bonusNumber && (
              <>
                <div className="w-6 h-12 flex items-center justify-center text-gray-500">+</div>
                <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">{draws[0].bonusNumber}</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Tabs de análisis */}
      <div className="flex gap-2 border-b border-gray-700 pb-2">
        {(["frecuencias", "calientes", "atrasados", "coocurrencia"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? `${colors.badge} text-white`
                : "text-gray-400 hover:text-white hover:bg-gray-700"
            }`}
          >
            {tab === "frecuencias" && "Frecuencias"}
            {tab === "calientes" && "Números Calientes"}
            {tab === "atrasados" && "Números Atrasados"}
            {tab === "coocurrencia" && "Coocurrencia"}
          </button>
        ))}
      </div>

      {/* Contenido de tabs */}
      {activeTab === "frecuencias" && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h3 className={`text-lg font-semibold ${colors.text} mb-4`}>
            Frecuencia de Números (Top 20)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {frequencies.slice(0, 20).map((freq) => (
              <div
                key={freq.number}
                className="p-3 bg-gray-700/50 rounded-lg text-center"
              >
                <div className={`text-2xl font-bold ${colors.text}`}>
                  {freq.number}
                </div>
                <div className="text-sm text-gray-400">
                  {freq.absoluteFrequency} veces
                </div>
                <div className="text-xs text-gray-500">
                  {freq.relativeFrequency.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "calientes" && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-red-400 mb-4">
            🔥 Números Calientes (Más frecuentes)
          </h3>
          <div className="space-y-3">
            {hotNumbers.map((freq, i) => (
              <div
                key={freq.number}
                className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 w-6">{i + 1}.</span>
                  <div className={`w-10 h-10 ${colors.badge} rounded-full flex items-center justify-center`}>
                    <span className="text-white font-bold">{freq.number}</span>
                  </div>
                  <div>
                    <span className="text-white font-medium">Número {freq.number}</span>
                    <span className="text-gray-400 text-sm ml-2">
                      {freq.absoluteFrequency} apariciones
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-red-400">
                    {freq.relativeFrequency.toFixed(1)}% frecuencia
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "atrasados" && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-400 mb-4">
            ❄️ Números Atrasados (Overdue)
          </h3>
          <div className="space-y-3">
            {overdueNumbers.map((freq, i) => (
              <div
                key={freq.number}
                className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 w-6">{i + 1}.</span>
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">{freq.number}</span>
                  </div>
                  <div>
                    <span className="text-white font-medium">Número {freq.number}</span>
                    <span className="text-gray-400 text-sm ml-2">
                      {freq.absoluteFrequency} apariciones
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-blue-400">
                    {freq.drawsSinceLast} sorteos sin salir
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "coocurrencia" && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-yellow-400 mb-4">
            🔗 Pares que Más Salen Juntos
          </h3>
          <div className="space-y-3">
            {cooccurrences.slice(0, 10).map((co, i) => (
              <div
                key={`${co.numberA}-${co.numberB}`}
                className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 w-6">{i + 1}.</span>
                  <div className="flex gap-2">
                    <div className={`w-10 h-10 ${colors.badge} rounded-full flex items-center justify-center`}>
                      <span className="text-white font-bold">{co.numberA}</span>
                    </div>
                    <div className={`w-10 h-10 ${colors.badge} rounded-full flex items-center justify-center`}>
                      <span className="text-white font-bold">{co.numberB}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-white">
                    {co.cooccurrenceCount} veces juntos
                  </div>
                  <div className="text-xs text-gray-400">
                    {(co.cooccurrenceRate * 100).toFixed(1)}% de sorteos
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historial reciente */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Historial Reciente
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 text-gray-400">
                <th className="px-4 py-3 text-left">Sorteo</th>
                <th className="px-4 py-3 text-left">Fecha</th>
                <th className="px-4 py-3 text-left">Números</th>
                {draws[0]?.bonusNumber && (
                  <th className="px-4 py-3 text-left">Adicional</th>
                )}
              </tr>
            </thead>
            <tbody>
              {draws.map((draw) => (
                <tr
                  key={draw.id}
                  className="border-b border-gray-700/50 hover:bg-gray-700/30"
                >
                  <td className="px-4 py-3 text-white font-medium">
                    #{draw.drawNumber}
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {new Date(draw.drawDate).toLocaleDateString("es-MX")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {draw.mainNumbers.map((num, i) => (
                        <span
                          key={i}
                          className={`w-7 h-7 ${colors.badge} rounded-full flex items-center justify-center text-xs text-white font-bold`}
                        >
                          {num}
                        </span>
                      ))}
                    </div>
                  </td>
                  {draw.bonusNumber && (
                    <td className="px-4 py-3">
                      <span className="w-7 h-7 bg-gray-600 rounded-full flex items-center justify-center text-xs text-white font-bold">
                        {draw.bonusNumber}
                      </span>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
