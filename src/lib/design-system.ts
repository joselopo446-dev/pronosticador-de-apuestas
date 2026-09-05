// =============================================
// SISTEMA DE DISEÑO — PRONOSTICADOR
// =============================================
// Design tokens y utilidades para UI profesional

export const designSystem = {
  // Colores principales
  colors: {
    // Brand
    primary: {
      50: "#eff6ff",
      100: "#dbeafe",
      200: "#bfdbfe",
      300: "#93c5fd",
      400: "#60a5fa",
      500: "#3b82f6",
      600: "#2563eb",
      700: "#1d4ed8",
      800: "#1e40af",
      900: "#1e3a8a",
    },
    // Success
    success: {
      50: "#f0fdf4",
      100: "#dcfce7",
      200: "#bbf7d0",
      300: "#86efac",
      400: "#4ade80",
      500: "#22c55e",
      600: "#16a34a",
      700: "#15803d",
      800: "#166534",
      900: "#14532d",
    },
    // Warning
    warning: {
      50: "#fffbeb",
      100: "#fef3c7",
      200: "#fde68a",
      300: "#fcd34d",
      400: "#fbbf24",
      500: "#f59e0b",
      600: "#d97706",
      700: "#b45309",
      800: "#92400e",
      900: "#78350f",
    },
    // Danger
    danger: {
      50: "#fef2f2",
      100: "#fee2e2",
      200: "#fecaca",
      300: "#fca5a5",
      400: "#f87171",
      500: "#ef4444",
      600: "#dc2626",
      700: "#b91c1c",
      800: "#991b1b",
      900: "#7f1d1d",
    },
    // Gray (neutral)
    gray: {
      50: "#f9fafb",
      100: "#f3f4f6",
      200: "#e5e7eb",
      300: "#d1d5db",
      400: "#9ca3af",
      500: "#6b7280",
      600: "#4b5563",
      700: "#374151",
      800: "#1f2937",
      900: "#111827",
      950: "#030712",
    },
    // Surface colors
    surface: {
      primary: "#0f172a",
      secondary: "#1e293b",
      tertiary: "#334155",
      elevated: "#1e293b",
      overlay: "rgba(0, 0, 0, 0.5)",
    },
  },

  // Tipografía
  typography: {
    fontFamily: {
      sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      mono: ["JetBrains Mono", "Fira Code", "monospace"],
    },
    fontSize: {
      xs: "0.75rem",
      sm: "0.875rem",
      base: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
      "4xl": "2.25rem",
    },
    fontWeight: {
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
    },
    lineHeight: {
      tight: "1.25",
      normal: "1.5",
      relaxed: "1.75",
    },
  },

  // Espaciado
  spacing: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
    "2xl": "3rem",
    "3xl": "4rem",
  },

  // Bordes redondeados
  borderRadius: {
    none: "0",
    sm: "0.25rem",
    md: "0.375rem",
    lg: "0.5rem",
    xl: "0.75rem",
    "2xl": "1rem",
    full: "9999px",
  },

  // Sombras
  shadows: {
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
    glow: "0 0 20px rgb(59 130 246 / 0.5)",
    "glow-green": "0 0 20px rgb(34 197 94 / 0.5)",
    "glow-purple": "0 0 20px rgb(168 85 247 / 0.5)",
  },

  // Transiciones
  transitions: {
    fast: "150ms cubic-bezier(0.4, 0, 0.2, 1)",
    normal: "200ms cubic-bezier(0.4, 0, 0.2, 1)",
    slow: "300ms cubic-bezier(0.4, 0, 0.2, 1)",
    spring: "500ms cubic-bezier(0.34, 1.56, 0.64, 1)",
  },

  // Gradientes
  gradients: {
    primary: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
    success: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
    warning: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    danger: "linear-gradient(135deg, #ef4444 0%, #dc2626 1000%)",
    dark: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
    card: "linear-gradient(145deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)",
    "card-hover": "linear-gradient(145deg, rgba(51, 65, 85, 0.8) 0%, rgba(30, 41, 59, 0.9) 100%)",
  },
};

// =============================================
// CLASES CSS UTILITARIAS
// =============================================

