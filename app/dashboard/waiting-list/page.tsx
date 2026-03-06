"use client";
// app/dashboard/waiting-list/page.tsx
// Revision: 
// - column "end user / dealer"
// - when sending notification: check if SN exists in system first
//   - if not found: warn "SN mungkin typo, suruh cek ulang"
//   - if found: send warranty detail to email

import { useState } from "react";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal, ConfirmModal } from "@/components/ui/modal";
import { Table, TableHead, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { mockWaitingList, mockProducts } from "@/lib/mock-data";
import { normalizeSerialNumber, formatDateShort } from "@/lib/utils";
import { Search, Bell, Trash2, Clock, AlertTriangle, CheckCircle, Users, User } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import type { WaitingListEntry } from "@/types";

export default function WaitingListPage() {
  const [search, setSearch] = useState("");
  const [notifTarget, setNotifTarget] = useState<WaitingListEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [notifLoading, setNotifLoading] = useState(false);
  const { success, warning } = useToast();

  const filtered = mockWaitingList.filter(w =>
    w.serialNumber.toLowerCase().includes(search.toLowerCase()) ||
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.email.toLowerCase().includes(search.toLowerCase())
  );

  // Check if SN actually exists in the system now
  const snExistsInSystem = (sn: string) => {
    const normalized = normalizeSerialNumber(sn);
    return mockProducts.find(p => normalizeSerialNumber(p.serialNumber) === normalized && p.warrantyStatus !== "none");
  };

  const handleSendNotif = async () => {
    if (!notifTarget) return;
    setNotifLoading(true);
    await new Promise(r => setTimeout(r, 700));
    setNotifLoading(false);
    const exists = snExistsInSystem(notifTarget.serialNumber);
    if (exists) {
      setNotifTarget(null);
      success("Notifikasi terkirim", `Detail garansi dikirim ke ${notifTarget.email}`);
    } else {
      setNotifTarget(null);
      warning("SN belum tersedia", "Notifikasi untuk cek ulang serial number telah dikirim ke customer.");
    }
  };

  return (
    <div>
      <Topbar title="Waiting List" description="Serial number yang belum ditemukan di sistem" />
      <div className="p-6 animate-fade-up space-y-5">
        {/* Info */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3.5 flex items-start gap-3">
          <Clock size={15} className="text-amber-600 shrink-0 mt-0.5"/>
          <div>
            <p className="text-xs font-semibold text-amber-800">Cara kerja waiting list</p>
            <p className="text-xs text-amber-700 mt-0.5">End customer atau dealer yang mencari SN yang belum ada di sistem masuk ke sini. Setelah sales upload produk yang cocok, kirim notifikasi manual atau sistem otomatis mengirimkan.</p>
          </div>
        </div>

        <Card>
          <div className="px-5 py-3.5 border-b border-zinc-100 flex gap-3 items-center">
            <div className="flex-1 max-w-72">
              <Input placeholder="Cari SN, nama, atau email…" value={search} onChange={e => setSearch(e.target.value)} leftIcon={<Search size={14}/>} />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Badge variant="warning">{mockWaitingList.filter(w => !w.notified).length} belum notif</Badge>
            </div>
          </div>

          <CardContent className="p-0">
            <Table>
              <TableHead>
                <TableHeader>Serial Number</TableHeader>
                <TableHeader>Pemohon</TableHeader>
                <TableHeader>Tipe</TableHeader>
                <TableHeader>Kontak</TableHeader>
                <TableHeader>Tgl Request</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader className="text-right pr-5">Aksi</TableHeader>
              </TableHead>
              <TableBody>
                {filtered.map(w => {
                  const snReady = !!snExistsInSystem(w.serialNumber);
                  return (
                    <TableRow key={w.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs bg-zinc-100 text-zinc-700 px-2 py-1 rounded-md">{w.serialNumber}</span>
                          {snReady && (
                            <span title="SN sudah ada di sistem">
                              <CheckCircle size={13} className="text-emerald-500"/>
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-medium text-zinc-800">{w.name}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {w.requestorType === "dealer" ? (
                            <><Users size={12} className="text-blue-500 shrink-0"/><Badge variant="blue">Dealer</Badge></>
                          ) : (
                            <><User size={12} className="text-zinc-400 shrink-0"/><Badge variant="neutral">End User</Badge></>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-xs text-zinc-700">{w.email}</p>
                          <p className="text-[11px] text-zinc-400 font-mono">{w.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell><span className="text-xs text-zinc-400">{formatDateShort(w.requestDate)}</span></TableCell>
                      <TableCell>
                        {w.notified ? (
                          <Badge variant="success" dot>Sudah Dinotifikasi</Badge>
                        ) : snReady ? (
                          <Badge variant="blue" dot>SN Tersedia — Siap Notif</Badge>
                        ) : (
                          <Badge variant="warning" dot>Menunggu</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setNotifTarget(w)}
                            className="p-1.5 rounded-md hover:bg-blue-50 text-zinc-400 hover:text-blue-600 transition-colors"
                            title="Kirim notifikasi"
                          >
                            <Bell size={13}/>
                          </button>
                          <button onClick={() => setDeleteTarget(w.id)} className="p-1.5 rounded-md hover:bg-red-50 text-zinc-400 hover:text-red-600 transition-colors">
                            <Trash2 size={13}/>
                          </button>
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

      {/* Smart Notification Modal */}
      {notifTarget && (
        <Modal open={!!notifTarget} onClose={() => setNotifTarget(null)} title="Kirim Notifikasi" size="sm">
          {(() => {
            const exists = snExistsInSystem(notifTarget.serialNumber);
            return (
              <div className="space-y-4">
                <div className={`flex items-start gap-3 p-3.5 rounded-xl border ${exists ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}>
                  {exists ? (
                    <CheckCircle size={16} className="text-emerald-600 shrink-0 mt-0.5"/>
                  ) : (
                    <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5"/>
                  )}
                  <div>
                    <p className={`text-xs font-semibold ${exists ? "text-emerald-800" : "text-amber-800"}`}>
                      {exists ? "Serial number ditemukan di sistem" : "Serial number TIDAK ditemukan di sistem"}
                    </p>
                    <p className={`text-xs mt-0.5 ${exists ? "text-emerald-700" : "text-amber-700"}`}>
                      {exists
                        ? `Detail garansi produk akan dikirim ke ${notifTarget.email}`
                        : `SN "${notifTarget.serialNumber}" mungkin typo. Notifikasi akan meminta ${notifTarget.name} untuk mengecek kembali serial number produknya.`
                      }
                    </p>
                  </div>
                </div>
                <div className="text-xs text-zinc-500 space-y-1">
                  <div className="flex justify-between"><span className="text-zinc-400">Penerima</span><span className="font-medium text-zinc-700">{notifTarget.name}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-400">Email</span><span className="font-medium text-zinc-700">{notifTarget.email}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-400">SN dicari</span><span className="font-mono font-medium text-zinc-700">{notifTarget.serialNumber}</span></div>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" fullWidth onClick={() => setNotifTarget(null)}>Batal</Button>
                  <Button fullWidth loading={notifLoading} onClick={handleSendNotif}
                    icon={<Bell size={13}/>}
                    variant={exists ? "primary" : "secondary"}
                  >
                    {exists ? "Kirim Detail Garansi" : "Kirim Notifikasi Cek Ulang"}
                  </Button>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}

      <ConfirmModal
        open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={() => { setDeleteTarget(null); success("Data dihapus dari waiting list"); }}
        title="Hapus dari Waiting List?" variant="danger"
        description="Data ini akan dihapus permanen dari waiting list."
        confirmLabel="Hapus"
      />
    </div>
  );
}
