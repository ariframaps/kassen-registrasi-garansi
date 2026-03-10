"use client";
// components/layout/topbar.tsx
import { useAuth } from "@/lib/auth-context";
import type { UserRole } from "@/types";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Monitor } from "lucide-react";

interface TopbarProps {
	title: string;
	description?: string;
	action?: React.ReactNode;
}

const roleRedirect: Record<UserRole, string> = {
	admin: "/dashboard",
	sales: "/dashboard",
	dealer: "/dealer/dashboard",
	technical_support: "/support/products",
};

const roleLabels: { value: UserRole; label: string }[] = [
	{ value: "admin", label: "Admin" },
	{ value: "sales", label: "Sales" },
	{ value: "dealer", label: "Dealer" },
	{ value: "technical_support", label: "Technical Support" },
];

export function Topbar({ title, description, action }: TopbarProps) {
	const { user, switchRole } = useAuth();
	const router = useRouter();
	const [open, setOpen] = useState(false);

	const handleSwitch = (role: UserRole) => {
		switchRole(role);
		setOpen(false);
		router.push(roleRedirect[role]);
	};

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

			<div className="relative">
				{/* <button
					onClick={() => setOpen(!open)}
					className="flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-medium text-zinc-500 bg-zinc-100 hover:bg-zinc-200 hover:text-zinc-700 transition-colors">
					<Monitor size={12} />
					Demo: {roleLabels.find((r) => r.value === user?.role)?.label ?? "—"}
				</button> */}
				{open && (
					<div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-zinc-200 rounded-xl shadow-lg py-1 z-20 animate-scale-in">
						<p className="px-3 pt-1.5 pb-1 text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
							Switch role
						</p>
						{roleLabels.map((r) => (
							<button
								key={r.value}
								onClick={() => handleSwitch(r.value)}
								className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
									user?.role === r.value
										? "text-blue-700 bg-blue-50 font-medium"
										: "text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
								}`}>
								{r.label}
							</button>
						))}
					</div>
				)}
			</div>

			{action && <div className="shrink-0">{action}</div>}
		</header>
	);
}
