// =============================================
// UTILIDADES GENERALES DEL PROYECTO
// =============================================
// Funciones helper que se usan en múltiples partes de la aplicación.
// Centralizar aquí evita duplicar lógica.

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina clases de Tailwind CSS de forma segura.
 * Resuelve conflictos de clases (ej: "p-4 p-8" → "p-8").
 *
 * Ejemplo:
 *   cn("text-red-500", isActive && "text-blue-500", className)
 *   // Resultado: "text-blue-500" (la última clase gana)
 *
 * ¿Por qué esta función?
 * - Tailwind tiene clases que se contradicen.
 * - Sin esto, tendríamos estilos inesperados.
 * - clsx maneja clases condicionales, twMerge resuelve conflictos.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formatea una fecha ISO a formato legible en español mexicano.
 *
 * @param date - Fecha en formato ISO (YYYY-MM-DD o ISO string)
 * @returns Fecha formateada (ej: "27 de agosto de 2026")
 *
 * Ejemplo:
 *   formatDate("2026-08-27") → "27 de agosto de 2026"
 */
export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Formatea una hora ISO a formato de 12 horas en español.
 *
 * @param time - Hora en formato ISO (HH:MM:SS)
 * @returns Hora formateada (ej: "9:15 p.m.")
 *
 * Ejemplo:
 *   formatTime("21:15:00") → "9:15 p.m."
 */
export function formatTime(time: string): string {
  return new Date(`2000-01-01T${time}`).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Formatea un decimal como porcentaje legible.
 *
 * @param value - Valor decimal (0.45 = 45%)
 * @returns Porcentaje formateado (ej: "45.0%")
 *
 * Ejemplo:
 *   formatPercent(0.4523) → "45.2%"
 */
export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

/**
 * Obtiene el color de fondo de acuerdo al resultado de un partido.
 * Se usa en la "forma" reciente de los equipos (W=verde, D=amarillo, L=rojo).
 *
 * @param result - Letra del resultado: W (Win), D (Draw), L (Lose)
 * @returns Clase de Tailwind CSS para el color de fondo
 *
 * Ejemplo:
 *   getFormColor("W") → "bg-green-500"
 *   getFormColor("D") → "bg-yellow-500"
 *   getFormColor("L") → "bg-red-500"
 */
export function getFormColor(result: string): string {
  switch (result.toUpperCase()) {
    case "W":
      return "bg-green-500";
    case "D":
      return "bg-yellow-500";
    case "L":
      return "bg-red-500";
    default:
      return "bg-gray-300";
  }
}

/**
 * Obtiene el color de texto de acuerdo al resultado de un partido.
 *
 * @param result - Letra del resultado: W, D, L
 * @returns Clase de Tailwind CSS para el color de texto
 */
export function getFormTextColor(result: string): string {
  switch (result.toUpperCase()) {
    case "W":
      return "text-green-600";
    case "D":
      return "text-yellow-600";
    case "L":
      return "text-red-600";
    default:
      return "text-gray-500";
  }
}

/**
 * Trunca un texto a una longitud máxima y agrega "..." si es necesario.
 *
 * @param text - Texto a truncar
 * @param maxLength - Longitud máxima
 * @returns Texto truncado
 *
 * Ejemplo:
 *   truncate("Real Madrid Club de Fútbol", 15) → "Real Madrid Cl..."
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}
