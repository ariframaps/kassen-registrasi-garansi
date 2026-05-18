"use client";
// app/dashboard/customers/[id]/page.tsx
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableHead, TableHeader, TableBody, TableRow, TableCell, EmptyState,
} from "@/components/ui/table";
// import { customerAdapter } from "@/lib/adapters";
// import type { Customer } from "@/lib/adapters";
import type { PurchaseGroup } from "@/types";
import { formatDateShort, getDaysRemaining } from "@/lib/utils";
import { ArrowLeft, Mail, Phone, ShoppingBag, CalendarDays, Building2 } from "lucide-react";

function WarrantyBadge({ endDate }: { endDate: string }) {
  const days = getDaysRemaining(endDate);
  if (days <= 0) return <Badge variant="danger" dot>Berakhir</Badge>;
  if (days <= 30) return <Badge variant="warning" dot>Aktif ({days}h)</Badge>;
  return <Badge variant="success" dot>Aktif</Badge>;
}

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [purchases, setPurchases] = useState<PurchaseGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      customerAdapter.getById(id),
      customerAdapter.getPurchaseHistory(id),
    ]).then(([cust, hist]) => {
      setCustomer(cust);
      setPurchases(hist);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-[var(--bg)]">
        <Topbar title="Detail Customer" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-zinc-400">Memuat data…</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex flex-col min-h-screen bg-[var(--bg)]">
        <Topbar title="Detail Customer" />
        <div className="flex-1 flex items-center justify-center flex-col gap-3">
          <p className="text-sm text-zinc-600">Customer tidak ditemukan.</p>
          <Button variant="outline" size="sm" onClick={() => router.back()}>Kembali</Button>
        </div>
      </div>
    );
  }

  const totalSN = purchases.reduce((s, p) => s + p.serialNumbers.length, 0);

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg)]">
      <Topbar title="Detail Customer" />
      <main className="flex-1 p-6 space-y-5 animate-fade-up">

        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-800 transition-colors"
        >
          <ArrowLeft size={13} /> Kembali ke daftar customer
        </button>

        {/* Customer card */}
        <Card>
          <CardContent>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                <span className="text-blue-600 text-lg font-bold uppercase">
                  {customer.name.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold text-zinc-900">{customer.name}</h2>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                  <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <Mail size={12} /> {customer.email}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <Phone size={12} /> {customer.phone}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <CalendarDays size={12} /> Terdaftar {formatDateShort(customer.createdAt)}
                  </span>
                </div>
                {customer.dealers.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {customer.dealers.map((d) => (
                      <Badge key={d} variant="neutral">
                        <Building2 size={10} className="mr-0.5" /> {d}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-4 shrink-0">
                <div className="text-center">
                  <p className="text-xl font-bold text-zinc-900">{customer.totalPurchases}</p>
                  <p className="text-xs text-zinc-400">Pembelian</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-zinc-900">{totalSN}</p>
                  <p className="text-xs text-zinc-400">Produk</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Purchase history */}
        <Card>
          <CardHeader
            title="Riwayat Pembelian"
            description="Semua pembelian lintas dealer"
          />
          <Table>
            <TableHead>
              <TableHeader>Tanggal</TableHeader>
              <TableHeader>Serial Number</TableHeader>
              <TableHeader>Dealer</TableHeader>
              <TableHeader>Garansi</TableHeader>
              <TableHeader>Invoice</TableHeader>
            </TableHead>
            <TableBody>
              {purchases.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      icon={<ShoppingBag size={18} />}
                      title="Belum ada riwayat pembelian"
                    />
                  </td>
                </tr>
              ) : (
                purchases.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-xs text-zinc-600">
                      {formatDateShort(p.purchaseDate)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        {p.serialNumbers.map((sn) => (
                          <span key={sn} className="font-mono text-xs text-zinc-700">{sn}</span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {p.dealerName ? (
                        <Badge variant="neutral">{p.dealerName}</Badge>
                      ) : (
                        <span className="text-xs text-zinc-400">Langsung (Sales)</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <WarrantyBadge endDate={p.warrantyEndDate} />
                      <p className="text-xs text-zinc-400 mt-0.5">
                        s/d {formatDateShort(p.warrantyEndDate)}
                      </p>
                    </TableCell>
                    <TableCell>
                      {p.invoiceUrl ? (
                        <a
                          href={p.invoiceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {p.invoiceFileName}
                        </a>
                      ) : (
                        <span className="text-xs text-zinc-400">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </main>
    </div>
  );
}
