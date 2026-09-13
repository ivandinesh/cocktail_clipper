import type { ReactNode } from "react";

interface BadgeProps {
  variant?: "default" | "success" | "warning" | "error" | "info";
  children: ReactNode;
  className?: string;
}

export function Badge({ variant = "default", children, className = "" }: BadgeProps) {
  const variants = {
    default: "bg-zinc-100 text-zinc-700 border-zinc-200",
    success: "bg-green-50 text-green-700 border-green-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    error: "bg-red-50 text-red-700 border-red-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "green" | "orange";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const base = "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30",
    secondary: "bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-50 shadow-sm",
    ghost: "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100",
    danger: "bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/20",
    green: "bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-600/20",
    orange: "bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/20",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = "", hover = false, onClick }: CardProps) {
  return (
    <div
      className={`bg-white rounded-2xl border border-zinc-200 shadow-sm ${hover ? "hover:shadow-md hover:border-zinc-300 transition-all duration-200 cursor-pointer" : ""} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = "", ...props }: InputProps) {
  return (
    <div className="space-y-1">
      {label && <label className="text-sm font-medium text-zinc-700">{label}</label>}
      <input
        className={`w-full px-3 py-2 bg-white border rounded-xl text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${error ? "border-red-300" : "border-zinc-200"} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}

export function Select({ value, onChange, options, className = "" }: SelectProps) {
  return (
    <select
      className={`w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${className}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}

interface SpinnerProps {
  size?: number;
  className?: string;
}

export function Spinner({ size = 24, className = "" }: SpinnerProps) {
  return (
    <div
      className={`animate-spin rounded-full border-2 border-zinc-200 border-t-blue-600 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  variant?: "default" | "success" | "warning" | "error";
}

export function ProgressBar({ value, max = 100, className = "", variant = "default" }: ProgressBarProps) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  const colors = {
    default: "bg-blue-600",
    success: "bg-green-600",
    warning: "bg-amber-500",
    error: "bg-red-500",
  };

  return (
    <div className={`w-full h-2 bg-zinc-100 rounded-full overflow-hidden ${className}`}>
      <div
        className={`h-full ${colors[variant]} rounded-full transition-all duration-500 ease-out`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
