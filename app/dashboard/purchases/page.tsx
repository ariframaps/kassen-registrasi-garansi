"use client";
// app/dashboard/purchases/page.tsx — Admin/Sales: all purchase groups
import { useState, useMemo } from "react";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Table, TableHead, TableHeader, TableBody, TableRow, TableCell, EmptyState } from "@/components/ui/table";
import { mockPurchaseGroups, mockProducts, mockDealers } from "@/lib/mock-data";
import { formatDateShort, getDaysRemaining } from "@/lib/utils";
import { Search, Eye, ShoppingBag, FileText, Package, Users, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import type { PurchaseGroup } from "@/types";

export default function AdminPurchasesPage() {
  const [search, setSearch] = useState("");
  const [dealerFilter, setDealerFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selected, setSelected] = useState<PurchaseGroup | null>(null);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

  const toggleExpand = (id: string) =>
    setExpandedRows(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return mockPurchaseGroups.filter(g => {
      const matchSearch =
        g.customerName.toLowerCase().includes(q) ||
        g.customerEmail.toLowerCase().includes(q) ||
        g.serialNumbers.some(sn => sn.toLowerCase().includes(q)) ||
        (g.dealerName ?? "").toLowerCase().includes(q);
      const matchDealer = dealerFilter === "all" || (dealerFilter === "none" ? !g.dealerId : g.dealerId === dealerFilter);
      const matchFrom = !dateFrom || g.purchaseDate >= dateFrom;
      const matchTo   = !dateTo   || g.purchaseDate <= dateTo;
      return matchSearch && matchDealer && matchFrom && matchTo;
    });
  }, [search, dealerFilter, dateFrom, dateTo]);

  const getGroupProducts = (g: PurchaseGroup) =>
    mockProducts.filter(p => g.serialNumbers.includes(p.serialNumber));

  const getGroupStatus = (g: PurchaseGroup) => {
    const products = getGroupProducts(g);
    if (products.every(p => p.warrantyStatus === "active")) return "active";
    if (products.every(p => p.warrantyStatus === "expired")) return "expired";
    if (products.some(p => p.warrantyStatus === "active")) return "partial";
    return "none";
  };

  return (
    <div>
      <Topbar title="Daftar Pembelian" description="Semua registrasi garansi dikelompokkan per transaksi" />
      <div className="p-6 animate-fade-up">
        {/* Summary cards */}
        <div className="grid grid-cols-4 gap-4 mb-5">
          {[
            { l: "Total Pembelian",  v: mockPurchaseGroups.length,                              c: "text-zinc-900" },
            { l: "Via Dealer",       v: mockPurchaseGroups.filter(g => g.dealerId).length,        c: "text-blue-700" },
            { l: "Via Sales",        v: mockPurchaseGroups.filter(g => !g.dealerId).length,       c: "text-violet-700" },
            { l: "Garansi Berakhir", v: mockPurchaseGroups.filter(g => getGroupStatus(g) === "expired").length, c: "text-red-600" },
          ].map(s => (
            <div key={s.l} className="bg-white border border-zinc-200 rounded-xl px-4 py-3.5 shadow-sm">
              <p className="text-xs text-zinc-400 mb-1">{s.l}</p>
              <p className={`text-2xl font-semibold font-mono ${s.c}`}>{s.v}</p>
            </div>
          ))}
        </div>

        <Card>
          {/* Filters */}
          <div className="px-5 py-3.5 border-b border-zinc-100 flex flex-wrap gap-2.5 items-center">
            <div className="flex-1 min-w-48 max-w-64">
              <Input placeholder="Cari customer, SN, atau dealer…" value={search} onChange={e => setSearch(e.target.value)} leftIcon={<Search size={13} />} />
            </div>
            <Select
              options={[
                { value: "all",  label: "Semua Dealer" },
                { value: "none", label: "Registrasi Sales" },
                ...mockDealers.map(d => ({ value: d.id, label: d.name })),
              ]}
              value={dealerFilter}
              onChange={e => setDealerFilter(e.target.value)}
              className="w-48"
            />
            <div className="flex items-center gap-1.5">
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-36" />
              <span className="text-xs text-zinc-400">—</span>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-36" />
            </div>
            <p className="text-xs text-zinc-400 ml-auto">{filtered.length} pembelian</p>
          </div>

          <CardContent className="p-0">
            <Table>
              <TableHead>
                <TableHeader className="w-8" />
                <TableHeader>ID Grup</TableHeader>
                <TableHeader>Customer</TableHeader>
                <TableHeader>Produk</TableHeader>
                <TableHeader>Tgl Pembelian</TableHeader>
                <TableHeader>Garansi</TableHeader>
                <TableHeader>Didaftarkan Oleh</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader className="text-right pr-5">Aksi</TableHeader>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={9}><EmptyState icon={<ShoppingBag size={18} />} title="Tidak ada pembelian" description="Ubah filter atau kata kunci" /></td></tr>
                ) : filtered.map(g => {
                  const status = getGroupStatus(g);
                  const expanded = expandedRows.includes(g.id);
                  const products = getGroupProducts(g);
                  return (
                    <>
                      <TableRow key={g.id}>
                        <TableCell>
                          <button onClick={() => toggleExpand(g.id)} className="p-1 rounded hover:bg-zinc-100 text-zinc-400 transition-colors">
                            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          </button>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-xs bg-zinc-100 text-zinc-600 px-2 py-1 rounded-md">{g.id.toUpperCase()}</span>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-xs font-medium text-zinc-900">{g.customerName}</p>
                            <p className="text-[11px] text-zinc-400">{g.customerEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-semibold font-mono text-zinc-700">{g.serialNumbers.length} unit</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-zinc-600">{formatDateShort(g.purchaseDate)}</span>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-xs text-zinc-600">{formatDateShort(g.purchaseDate)}</p>
                            <p className="text-[11px] text-zinc-400">s/d {formatDateShort(g.warrantyEndDate)}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-zinc-500">{g.dealerName ?? g.registeredByName ?? "—"}</span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={status === "active" ? "success" : status === "expired" ? "danger" : status === "partial" ? "warning" : "neutral"}
                            dot
                          >
                            {status === "active" ? "Aktif" : status === "expired" ? "Berakhir" : status === "partial" ? "Sebagian" : "—"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end">
                            <button
                              onClick={() => setSelected(g)}
                              className="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors"
                            >
                              <Eye size={13} />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {/* Expanded row: list SN details */}
                      {expanded && (
                        <tr key={`${g.id}-expand`} className="bg-zinc-50/60">
                          <td />
                          <td colSpan={8} className="px-4 pb-3 pt-1">
                            <div className="grid grid-cols-2 gap-2">
                              {products.map(p => (
                                <div key={p.id} className="flex items-center gap-2.5 p-2 bg-white border border-zinc-100 rounded-lg">
                                  <Package size={12} className="text-zinc-400 shrink-0" />
                                  <span className="font-mono text-[11px] text-zinc-600">{p.serialNumber}</span>
                                  <span className="text-[11px] text-zinc-400 flex-1 truncate">{p.productType}</span>
                                  <Badge
                                    variant={p.warrantyStatus === "active" ? "success" : p.warrantyStatus === "expired" ? "danger" : "neutral"}
                                    dot
                                  >
                                    {p.warrantyStatus === "active" ? "Aktif" : p.warrantyStatus === "expired" ? "Berakhir" : "—"}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Detail Pembelian" size="lg">
        {selected && (() => {
          const products = getGroupProducts(selected);
          const days = getDaysRemaining(selected.warrantyEndDate);
          return (
            <div className="space-y-5">
              {/* Header */}
              <div className="flex items-start gap-3 p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
                  <ShoppingBag size={18} className="text-zinc-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono text-xs bg-zinc-200 text-zinc-600 px-2 py-0.5 rounded-md">{selected.id.toUpperCase()}</span>
                    <span className="text-xs text-zinc-400">·</span>
                    <span className="text-xs text-zinc-500">{formatDateShort(selected.registeredAt)}</span>
                  </div>
                  <p className="text-sm font-semibold text-zinc-900">{selected.customerName}</p>
                  <p className="text-xs text-zinc-400">{selected.customerEmail} · {selected.customerPhone}</p>
                </div>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-zinc-50 rounded-xl">
                  <div className="flex items-center gap-1.5 mb-1"><Calendar size={12} className="text-zinc-400" /><p className="text-[11px] text-zinc-400">Tgl Pembelian</p></div>
                  <p className="text-xs font-semibold text-zinc-800">{formatDateShort(selected.purchaseDate)}</p>
                </div>
                <div className="p-3 bg-zinc-50 rounded-xl">
                  <div className="flex items-center gap-1.5 mb-1"><Package size={12} className="text-zinc-400" /><p className="text-[11px] text-zinc-400">Jumlah Produk</p></div>
                  <p className="text-xs font-semibold text-zinc-800">{selected.serialNumbers.length} unit</p>
                </div>
                <div className="p-3 bg-zinc-50 rounded-xl">
                  <div className="flex items-center gap-1.5 mb-1"><Users size={12} className="text-zinc-400" /><p className="text-[11px] text-zinc-400">Didaftarkan</p></div>
                  <p className="text-xs font-semibold text-zinc-800">{selected.dealerName ?? selected.registeredByName ?? "—"}</p>
                </div>
              </div>

              {/* Warranty period */}
              <div className="p-3 border border-zinc-100 rounded-xl">
                <p className="text-[11px] text-zinc-400 mb-1">Periode Garansi</p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-zinc-600">{formatDateShort(selected.purchaseDate)}</span>
                    <span className="text-zinc-300 mx-2">→</span>
                    <span className="text-xs text-zinc-600">{formatDateShort(selected.warrantyEndDate)}</span>
                  </div>
                  {days > 0 ? (
                    <Badge variant="success">{days} hari tersisa</Badge>
                  ) : (
                    <Badge variant="danger">Berakhir</Badge>
                  )}
                </div>
              </div>

              {/* Products */}
              <div>
                <p className="text-xs font-semibold text-zinc-700 mb-2">Produk dalam pembelian ini</p>
                <div className="space-y-1.5">
                  {products.map(p => (
                    <div key={p.id} className="flex items-center gap-3 p-3 bg-zinc-50 border border-zinc-100 rounded-xl">
                      <span className="font-mono text-xs bg-white border border-zinc-200 px-2 py-1 rounded-md text-zinc-700 shrink-0">{p.serialNumber}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-zinc-800">{p.productType}</p>
                        <p className="text-[11px] text-zinc-400">{p.productCategory}</p>
                      </div>
                      <Badge variant={p.warrantyStatus === "active" ? "success" : p.warrantyStatus === "expired" ? "danger" : "neutral"} dot>
                        {p.warrantyStatus === "active" ? "Aktif" : p.warrantyStatus === "expired" ? "Berakhir" : "—"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Invoice */}
              <div className="flex items-center gap-3 p-3 border border-zinc-100 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                  <FileText size={14} className="text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-zinc-800">{selected.invoiceFileName}</p>
                  <p className="text-[11px] text-zinc-400">Invoice · PDF</p>
                </div>
                <Button size="xs" variant="outline">Lihat Invoice</Button>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setSelected(null)}>Tutup</Button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
