// components/ui/input.tsx
"use client";
import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, className = "", ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-medium text-zinc-700 mb-1.5">
          {label}{props.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          className={`
            w-full h-9 text-sm bg-white text-zinc-900 placeholder:text-zinc-400
            border rounded-lg outline-none transition-all duration-150
            ${error
              ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/15"
              : "border-zinc-200 hover:border-zinc-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
            }
            ${leftIcon ? "pl-9" : "pl-3"}
            ${rightIcon ? "pr-9" : "pr-3"}
            ${className}
          `}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
            {rightIcon}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-zinc-400">{hint}</p>}
    </div>
  )
);
Input.displayName = "Input";
