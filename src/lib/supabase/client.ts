// =============================================
// CLIENTE DE SUPABASE PARA BROWSER (Client Components)
// =============================================
// Este archivo crea un cliente de Supabase optimizado para uso en componentes
// del lado del cliente (aquellos con "use client").
// Se usa para consultas directas a la base de datos desde el navegador.
// Las operaciones de autenticación también usan este cliente.

import { createBrowserClient } from "@supabase/ssr";

/**
 * Crea un cliente de Supabase para uso en el navegador.
 * Utiliza las variables de entorno públicas para la URL y la clave anónima.
 * La clave anónima es segura para exponer al cliente porque RLS (Row Level Security)
 * protege los datos en la base de datos.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
