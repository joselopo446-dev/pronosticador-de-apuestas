// =============================================
// LÓGICA DEL MIDDLEWARE DE SUPABASE
// =============================================

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Si no hay credenciales, dejar pasar sin auth
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("[middleware] Supabase env vars not configured");
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { pathname } = request.nextUrl;
    const isAuthPage = pathname === "/login" || pathname === "/register";
    const isDashboard =
      pathname.startsWith("/deportes") ||
      pathname.startsWith("/loteria") ||
      pathname.startsWith("/predicciones") ||
      pathname.startsWith("/analytics") ||
      pathname.startsWith("/historial");

    if (!user && isDashboard) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    if (user && isAuthPage) {
      const url = request.nextUrl.clone();
      url.pathname = "/deportes";
      return NextResponse.redirect(url);
    }
  } catch (error) {
    console.error("[middleware] Auth error:", error);
  }

  return supabaseResponse;
}
