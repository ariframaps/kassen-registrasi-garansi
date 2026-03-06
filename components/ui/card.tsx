// components/ui/card.tsx
interface CardProps { children: React.ReactNode; className?: string; }

export function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`bg-white border border-zinc-200 rounded-xl shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({
  title, description, action, className = ""
}: { title: string; description?: string; action?: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-center justify-between px-5 py-4 border-b border-zinc-100 ${className}`}>
      <div>
        <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
        {description && <p className="text-xs text-zinc-500 mt-0.5">{description}</p>}
      </div>
      {action && <div className="shrink-0 ml-4">{action}</div>}
    </div>
  );
}

export function CardContent({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-5 ${className}`}>{children}</div>;
}
