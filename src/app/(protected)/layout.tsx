import { AuthWrapper } from "@/lib/auth-wrapper";

export default function Layout({ children }: { children: React.ReactNode }) {
	return <AuthWrapper>{children}</AuthWrapper>;
}
