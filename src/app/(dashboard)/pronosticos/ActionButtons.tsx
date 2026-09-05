"use client";

import { useState } from "react";

export default function ActionButtons() {
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading("generate");
    setMessage(null);
    try {
      const res = await fetch("/api/lottery/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "all" }),
      });
      const data = await res.json();
      if (data.success) {
        const total = Object.values(data.results).reduce(
          (sum: number, r: any) => sum + (r.generated || 0),
          0
        );
        setMessage(`Generadas ${total} predicciones nuevas`);
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setMessage("Error al generar predicciones");
      }
    } catch {
      setMessage("Error de conexión");
    }
    setLoading(null);
  }

  async function handleCheck() {
    setLoading("check");
    setMessage(null);
    try {
      const res = await fetch("/api/lottery/predictions/check", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setMessage(
          `Verificadas ${data.totalChecked} predicciones, ${data.totalWon} ganadoras`
        );
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setMessage("Error al verificar");
      }
    } catch {
      setMessage("Error de conexión");
    }
    setLoading(null);
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleGenerate}
        disabled={loading !== null}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm disabled:opacity-50"
      >
        {loading === "generate" ? "Generando..." : "Generar Predicciones"}
      </button>
      <button
        onClick={handleCheck}
        disabled={loading !== null}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50"
      >
        {loading === "check" ? "Verificando..." : "Verificar Resultados"}
      </button>
      {message && (
        <span className="text-sm text-gray-300 ml-2">{message}</span>
      )}
    </div>
  );
}
