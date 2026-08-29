// =============================================
// VALIDACIÓN DE VARIABLES DE ENTORNO
// =============================================

function getEnv(name: string, required: boolean = true): string {
  const value = process.env[name];
  if (!value && required && typeof window === "undefined") {
    // Solo warn en server, no throw (Vercel build puede no tener todas)
    console.warn(`[env] Variable no definida: ${name}`);
  }
  return value || "";
}

export const env = {
  SUPABASE_URL: getEnv("NEXT_PUBLIC_SUPABASE_URL"),
  SUPABASE_ANON_KEY: getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  RAPIDAPI_KEY: getEnv("RAPIDAPI_KEY", false),
  API_FOOTBALL_BASE_URL: getEnv("API_FOOTBALL_BASE_URL", false),
  ML_SERVICE_URL: getEnv("ML_SERVICE_URL", false) || "http://localhost:8000",
};
