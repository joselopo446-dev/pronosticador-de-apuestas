"use client";

import { useEffect, useState } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 px-4">
      <div className="w-full max-w-md text-center">
        <div className="bg-gray-800 border border-red-500/50 rounded-xl p-8 shadow-lg">
          <div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-red-400 text-2xl">!</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Algo salió mal</h1>
          <p className="text-gray-400 mb-4 text-sm">
            {error.message || "Ocurrió un error inesperado"}
          </p>
          <button
            onClick={reset}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    </div>
  );
}
