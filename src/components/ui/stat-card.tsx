// components/ui/stat-card.tsx

type Color = "blue" | "emerald" | "amber" | "red" | "violet" | "zinc";

const colorMap: Record<Color, { icon: string; val: string; bg: string; ring: string }> = {
  blue:    { icon: "text-blue-600",    val: "text-blue-700",    bg: "bg-blue-50",    ring: "ring-blue-100" },
  emerald: { icon: "text-emerald-600", val: "text-emerald-700", bg: "bg-emerald-50", ring: "ring-emerald-100" },
  amber:   { icon: "text-amber-600",   val: "text-amber-700",   bg: "bg-amber-50",   ring: "ring-amber-100" },
  red:     { icon: "text-red-600",     val: "text-red-700",     bg: "bg-red-50",     ring: "ring-red-100" },
  violet:  { icon: "text-violet-600",  val: "text-violet-700",  bg: "bg-violet-50",  ring: "ring-violet-100" },
  zinc:    { icon: "text-zinc-500",    val: "text-zinc-700",    bg: "bg-zinc-100",   ring: "ring-zinc-200" },
};

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color?: Color;
  subtitle?: string;
  className?: string;
}

export function StatCard({ title, value, icon, color = "blue", subtitle, className = "" }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className={`bg-white border border-zinc-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-zinc-500 leading-none">{title}</p>
        <div className={`w-8 h-8 rounded-lg ${c.bg} ring-1 ${c.ring} flex items-center justify-center ${c.icon} shrink-0`}>
          <span className="w-4 h-4 flex items-center justify-center">{icon}</span>
        </div>
      </div>
      <p className={`text-2xl font-semibold font-mono leading-none ${c.val}`}>{value}</p>
      {subtitle && <p className="text-xs text-zinc-400 mt-2">{subtitle}</p>}
    </div>
  );
}
