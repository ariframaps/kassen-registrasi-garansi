"use client";
// app/dealer/dashboard/page.tsx
// Revision:
// - merge "produk saya" table into dashboard
// - full search by SN + product type
// - no "aksi" column
// - notifications section for dealer

import { useState } from "react";
import { Topbar } from "@/components/layout/topbar";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableHead, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { dealerProducts, mockDealerNotifications } from "@/lib/mock-data";
import { formatDateShort, getDaysRemaining } from "@/lib/utils";
import { Package, ShieldCheck, ShieldOff, AlertCircle, Bell, Shield, ArrowRight, Search, X } from "lucide-react";
import Link from "next/link";

type FilterType = "all" | "none" | "active" | "expired";

export default function DealerDashboardPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [dismissedNotifs, setDismissedNotifs] = useState<string[]>([]);

  const total   = dealerProducts.length;
  const pending = dealerProducts.filter(p => p.warrantyStatus === "none").length;
  const active  = dealerProducts.filter(p => p.warrantyStatus === "active").length;
  const expired = dealerProducts.filter(p => p.warrantyStatus === "expired").length;

  const activeNotifs = mockDealerNotifications.filter(n => !dismissedNotifs.includes(n.id));

  const filtered = dealerProducts.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = p.serialNumber.toLowerCase().includes(q) || p.productType.toLowerCase().includes(q);
    const matchFilter = filter === "all" || p.warrantyStatus === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div>
      <Topbar title="Dashboard" description="PT Maju Teknologi" />
      <div className="p-6 space-y-5">

        {/* Notifications */}
        {activeNotifs.length > 0 && (
          <div className="space-y-2 animate-fade-up">
            {activeNotifs.map(n => (
              <div key={n.id} className="flex items-start gap-3 px-4 py-3.5 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Bell size={14} className="text-blue-600"/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-blue-900">{n.type === "product_ready" ? "Produk Siap Diregistrasi" : "Peringatan Garansi"}</p>
                  <p className="text-xs text-blue-700 mt-0.5">{n.message}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="font-mono text-[11px] text-blue-600 bg-blue-100 px-2 py-0.5 rounded-md">{n.serialNumber}</span>
                    <Link href="/dealer/register-warranty">
                      <Button size="xs" icon={<ArrowRight size={11}/>} iconPosition="right">Registrasi Sekarang</Button>
                    </Link>
                  </div>
                </div>
                <button onClick={() => setDismissedNotifs(p => [...p, n.id])} className="text-blue-400 hover:text-blue-600 shrink-0">
                  <X size={14}/>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 animate-fade-up delay-1">
          <StatCard title="Total Produk"     value={total}   icon={<Package size={15}/>}    color="blue"    subtitle="Di toko ini" />
          <StatCard title="Belum Garansi"    value={pending} icon={<AlertCircle size={15}/>} color="amber"   subtitle="Perlu diregistrasi" />
          <StatCard title="Garansi Aktif"    value={active}  icon={<ShieldCheck size={15}/>} color="emerald" subtitle="Dalam masa garansi" />
          <StatCard title="Garansi Berakhir" value={expired} icon={<ShieldOff size={15}/>}   color="red"     subtitle="Garansi habis" />
        </div>

        {/* CTA jika ada pending */}
        {pending > 0 && (
          <div className="bg-zinc-900 rounded-xl px-5 py-4 flex items-center justify-between animate-fade-up delay-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center">
                <Shield size={16} className="text-blue-400"/>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{pending} produk belum diregistrasi garansinya</p>
                <p className="text-xs text-zinc-400 mt-0.5">Segera daftarkan agar garansi customer aktif</p>
              </div>
            </div>
            <Link href="/dealer/register-warranty">
              <Button size="sm" icon={<ArrowRight size={13}/>} iconPosition="right">Registrasi Garansi</Button>
            </Link>
          </div>
        )}

        {/* Product Table */}
        <Card className="animate-fade-up delay-3">
          <CardHeader
            title="Produk Saya"
            description="Semua produk yang di-assign ke toko Anda"
            action={
              <Link href="/dealer/register-warranty">
                <Button size="sm" variant="outline" icon={<Shield size={13}/>}>Registrasi Garansi</Button>
              </Link>
            }
          />
          {/* Search + Filter */}
          <div className="px-5 pb-3.5 flex gap-3 border-b border-zinc-100">
            <div className="flex-1 max-w-72">
              <Input
                placeholder="Cari serial number atau tipe produk…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                leftIcon={<Search size={14}/>}
              />
            </div>
            <Select
              options={[
                { value: "all",     label: "Semua" },
                { value: "none",    label: "Belum Terdaftar" },
                { value: "active",  label: "Garansi Aktif" },
                { value: "expired", label: "Garansi Berakhir" },
              ]}
              value={filter}
              onChange={e => setFilter(e.target.value as FilterType)}
              className="w-44"
            />
          </div>
          <CardContent className="p-0">
            <Table>
              <TableHead>
                <TableHeader>Serial Number</TableHeader>
                <TableHeader>Tipe Produk</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Customer</TableHeader>
                <TableHeader>Mulai Garansi</TableHeader>
                <TableHeader>Berakhir</TableHeader>
                <TableHeader>Sisa</TableHeader>
              </TableHead>
              <TableBody>
                {filtered.map(p => {
                  const days = p.warrantyEndDate ? getDaysRemaining(p.warrantyEndDate) : null;
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <span className="font-mono text-xs bg-zinc-100 text-zinc-700 px-2 py-1 rounded-md">{p.serialNumber}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-zinc-800 max-w-[160px] truncate block">{p.productType}</span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={p.warrantyStatus === "active" ? "success" : p.warrantyStatus === "expired" ? "danger" : "neutral"}
                          dot
                        >
                          {p.warrantyStatus === "active" ? "Aktif" : p.warrantyStatus === "expired" ? "Berakhir" : "Belum Terdaftar"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-zinc-500">{p.customerName ?? <span className="text-zinc-300">—</span>}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-zinc-400">{p.warrantyStartDate ? formatDateShort(p.warrantyStartDate) : <span className="text-zinc-300">—</span>}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-zinc-400">{p.warrantyEndDate ? formatDateShort(p.warrantyEndDate) : <span className="text-zinc-300">—</span>}</span>
                      </TableCell>
                      <TableCell>
                        {days !== null && p.warrantyStatus === "active" ? (
                          <span className={`text-xs font-mono font-semibold ${days < 90 ? "text-amber-600" : "text-emerald-600"}`}>{days}h</span>
                        ) : <span className="text-zinc-300 text-xs">—</span>}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <div className="px-5 py-3 border-t border-zinc-50">
              <p className="text-xs text-zinc-400">{filtered.length} dari {dealerProducts.length} produk</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
