// =============================================
// CLIENTE DE SUPABASE PARA SERVER (Server Components y Server Actions)
// =============================================
// Este archivo crea un cliente de Supabase optimizado para uso en el servidor.
// Se utiliza en Server Components, Server Actions y route handlers.
// Maneja las cookies de sesión automáticamente para mantener al usuario autenticado.

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Crea un cliente de Supabase para uso en el servidor.
 * Lee y escribe cookies para mantener la sesión del usuario.
 * En Server Components, las cookies son de solo lectura.
 * En Server Actions, las cookies pueden ser modificadas.
 */
export async function createClient() {
  // Obtenemos el store de cookies de la request actual.
  // "await" es necesario porque en Next.js 15 las cookies son asincrónicas.
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // "getAll" lee todas las cookies de la request actual.
        // Supabase usa esto para obtener el token de sesión del usuario.
        getAll() {
          return cookieStore.getAll();
        },
        // "setAll" escribe cookies en la response.
        // Se usa para establecer o actualizar tokens de sesión.
        // En Server Components (lectura), esto falla silenciosamente.
        // En Server Actions y Route Handlers, funciona correctamente.
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // El error ocurre en Server Components donde las cookies son de solo lectura.
            // Se puede ignorar porque el middleware se encarga de renovar la sesión.
          }
        },
      },
    }
  );
}