export const uiClasses = {
  // Card base
  card: `
    bg-gray-800/50 
    backdrop-blur-sm 
    border border-gray-700/50 
    rounded-2xl 
    shadow-lg 
    transition-all 
    duration-300
    hover:border-gray-600/50
    hover:shadow-xl
  `,

  // Card elevada
  cardElevated: `
    bg-gray-800/80 
    backdrop-blur-md 
    border border-gray-700/50 
    rounded-2xl 
    shadow-xl 
    transition-all 
    duration-300
    hover:shadow-2xl
    hover:border-gray-600/50
  `,

  // Botón primario
  btnPrimary: `
    px-6 
    py-3 
    bg-gradient-to-r 
    from-blue-600 
    to-blue-700 
    text-white 
    font-semibold 
    rounded-xl 
    shadow-lg 
    shadow-blue-500/25
    hover:shadow-xl 
    hover:shadow-blue-500/30
    hover:from-blue-500 
    hover:to-blue-600
    active:scale-[0.98]
    transition-all 
    duration-200
    disabled:opacity-50 
    disabled:cursor-not-allowed
    disabled:hover:shadow-lg
  `,

  // Botón secundario
  btnSecondary: `
    px-6 
    py-3 
    bg-gray-700/50 
    text-gray-200 
    font-semibold 
    rounded-xl 
    border 
    border-gray-600/50
    hover:bg-gray-700 
    hover:border-gray-500
    active:scale-[0.98]
    transition-all 
    duration-200
  `,

  // Botón éxito
  btnSuccess: `
    px-6 
    py-3 
    bg-gradient-to-r 
    from-green-600 
    to-green-700 
    text-white 
    font-semibold 
    rounded-xl 
    shadow-lg 
    shadow-green-500/25
    hover:shadow-xl 
    hover:shadow-green-500/30
    hover:from-green-500 
    hover:to-green-600
    active:scale-[0.98]
    transition-all 
    duration-200
  `,

  // Botón peligro
  btnDanger: `
    px-6 
    py-3 
    bg-gradient-to-r 
    from-red-600 
    to-red-700 
    text-white 
    font-semibold 
    rounded-xl 
    shadow-lg 
    shadow-red-500/25
    hover:shadow-xl 
    hover:shadow-red-500/30
    hover:from-red-500 
    hover:to-red-600
    active:scale-[0.98]
    transition-all 
    duration-200
  `,

  // Input
  input: `
    w-full 
    px-4 
    py-3 
    bg-gray-700/50 
    border 
    border-gray-600/50 
    rounded-xl 
    text-white 
    placeholder-gray-400
    focus:outline-none 
    focus:ring-2 
    focus:ring-blue-500/50 
    focus:border-blue-500
    transition-all 
    duration-200
  `,

  // Badge
  badge: `
    px-3 
    py-1 
    text-xs 
    font-semibold 
    rounded-full
  `,

  // Número de lotería
  lotteryNumber: `
    w-12 
    h-12 
    flex 
    items-center 
    justify-center 
    rounded-full 
    font-bold 
    text-white 
    shadow-lg
    transition-all 
    duration-200
    hover:scale-110
    hover:shadow-xl
  `,

  // Número pequeño
  lotteryNumberSmall: `
    w-8 
    h-8 
    flex 
    items-center 
    justify-center 
    rounded-full 
    font-bold 
    text-white 
    text-sm
    shadow-md
  `,

  // Progress bar
  progressBar: `
    h-2 
    bg-gray-700 
    rounded-full 
    overflow-hidden
  `,

  // Progress bar fill
  progressFill: `
    h-full 
    bg-gradient-to-r 
    from-blue-500 
    to-blue-600 
    rounded-full 
    transition-all 
    duration-500
  `,

  // Stat card
  statCard: `
    p-4 
    bg-gray-700/30 
    rounded-xl 
    border 
    border-gray-600/30
    text-center
  `,

  // Tab button
  tabButton: `
    px-4 
    py-2 
    text-sm 
    font-medium 
    rounded-lg 
    transition-all 
    duration-200
  `,

  // Tab active
  tabActive: `
    bg-blue-600 
    text-white 
    shadow-lg 
    shadow-blue-500/25
  `,

  // Tab inactive
  tabInactive: `
    text-gray-400 
    hover:text-white 
    hover:bg-gray-700/50
  `,

  // Divider
  divider: `
    h-px 
    bg-gradient-to-r 
    from-transparent 
    via-gray-700 
    to-transparent
  `,

  // Glow effect
  glow: `
    animate-pulse
    shadow-[0_0_20px_rgb(59_130_246/0.5)]
  `,
};

// =============================================
// COMPONENTES DE DISEÑO
// =============================================

export const designComponents = {
  // Card con gradiente
  gradientCard: (color: "blue" | "green" | "purple" | "yellow" | "red" = "blue") => {
    const gradients = {
      blue: "from-blue-500/10 to-blue-600/5 border-blue-500/20",
      green: "from-green-500/10 to-green-600/5 border-green-500/20",
      purple: "from-purple-500/10 to-purple-600/5 border-purple-500/20",
      yellow: "from-yellow-500/10 to-yellow-600/5 border-yellow-500/20",
      red: "from-red-500/10 to-red-600/5 border-red-500/20",
    };
    return `bg-gradient-to-br ${gradients[color]} border rounded-2xl p-6`;
  },

  // Stat con icono
  statWithIcon: (color: string) => `
    flex items-center gap-4 p-4 
    bg-gray-700/30 rounded-xl 
    border border-gray-600/30
  `,

  // Número de lotería con color
  lotteryNumberColor: (color: string) => {
    const colors = {
      purple: "bg-gradient-to-br from-purple-500 to-purple-600 shadow-purple-500/30",
      pink: "bg-gradient-to-br from-pink-500 to-pink-600 shadow-pink-500/30",
      yellow: "bg-gradient-to-br from-yellow-500 to-yellow-600 shadow-yellow-500/30",
      blue: "bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/30",
      green: "bg-gradient-to-br from-green-500 to-green-600 shadow-green-500/30",
    };
    return `w-12 h-12 flex items-center justify-center rounded-full font-bold text-white shadow-lg ${colors[color as keyof typeof colors] || colors.blue}`;
  },
};

export default designSystem;
