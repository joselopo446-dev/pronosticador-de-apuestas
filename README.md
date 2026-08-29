# Pronosticador de Apuestas

Plataforma web profesional de pronósticos deportivos y análisis estadístico de loterías mexicanas.

## Funcionalidades

### Deportes
- **Liga MX** y **La Liga** con datos en tiempo real (API-Football)
- Clasificaciones, resultados y próximos fixtures
- Pronósticos de partidos con modelo de Poisson
- Probabilidades 1X2, goles esperados, marcador más probable
- Over/Under 2.5, Ambos Anotan (BTTS)
- Explicación detallada de factores de cada predicción

### Loterías
- **Melate**, **Revancha** y **Super Lotto**
- Análisis de frecuencias absolutas y relativas
- Números calientes y fríos
- Análisis de co-ocurrencia (qué números salen juntos)
- Recomendaciones basadas en frecuencia histórica

## Arquitectura

| Capa | Tecnología | Despliegue |
|------|------------|------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS | Vercel |
| ML Service | FastAPI, Python 3.11, NumPy | Fly.io |
| Base de datos | PostgreSQL (Supabase) | Supabase Cloud |
| Auth | Supabase Auth | Integrado |

## Estructura del proyecto

```
pronosticador-de-apuestas/
├── src/
│   ├── app/                  # App Router
│   │   ├── (auth)/           # Login, Register
│   │   ├── (dashboard)/      # Páginas principales
│   │   │   ├── deportes/     # Liga MX, La Liga
│   │   │   ├── loteria/     # Melate, Revancha, Super Lotto
│   │   │   └── predicciones/ # Generador de predicciones
│   │   └── api/              # API routes
│   ├── components/           # Componentes React compartidos
│   ├── config/               # Configuración (equipos, etc.)
│   ├── lib/                  # Lógica de negocio
│   │   ├── models/           # Modelos ML (Poisson)
│   │   ├── supabase/         # Clientes Supabase
│   │   └── api-football.ts   # Adaptador API-Football
│   └── types/                # Tipos TypeScript
├── ml-service/               # FastAPI service
├── database/                 # Schema SQL + seed
├── scripts/                  # Scripts de setup
└── .env.local                # Variables de entorno
```

## Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno (ver abajo)
cp .env.example .env.local

# Ejecutar en desarrollo
npm run dev
```

## Variables de entorno

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key

# API-Football (vía RapidAPI)
RAPIDAPI_KEY=tu-rapidapi-key
NEXT_PUBLIC_API_FOOTBALL_BASE_URL=https://api-football-v1.p.rapidapi.com/v3

# ML Service
NEXT_PUBLIC_ML_SERVICE_URL=https://pronosticador-ml.fly.dev
```

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Iniciar producción |
| `npm run lint` | Verificar código |
| `npm run test` | Ejecutar tests |
| `npm run test:watch` | Tests en watch mode |

## Despliegue

### Vercel (Frontend)
```bash
vercel deploy --prod
```

### Fly.io (ML Service)
```bash
cd ml-service
fly deploy
```

### Base de datos (Supabase)
```bash
node scripts/setup-db.js
```

## API del ML Service

### Predicción de fútbol
```bash
POST https://pronosticador-ml.fly.dev/api/v1/predict
{
  "home_team_attack": 1.2,
  "home_team_defense": 1.0,
  "away_team_attack": 1.0,
  "away_team_defense": 1.2
}
```

### Generación de lotería
```bash
POST https://pronosticador-ml.fly.dev/api/v1/lottery/generate
{
  "min_number": 1,
  "max_number": 56
}
```

### Health check
```bash
GET https://pronosticador-ml.fly.dev/api/v1/health
```

## Stack técnico

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS, Recharts
- **Backend:** Supabase (PostgreSQL + Auth + Realtime)
- **ML:** FastAPI, NumPy, Poisson Distribution
- **Deploy:** Vercel, Fly.io, Supabase Cloud
- **Testing:** Vitest (23 tests)

## Licencia

Proyecto privado.
