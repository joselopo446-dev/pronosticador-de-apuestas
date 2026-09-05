// =============================================
// COMPONENTES UI REUTILIZABLES
// =============================================
// Componentes profesionales para el Pronosticador

import { ReactNode } from "react";

// =============================================
// CARD COMPONENT
// =============================================

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "elevated" | "gradient" | "glass";
  color?: "blue" | "green" | "purple" | "yellow" | "red" | "gray" | "pink";
  hover?: boolean;
  padding?: "sm" | "md" | "lg";
}

export function Card({
  children,
  className = "",
  variant = "default",
  color = "gray",
  hover = true,
  padding = "md",
}: CardProps) {
  const baseClasses = "rounded-2xl transition-all duration-300";
  
  const variantClasses = {
    default: "bg-gray-800/50 border border-gray-700/50",
    elevated: "bg-gray-800/80 border border-gray-700/50 shadow-xl",
    gradient: `bg-gradient-to-br ${
      color === "blue" ? "from-blue-500/10 to-blue-600/5 border-blue-500/20" :
      color === "green" ? "from-green-500/10 to-green-600/5 border-green-500/20" :
      color === "purple" ? "from-purple-500/10 to-purple-600/5 border-purple-500/20" :
      color === "yellow" ? "from-yellow-500/10 to-yellow-600/5 border-yellow-500/20" :
      color === "red" ? "from-red-500/10 to-red-600/5 border-red-500/20" :
      color === "pink" ? "from-pink-500/10 to-pink-600/5 border-pink-500/20" :
      "from-gray-500/10 to-gray-600/5 border-gray-500/20"
    } border`,
    glass: "bg-gray-800/30 backdrop-blur-xl border border-gray-700/30",
  };

  const paddingClasses = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  const hoverClasses = hover
    ? "hover:border-gray-600/50 hover:shadow-xl hover:scale-[1.01]"
    : "";

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${hoverClasses} ${className}`}
    >
      {children}
    </div>
  );
}

// =============================================
// BUTTON COMPONENT
// =============================================

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "success" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
}

export function Button({
  children,
  onClick,
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "left",
  loading = false,
  disabled = false,
  fullWidth = false,
  className = "",
}: ButtonProps) {
  const baseClasses = "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 active:scale-[0.98]";
  
  const variantClasses = {
    primary: "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:from-blue-500 hover:to-blue-600",
    secondary: "bg-gray-700/50 text-gray-200 border border-gray-600/50 hover:bg-gray-700 hover:border-gray-500",
    success: "bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/30 hover:from-green-500 hover:to-green-600",
    danger: "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30 hover:from-red-500 hover:to-red-600",
    ghost: "text-gray-400 hover:text-white hover:bg-gray-800/50",
  };

  const sizeClasses = {
    sm: "px-4 py-2 text-sm gap-2",
    md: "px-6 py-3 text-sm gap-2",
    lg: "px-8 py-4 text-base gap-3",
  };

  const widthClasses = fullWidth ? "w-full" : "";

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClasses} ${
        disabled || loading ? "opacity-50 cursor-not-allowed" : ""
      } ${className}`}
    >
      {loading ? (
        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : icon && iconPosition === "left" ? (
        icon
      ) : null}
      {children}
      {icon && iconPosition === "right" && !loading ? icon : null}
    </button>
  );
}

// =============================================
// STAT CARD COMPONENT
// =============================================

interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: ReactNode;
  color?: "blue" | "green" | "purple" | "yellow" | "red";
  trend?: "up" | "down" | "neutral";
}

