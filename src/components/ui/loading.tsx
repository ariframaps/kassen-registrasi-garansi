import { Shield } from "lucide-react";

type LoadingProps = {
	text?: string;
	fullScreen?: boolean;
};

export default function Loading({
	text = "Loading...",
	fullScreen = true,
}: LoadingProps) {
	return (
		<div
			className={`flex flex-col items-center justify-center gap-4 ${
				fullScreen ? "min-h-screen" : "py-10"
			}`}>
			{/* Animated shield */}
			<div className="relative">
				{/* Glow */}
				<div className="absolute inset-0 animate-ping rounded-full bg-blue-500/30 blur-xl" />

				{/* Icon container */}
				<div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-blue-500/20 bg-zinc-900 shadow-2xl shadow-blue-500/20">
					<Shield className="h-10 w-10 animate-bounce text-blue-400" />
				</div>
			</div>

			{/* Loading text */}
			<div className="flex items-center gap-1 text-sm font-medium text-zinc-400">
				<span>{text}</span>

				<span className="flex gap-1">
					<span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-400 [animation-delay:0ms]" />
					<span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-400 [animation-delay:150ms]" />
					<span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-400 [animation-delay:300ms]" />
				</span>
			</div>
		</div>
	);
}
