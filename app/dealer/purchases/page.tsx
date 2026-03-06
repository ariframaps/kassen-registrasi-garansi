"use client";
// app/dealer/purchases/page.tsx — Dealer: view + edit purchase groups
import { useState, useMemo } from "react";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal, ConfirmModal } from "@/components/ui/modal";
import { Table, TableHead, TableHeader, TableBody, TableRow, TableCell, EmptyState } from "@/components/ui/table";
import { dealerPurchaseGroups, dealerProducts, mockProducts } from "@/lib/mock-data";
import { formatDateShort, getDaysRemaining } from "@/lib/utils";
import { Search, Eye, Pencil, ShoppingBag, FileText, Package, Calendar, Trash2, Plus, X, Check, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import type { PurchaseGroup, Product } from "@/types";

// ── Edit Purchase Modal ──
function EditPurchaseModal({
  group,
  onClose,
}: { group: PurchaseGroup; onClose: () => void }) {
  const [form, setForm] = useState({
    customerName:  group.customerName,
    customerPhone: group.customerPhone,
    customerEmail: group.customerEmail,
    purchaseDate:  group.purchaseDate,
  });
  const [selectedSNs, setSelectedSNs] = useState<string[]>([...group.serialNumbers]);
  const [snSearch, setSnSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { success } = useToast();

  // Products that can be added: dealer's unregistered products not yet in this group
  const addableProducts = dealerProducts.filter(
    p => p.warrantyStatus === "none" && !selectedSNs.includes(p.serialNumber)
      && (p.serialNumber.toLowerCase().includes(snSearch.toLowerCase()) ||
        p.productType.toLowerCase().includes(snSearch.toLowerCase()))
  );

  const addSN = (sn: string) => setSelectedSNs(prev => [...prev, sn]);
  const removeSN = (sn: string) => setSelectedSNs(prev => prev.filter(s => s !== sn));

  const getProduct = (sn: string): Product | undefined =>
    mockProducts.find(p => p.serialNumber === sn);

  const handleSave = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);
    setConfirmOpen(false);
    onClose();
    success("Pembelian berhasil diperbarui", `${selectedSNs.length} produk · ${form.customerName}`);
  };

  return (
    <>
      <Modal open onClose={onClose} title="Edit Pembelian" description={`ID: ${group.id.toUpperCase()}`} size="xl">
        <div className="space-y-5">
          {/* Customer info */}
          <div>
            <p className="text-xs font-semibold text-zinc-700 mb-3">Data Customer</p>
            <div className="space-y-3">
              <Input label="Nama Customer" value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} required />
              <div className="grid grid-cols-2 gap-3">
                <Input label="No. HP" value={form.customerPhone} onChange={e => setForm({ ...form, customerPhone: e.target.value })} required />
                <Input label="Email" type="email" value={form.customerEmail} onChange={e => setForm({ ...form, customerEmail: e.target.value })} required />
              </div>
              <Input label="Tanggal Pembelian (= Mulai Garansi)" type="date" value={form.purchaseDate} onChange={e => setForm({ ...form, purchaseDate: e.target.value })} required />
            </div>
          </div>

          {/* Products in this purchase */}
          <div>
            <p className="text-xs font-semibold text-zinc-700 mb-2">Produk dalam Pembelian Ini</p>
            <div className="border border-zinc-100 rounded-xl overflow-hidden">
              {selectedSNs.map(sn => {
                const p = getProduct(sn);
                const isOriginal = group.serialNumbers.includes(sn);
                return (
                  <div key={sn} className={`flex items-center gap-3 px-4 py-2.5 border-b border-zinc-50 last:border-0 ${!isOriginal ? "bg-emerald-50" : ""}`}>
                    <Package size={12} className="text-zinc-400 shrink-0" />
                    <span className="font-mono text-xs text-zinc-700 shrink-0">{sn}</span>
                    {p && <span className="text-[11px] text-zinc-400 flex-1 truncate">{p.productType} · {p.productCategory}</span>}
                    {!isOriginal && <Badge variant="success">Baru ditambahkan</Badge>}
                    <button
                      onClick={() => removeSN(sn)}
                      className="p-1 rounded hover:bg-red-50 text-zinc-300 hover:text-red-500 transition-colors ml-auto shrink-0"
                      title="Hapus dari pembelian ini"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add products */}
          <div>
            <p className="text-xs font-semibold text-zinc-700 mb-2">Tambah Produk ke Pembelian Ini</p>
            <p className="text-[11px] text-zinc-400 mb-2">Hanya produk yang belum terdaftar garansi dan belum masuk pembelian lain</p>
            <Input
              placeholder="Cari serial number atau tipe produk…"
              value={snSearch}
              onChange={e => setSnSearch(e.target.value)}
              leftIcon={<Search size={13} />}
              className="mb-2"
            />
            {addableProducts.length === 0 ? (
              <p className="text-xs text-zinc-400 py-3 text-center">Tidak ada produk yang bisa ditambahkan</p>
            ) : (
              <div className="border border-zinc-100 rounded-xl max-h-40 overflow-y-auto divide-y divide-zinc-50">
                {addableProducts.map(p => (
                  <button
                    key={p.id}
                    onClick={() => addSN(p.serialNumber)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50 transition-colors text-left"
                  >
                    <Plus size={12} className="text-blue-500 shrink-0" />
                    <span className="font-mono text-xs text-zinc-700 shrink-0">{p.serialNumber}</span>
                    <span className="text-[11px] text-zinc-400 flex-1 truncate">{p.productType}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="outline" fullWidth onClick={onClose}>Batal</Button>
            <Button
              fullWidth
              disabled={selectedSNs.length === 0 || !form.customerName}
              onClick={() => setConfirmOpen(true)}
              icon={<Check size={13} />}
            >
              Simpan Perubahan
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleSave}
        title="Simpan Perubahan?"
        description={`Data pembelian ${group.id.toUpperCase()} akan diperbarui dengan ${selectedSNs.length} produk atas nama ${form.customerName}.`}
        confirmLabel="Simpan"
        loading={loading}
      />
    </>
  );
}

// ── Main Page ──
export default function DealerPurchasesPage() {
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedDetail, setSelectedDetail] = useState<PurchaseGroup | null>(null);
  const [editTarget, setEditTarget] = useState<PurchaseGroup | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return dealerPurchaseGroups.filter(g => {
      const matchSearch =
        g.customerName.toLowerCase().includes(q) ||
        g.customerEmail.toLowerCase().includes(q) ||
        g.serialNumbers.some(sn => sn.toLowerCase().includes(q));
      const matchFrom = !dateFrom || g.purchaseDate >= dateFrom;
      const matchTo   = !dateTo   || g.purchaseDate <= dateTo;
      return matchSearch && matchFrom && matchTo;
    });
  }, [search, dateFrom, dateTo]);

  const getGroupProducts = (g: PurchaseGroup) =>
    mockProducts.filter(p => g.serialNumbers.includes(p.serialNumber));

  const getGroupStatus = (g: PurchaseGroup): "active" | "expired" | "none" => {
    const ps = getGroupProducts(g);
    if (ps.every(p => p.warrantyStatus === "active"))  return "active";
    if (ps.every(p => p.warrantyStatus === "expired")) return "expired";
    return "none";
  };

  return (
    <div>
      <Topbar title="Daftar Pembelian" description="Riwayat registrasi garansi per transaksi" />
      <div className="p-6 animate-fade-up">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-5">
          {[
            { l: "Total Pembelian", v: dealerPurchaseGroups.length, c: "text-zinc-900" },
            { l: "Garansi Aktif",   v: dealerPurchaseGroups.filter(g => getGroupStatus(g) === "active").length,  c: "text-emerald-600" },
            { l: "Garansi Berakhir",v: dealerPurchaseGroups.filter(g => getGroupStatus(g) === "expired").length, c: "text-red-600" },
          ].map(s => (
            <div key={s.l} className="bg-white border border-zinc-200 rounded-xl px-4 py-3.5 shadow-sm">
              <p className="text-xs text-zinc-400 mb-1">{s.l}</p>
              <p className={`text-2xl font-semibold font-mono ${s.c}`}>{s.v}</p>
            </div>
          ))}
        </div>

        <Card>
          <div className="px-5 py-3.5 border-b border-zinc-100 flex flex-wrap gap-2.5 items-center">
            <div className="flex-1 min-w-48 max-w-64">
              <Input placeholder="Cari customer atau serial number…" value={search} onChange={e => setSearch(e.target.value)} leftIcon={<Search size={13} />} />
            </div>
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
                <TableHeader>ID Grup</TableHeader>
                <TableHeader>Customer</TableHeader>
                <TableHeader>Produk</TableHeader>
                <TableHeader>Tgl Beli</TableHeader>
                <TableHeader>Garansi s/d</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader className="text-right pr-5">Aksi</TableHeader>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7}><EmptyState icon={<ShoppingBag size={18} />} title="Tidak ada pembelian" description="Belum ada registrasi garansi" /></td></tr>
                ) : filtered.map(g => {
                  const status = getGroupStatus(g);
                  const days = getDaysRemaining(g.warrantyEndDate);
                  const products = getGroupProducts(g);
                  return (
                    <TableRow key={g.id}>
                      <TableCell>
                        <span className="font-mono text-xs bg-zinc-100 text-zinc-600 px-2 py-1 rounded-md">{g.id.toUpperCase()}</span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-xs font-medium text-zinc-900">{g.customerName}</p>
                          <p className="text-[11px] text-zinc-400">{g.customerPhone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold font-mono text-zinc-700">{g.serialNumbers.length}</span>
                          <span className="text-xs text-zinc-400">unit</span>
                          <button
                            onClick={() => setSelectedDetail(g)}
                            className="text-[11px] text-blue-500 hover:underline ml-1"
                          >
                            lihat
                          </button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-zinc-500">{formatDateShort(g.purchaseDate)}</span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-xs text-zinc-500">{formatDateShort(g.warrantyEndDate)}</p>
                          {days > 0 && days < 180 && (
                            <p className="text-[11px] text-amber-600">{days} hari lagi</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status === "active" ? "success" : status === "expired" ? "danger" : "neutral"} dot>
                          {status === "active" ? "Aktif" : status === "expired" ? "Berakhir" : "—"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setSelectedDetail(g)} className="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors" title="Detail"><Eye size={13} /></button>
                          <button onClick={() => setEditTarget(g)} className="p-1.5 rounded-md hover:bg-blue-50 text-zinc-400 hover:text-blue-600 transition-colors" title="Edit"><Pencil size={13} /></button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Detail Modal */}
      <Modal open={!!selectedDetail} onClose={() => setSelectedDetail(null)} title="Detail Pembelian" size="lg">
        {selectedDetail && (() => {
          const products = getGroupProducts(selectedDetail);
          const days = getDaysRemaining(selectedDetail.warrantyEndDate);
          return (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-zinc-50 rounded-xl">
                  <p className="text-[11px] text-zinc-400 mb-0.5">Customer</p>
                  <p className="text-xs font-semibold text-zinc-900">{selectedDetail.customerName}</p>
                  <p className="text-[11px] text-zinc-400">{selectedDetail.customerEmail}</p>
                  <p className="text-[11px] text-zinc-400 font-mono">{selectedDetail.customerPhone}</p>
                </div>
                <div className="p-3 bg-zinc-50 rounded-xl space-y-1">
                  <div><p className="text-[11px] text-zinc-400">Tgl Pembelian</p><p className="text-xs font-medium text-zinc-800">{formatDateShort(selectedDetail.purchaseDate)}</p></div>
                  <div><p className="text-[11px] text-zinc-400">Garansi s/d</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium text-zinc-800">{formatDateShort(selectedDetail.warrantyEndDate)}</p>
                      {days > 0 ? <Badge variant="success">{days}h</Badge> : <Badge variant="danger">Berakhir</Badge>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Products */}
              <div>
                <p className="text-xs font-semibold text-zinc-700 mb-2">{products.length} Produk</p>
                <div className="space-y-1.5">
                  {products.map(p => (
                    <div key={p.id} className="flex items-center gap-3 p-2.5 bg-zinc-50 border border-zinc-100 rounded-xl">
                      <span className="font-mono text-xs bg-white border border-zinc-200 px-2 py-0.5 rounded-md text-zinc-700">{p.serialNumber}</span>
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
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <FileText size={14} className="text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-zinc-800">{selectedDetail.invoiceFileName}</p>
                  <p className="text-[11px] text-zinc-400">Invoice</p>
                </div>
                <Button size="xs" variant="outline">Lihat</Button>
              </div>

              <div className="flex gap-2 pt-1">
                <Button variant="outline" fullWidth onClick={() => setSelectedDetail(null)}>Tutup</Button>
                <Button
                  variant="secondary"
                  fullWidth
                  icon={<Pencil size={13} />}
                  onClick={() => { setSelectedDetail(null); setEditTarget(selectedDetail); }}
                >
                  Edit Pembelian
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Edit Modal */}
      {editTarget && (
        <EditPurchaseModal group={editTarget} onClose={() => setEditTarget(null)} />
      )}
    </div>
  );
}
