// components/ui/button.tsx
"use client";
import React from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "xs" | "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
}

const base =
  "inline-flex items-center justify-center font-medium transition-all duration-150 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary: "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm shadow-blue-200",
  secondary: "bg-zinc-100 text-zinc-800 hover:bg-zinc-200 active:bg-zinc-300",
  outline: "border border-zinc-200 text-zinc-700 bg-white hover:bg-zinc-50 hover:border-zinc-300 active:bg-zinc-100",
  ghost: "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 active:bg-zinc-200",
  danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm shadow-red-100",
};

const sizes: Record<Size, string> = {
  xs: "h-7 px-2.5 text-xs gap-1.5 rounded-md",
  sm: "h-8 px-3 text-xs gap-1.5 rounded-lg",
  md: "h-9 px-4 text-sm gap-2 rounded-lg",
  lg: "h-10 px-5 text-sm gap-2 rounded-xl",
};

export function Button({
  variant = "primary",
  size = "md",
  loading,
  icon,
  iconPosition = "left",
  fullWidth,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? "w-full" : ""} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {!loading && icon && iconPosition === "left" && <span className="shrink-0">{icon}</span>}
      {children}
      {!loading && icon && iconPosition === "right" && <span className="shrink-0">{icon}</span>}
    </button>
  );
}
