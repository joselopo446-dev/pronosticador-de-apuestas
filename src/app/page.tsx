// =============================================
// LANDING PAGE — PÁGINA DE INICIO
// =============================================
// Esta es la primera página que ve el usuario.
// Presenta el sistema y ofrece acceso a los módulos principales.
//
// ¿Qué muestra?
// - Título del sistema
// - Descripción breve
// - Links a Deportes, Lotería, y Dashboard
// - Diseño limpio y profesional
//
// NOTA: Esta página es pública (no requiere autenticación).

import Link from "next/link";

/**
 * Página principal de presentación del sistema.
 */
export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* ============================================= */}
      {/* HEADER / NAVEGACIÓN */}
      {/* ============================================= */}
      <header className="border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo / Icono */}
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <h1 className="text-xl font-bold text-white">
              Pronosticador
            </h1>
          </div>

          {/* Navegación */}
          <nav className="flex items-center gap-6">
            <Link
              href="/deportes"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Deportes
            </Link>
            <Link
              href="/loteria"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Lotería
            </Link>
            <Link
              href="/predicciones"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Predicciones
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Iniciar Sesión
            </Link>
          </nav>
        </div>
      </header>

      {/* ============================================= */}
      {/* CONTENIDO PRINCIPAL */}
      {/* ============================================= */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        {/* Título principal */}
        <div className="text-center max-w-3xl">
          <h2 className="text-5xl font-bold text-white mb-6">
            Pronósticos Deportivos
            <span className="block text-blue-400 mt-2">y Análisis de Lotería</span>
          </h2>
          <p className="text-xl text-gray-400 mb-10">
            Sistema profesional que utiliza modelos estadísticos y machine learning
            para analizar partidos de fútbol y loterías mexicanas.
          </p>
        </div>

        {/* Tarjetas de módulos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full mt-8">
          {/* Módulo Deportes */}
          <Link
            href="/deportes"
            className="group p-8 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-blue-500 hover:bg-gray-800 transition-all"
          >
            <div className="w-14 h-14 bg-blue-600/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-600/30 transition-colors">
              <svg
                className="w-7 h-7 text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Pronósticos Deportivos
            </h3>
            <p className="text-gray-400">
              Liga MX y La Liga. Modelo Poisson, análisis H2H, forma actual,
              y predicciones explicables.
            </p>
          </Link>

          {/* Módulo Lotería */}
          <Link
            href="/loteria"
            className="group p-8 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-green-500 hover:bg-gray-800 transition-all"
          >
            <div className="w-14 h-14 bg-green-600/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-600/30 transition-colors">
              <svg
                className="w-7 h-7 text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Análisis de Lotería
            </h3>
            <p className="text-gray-400">
              Melate, Revancha y Super Lotto. Frecuencias, coocurrencia,
              números atrasados, y generador de combinaciones.
            </p>
          </Link>

          {/* Módulo Predicciones */}
          <Link
            href="/predicciones"
            className="group p-8 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-purple-500 hover:bg-gray-800 transition-all"
          >
            <div className="w-14 h-14 bg-purple-600/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-600/30 transition-colors">
              <svg
                className="w-7 h-7 text-purple-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Historial de Predicciones
            </h3>
            <p className="text-gray-400">
              Revisa el rendimiento de los modelos, backtesting, métricas
              de evaluación, y comparativa contra resultados reales.
            </p>
          </Link>
        </div>

        {/* Información adicional */}
        <div className="mt-16 text-center">
          <p className="text-gray-500 text-sm">
            Utiliza modelos estadísticos avanzados. Los pronósticos son estimaciones,
            no garantías. Juega responsablemente.
          </p>
        </div>
      </main>

      {/* ============================================= */}
      {/* FOOTER */}
      {/* ============================================= */}
      <footer className="border-t border-gray-700/50 py-6">
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-500 text-sm">
          <p>
            Pronosticador de Apuestas — Sistema de análisis estadístico deportivo
            y de loterías.
          </p>
          <p className="mt-1">
            Datos proporcionados por API-Football. Loterías: Lotería Nacional de México.
          </p>
        </div>
      </footer>
    </div>
  );
}
