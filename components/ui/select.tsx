// components/ui/select.tsx
"use client";
import React from "react";
import { ChevronDown } from "lucide-react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, options, placeholder, className = "", ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-medium text-zinc-700 mb-1.5">
          {label}{props.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          className={`
            w-full h-9 pl-3 pr-9 text-sm bg-white text-zinc-900 appearance-none
            border rounded-lg outline-none transition-all duration-150 cursor-pointer
            ${error
              ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/15"
              : "border-zinc-200 hover:border-zinc-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
            }
            ${className}
          `}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-zinc-400">{hint}</p>}
    </div>
  )
);
Select.displayName = "Select";
