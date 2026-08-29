// =============================================
// DASHBOARD PRINCIPAL
// =============================================
// Esta es la página principal del dashboard.
// Muestra un resumen de actividad reciente y acceso rápido a los módulos.
//
// ¿Qué muestra?
// - Tarjetas con resumen de cada módulo
// - Accesos rápidos a ligas y loterías
// - Estado del sistema

import Link from "next/link";

/**
 * Página principal del dashboard.
 */
export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* ============================================= */}
      {/* TÍTULO Y DESCRIPCIÓN */}
      {/* ============================================= */}
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-2">
          Bienvenido al sistema de pronósticos deportivos y análisis de lotería.
        </p>
      </div>

      {/* ============================================= */}
      {/* TARJETAS DE MÓDULOS */}
      {/* ============================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Deportes */}
        <Link
          href="/deportes"
          className="p-6 bg-gray-800 border border-gray-700 rounded-xl hover:border-blue-500 transition-all group"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center group-hover:bg-blue-600/30 transition-colors">
              <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Deportes</h3>
              <p className="text-sm text-gray-400">Pronósticos de fútbol</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Ligas disponibles</span>
              <span className="text-white font-medium">2</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-blue-600/20 text-blue-400 text-xs rounded">Liga MX</span>
              <span className="px-2 py-1 bg-blue-600/20 text-blue-400 text-xs rounded">La Liga</span>
            </div>
          </div>
        </Link>

        {/* Lotería */}
        <Link
          href="/loteria"
          className="p-6 bg-gray-800 border border-gray-700 rounded-xl hover:border-green-500 transition-all group"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center group-hover:bg-green-600/30 transition-colors">
              <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Lotería</h3>
              <p className="text-sm text-gray-400">Análisis estadístico</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Loterías disponibles</span>
              <span className="text-white font-medium">3</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-green-600/20 text-green-400 text-xs rounded">Melate</span>
              <span className="px-2 py-1 bg-green-600/20 text-green-400 text-xs rounded">Revancha</span>
              <span className="px-2 py-1 bg-green-600/20 text-green-400 text-xs rounded">Super Lotto</span>
            </div>
          </div>
        </Link>

        {/* Predicciones */}
        <Link
          href="/predicciones"
          className="p-6 bg-gray-800 border border-gray-700 rounded-xl hover:border-purple-500 transition-all group"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center group-hover:bg-purple-600/30 transition-colors">
              <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Predicciones</h3>
              <p className="text-sm text-gray-400">Historial y métricas</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Total predicciones</span>
              <span className="text-white font-medium">0</span>
            </div>
            <p className="text-xs text-gray-500">
              Las predicciones aparecerán aquí después de ejecutar el modelo.
            </p>
          </div>
        </Link>
      </div>

      {/* ============================================= */}
      {/* ESTADO DEL SISTEMA */}
      {/* ============================================= */}
      <div className="p-6 bg-gray-800 border border-gray-700 rounded-xl">
        <h3 className="text-lg font-semibold text-white mb-4">Estado del Sistema</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-400">API-Football</p>
            <p className="text-sm text-green-400 font-medium">Configurada</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Supabase</p>
            <p className="text-sm text-yellow-400 font-medium">Pendiente schema</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">ML Service</p>
            <p className="text-sm text-gray-500 font-medium">No desplegado</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Base de datos</p>
            <p className="text-sm text-yellow-400 font-medium">Pendiente</p>
          </div>
        </div>
      </div>
    </div>
  );
}
