// =============================================
// VALIDACIÓN DE VARIABLES DE ENTORNO
// =============================================
// Centraliza la validación de env vars con mensajes claros.

function getEnv(name: string, required: boolean = true): string {
  const value = process.env[name];
  if (!value && required) {
    throw new Error(`Variable de entorno requerida no definida: ${name}`);
  }
  return value || "";
}

export const env = {
  SUPABASE_URL: getEnv("NEXT_PUBLIC_SUPABASE_URL"),
  SUPABASE_ANON_KEY: getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  RAPIDAPI_KEY: getEnv("RAPIDAPI_KEY"),
  API_FOOTBALL_BASE_URL: getEnv("API_FOOTBALL_BASE_URL"),
  ML_SERVICE_URL: getEnv("ML_SERVICE_URL", false) || "http://localhost:8000",
};
