"use client";

import { useState } from "react";

interface SyncResult {
  melate: { found: number; inserted: number };
  revancha: { found: number; inserted: number };
  "super-lotto": { found: number; inserted: number };
}

export default function SyncButton() {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSync() {
    setSyncing(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch("/api/lottery/sync");
      const data = await response.json();

      if (data.success) {
        setResult(data.results);
      } else {
        setError(data.error || "Error al sincronizar");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={handleSync}
        disabled={syncing}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {syncing ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Sincronizando...
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualizar Sorteos
          </>
        )}
      </button>

      {result && (
        <div className="text-sm text-gray-400">
          <span className="text-green-400">✓</span> Melate: {result.melate.inserted} | Revancha: {result.revancha.inserted} | Super Lotto: {result["super-lotto"].inserted} nuevos
        </div>
      )}

      {error && (
        <div className="text-sm text-red-400">
          <span className="text-red-400">✗</span> {error}
        </div>
      )}
    </div>
  );
}
