// =============================================
// LAYOUT RAÍZ DE LA APLICACIÓN
// =============================================
// Este es el layout principal que envuelve TODA la aplicación.
// Se aplica a cada página del proyecto.
//
// ¿Qué contiene?
// - Configuración de fuentes (Geist Sans y Mono)
// - Metadatos SEO (título, descripción)
// - Estructura HTML base (lang="es")
//
// ¿Por qué separar el layout?
// - Permite layouts anidados (dashboard tiene su propio layout).
// - Los metadatos se heredan y pueden ser sobreescritos por página.
// - La configuración global va aquí (fuentes, temas, etc.).

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Configuración de las fuentes de Google Fonts.
// "variable" crea una variable CSS que podemos usar en Tailwind.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Metadatos SEO que aparecen en la pestaña del navegador y en buscadores.
export const metadata: Metadata = {
  title: "Pronosticador de Apuestas | Deportes y Lotería",
  description:
    "Sistema profesional de pronósticos deportivos y análisis estadístico de loterías mexicanas",
};

/**
 * Layout raíz de la aplicación.
 * Envuelve todas las páginas con la estructura HTML base.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
