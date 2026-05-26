"use client";
// components/layout/topbar.tsx
interface TopbarProps {
	title: string;
	description?: string;
	action?: React.ReactNode;
}
export function Topbar({ title, description, action }: TopbarProps) {
	return (
		<header className="h-14 bg-white border-b border-zinc-100 flex items-center px-6 gap-4 sticky top-0 z-10">
			<div className="flex-1">
				<h1 className="text-sm font-semibold text-zinc-900 leading-none">
					{title}
				</h1>
				{description && (
					<p className="text-xs text-zinc-400 mt-0.5">{description}</p>
				)}
			</div>

			{action && <div className="shrink-0">{action}</div>}
		</header>
	);
}
