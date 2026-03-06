// components/ui/badge.tsx
type Variant = "success" | "danger" | "warning" | "info" | "neutral" | "blue";

interface BadgeProps {
  variant?: Variant;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}

const styles: Record<Variant, { wrap: string; dot: string }> = {
  success: { wrap: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", dot: "bg-emerald-500" },
  danger:  { wrap: "bg-red-50 text-red-700 ring-1 ring-red-200", dot: "bg-red-500" },
  warning: { wrap: "bg-amber-50 text-amber-700 ring-1 ring-amber-200", dot: "bg-amber-500" },
  info:    { wrap: "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200", dot: "bg-cyan-500" },
  neutral: { wrap: "bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200", dot: "bg-zinc-400" },
  blue:    { wrap: "bg-blue-50 text-blue-700 ring-1 ring-blue-200", dot: "bg-blue-500" },
};

export function Badge({ variant = "neutral", children, dot, className = "" }: BadgeProps) {
  const s = styles[variant];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium ${s.wrap} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />}
      {children}
    </span>
  );
}