export function StatCard({
  label,
  value,
  change,
  changeLabel,
  icon,
  color = "blue",
  trend = "neutral",
}: StatCardProps) {
  const colorClasses = {
    blue: "from-blue-500/10 to-blue-600/5 border-blue-500/20",
    green: "from-green-500/10 to-green-600/5 border-green-500/20",
    purple: "from-purple-500/10 to-purple-600/5 border-purple-500/20",
    yellow: "from-yellow-500/10 to-yellow-600/5 border-yellow-500/20",
    red: "from-red-500/10 to-red-600/5 border-red-500/20",
  };

  const iconColorClasses = {
    blue: "text-blue-400",
    green: "text-green-400",
    purple: "text-purple-400",
    yellow: "text-yellow-400",
    red: "text-red-400",
  };

  const trendClasses = {
    up: "text-green-400",
    down: "text-red-400",
    neutral: "text-gray-400",
  };

  return (
    <div
      className={`p-6 bg-gradient-to-br ${colorClasses[color]} border rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-400 mb-1">{label}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-sm font-medium ${trendClasses[trend]}`}>
                {trend === "up" ? "↑" : trend === "down" ? "↓" : "—"} {Math.abs(change)}%
              </span>
              {changeLabel && (
                <span className="text-xs text-gray-500">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div className={`p-3 bg-gray-800/50 rounded-xl ${iconColorClasses[color]}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================
// BADGE COMPONENT
// =============================================

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  size?: "sm" | "md";
  pulse?: boolean;
}

export function Badge({
  children,
  variant = "default",
  size = "sm",
  pulse = false,
}: BadgeProps) {
  const variantClasses = {
    default: "bg-gray-700/50 text-gray-300 border-gray-600/50",
    success: "bg-green-500/10 text-green-400 border-green-500/30",
    warning: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
    danger: "bg-red-500/10 text-red-400 border-red-500/30",
    info: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  };

  const sizeClasses = {
    sm: "px-2.5 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${
        variantClasses[variant]
      } ${sizeClasses[size]} ${pulse ? "animate-pulse" : ""}`}
    >
      {pulse && (
        <span className="w-1.5 h-1.5 bg-current rounded-full animate-ping" />
      )}
      {children}
    </span>
  );
}

// =============================================
// LOTTERY NUMBER COMPONENT
// =============================================

interface LotteryNumberProps {
  number: number;
  size?: "sm" | "md" | "lg";
  color?: "purple" | "pink" | "yellow" | "blue" | "green" | "gray" | "red";
  bonus?: boolean;
  animate?: boolean;
}

export function LotteryNumber({
  number,
  size = "md",
  color = "blue",
  bonus = false,
  animate = true,
}: LotteryNumberProps) {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-12 h-12 text-sm",
    lg: "w-16 h-16 text-lg",
  };

  const colorClasses = {
    purple: "from-purple-500 to-purple-600 shadow-purple-500/30",
    pink: "from-pink-500 to-pink-600 shadow-pink-500/30",
    yellow: "from-yellow-500 to-yellow-600 shadow-yellow-500/30",
    blue: "from-blue-500 to-blue-600 shadow-blue-500/30",
    green: "from-green-500 to-green-600 shadow-green-500/30",
    gray: "from-gray-500 to-gray-600 shadow-gray-500/30",
    red: "from-red-500 to-red-600 shadow-red-500/30",
  };

  return (
    <div
      className={`${sizeClasses[size]} bg-gradient-to-br ${colorClasses[color]} rounded-full flex items-center justify-center font-bold text-white shadow-lg ${
        animate ? "hover:scale-110 hover:shadow-xl transition-all duration-200 cursor-pointer" : ""
      }`}
    >
      {number}
    </div>
  );
}

// =============================================
// PROGRESS BAR COMPONENT
// =============================================

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: "blue" | "green" | "purple" | "yellow" | "red" | "pink";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  label?: string;
}

export function ProgressBar({
  value,
  max = 100,
  color = "blue",
  size = "md",
  showLabel = false,
  label,
}: ProgressBarProps) {
  const percentage = Math.min(100, (value / max) * 100);

  const sizeClasses = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
  };

  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    purple: "from-purple-500 to-purple-600",
    yellow: "from-yellow-500 to-yellow-600",
    red: "from-red-500 to-red-600",
    pink: "from-pink-500 to-pink-600",
  };

  return (
    <div className="w-full">
      {(showLabel || label) && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">{label || "Progreso"}</span>
          <span className="text-sm font-medium text-white">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={`${sizeClasses[size]} bg-gray-700 rounded-full overflow-hidden`}>
        <div
          className={`h-full bg-gradient-to-r ${colorClasses[color]} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// =============================================
// TABS COMPONENT
// =============================================

interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  color?: "blue" | "green" | "purple" | "yellow";
}

export function Tabs({ tabs, activeTab, onChange, color = "blue" }: TabsProps) {
  const colorClasses = {
    blue: "bg-blue-600 text-white shadow-lg shadow-blue-500/25",
    green: "bg-green-600 text-white shadow-lg shadow-green-500/25",
    purple: "bg-purple-600 text-white shadow-lg shadow-purple-500/25",
    yellow: "bg-yellow-600 text-white shadow-lg shadow-yellow-500/25",
  };

  return (
    <div className="flex gap-2 p-1 bg-gray-800/50 rounded-xl border border-gray-700/50">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeTab === tab.id
              ? colorClasses[color]
              : "text-gray-400 hover:text-white hover:bg-gray-700/50"
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// =============================================
// EMPTY STATE COMPONENT
// =============================================

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="p-4 bg-gray-800/50 rounded-2xl text-gray-500 mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-center max-w-md mb-6">{description}</p>
      {action}
    </div>
  );
}

// =============================================
// LOADING SPINNER COMPONENT
// =============================================

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: "blue" | "green" | "purple";
}

export function LoadingSpinner({ size = "md", color = "blue" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-16 h-16",
  };

  const colorClasses = {
    blue: "border-blue-500",
    green: "border-green-500",
    purple: "border-purple-500",
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className={`${sizeClasses[size]} border-4 ${colorClasses[color]} border-t-transparent rounded-full animate-spin`}
      />
      <p className="text-gray-400 text-sm">Cargando...</p>
    </div>
  );
}
