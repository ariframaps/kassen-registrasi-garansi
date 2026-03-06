// app/dealer/layout.tsx
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default function DealerLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
