// lib/utils.ts
export function normalizeSerialNumber(sn: string): string {
  return sn.toUpperCase().replace(/[\s-]/g, "");
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
  });
}

export function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export function getDaysRemaining(endDate: string): number {
  return Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
}

export function getProductStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    uploaded_by_sales: "Belum Diregistrasikan",
    assigned_to_dealer: "Di Dealer",
    warranty_active: "Garansi Aktif",
    warranty_expired: "Garansi Berakhir",
  };
  return labels[status] ?? status;
}

export function getProductStatusBadgeVariant(status: string): "neutral" | "blue" | "success" | "danger" {
  if (status === "warranty_active")   return "success";
  if (status === "warranty_expired")  return "danger";
  if (status === "assigned_to_dealer") return "blue";
  return "neutral";
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
