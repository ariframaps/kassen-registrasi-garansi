"use client";
// app/dealer/waiting-list/page.tsx — Dealer request product to waiting list

import { useState } from "react";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Table, TableHead, TableHeader, TableBody, TableRow, TableCell, EmptyState } from "@/components/ui/table";
import { mockWaitingList } from "@/lib/mock-data";
import { formatDateShort, normalizeSerialNumber } from "@/lib/utils";
import { Plus, Clock, CheckCircle, Search } from "lucide-react";
import { useToast } from "@/components/ui/toast";

const dealerRequests = mockWaitingList.filter(w => w.requestorType === "dealer" && w.dealerId === "d1");

export default function DealerWaitingListPage() {
  const [addOpen, setAddOpen] = useState(false);
  const [serialInput, setSerialInput] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const { success } = useToast();

  const handleRequest = async () => {
    if (!serialInput.trim()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 700));
    setLoading(false);
    setAddOpen(false); setSerialInput(""); setNote("");
    success("Request berhasil dikirim", `SN ${normalizeSerialNumber(serialInput)} masuk ke waiting list.`);
  };

  return (
    <div>
      <Topbar title="Request Produk" description="Produk yang belum terdaftar di sistem" />
      <div className="p-6 animate-fade-up space-y-5">
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3.5 flex items-start gap-3">
          <Clock size={15} className="text-blue-600 shrink-0 mt-0.5"/>
          <div>
            <p className="text-xs font-semibold text-blue-800">Cara kerja request produk</p>
            <p className="text-xs text-blue-700 mt-0.5">Jika ada produk yang dikirim ke toko Anda tetapi belum terdaftar di sistem, ajukan request di sini. Tim sales akan memprosesnya dan Anda akan mendapat notifikasi di dashboard.</p>
          </div>
        </div>

        <Card>
          <CardHeader
            title="Daftar Request Saya"
            description="Produk yang Anda request ke tim sales"
            action={<Button size="sm" icon={<Plus size={13}/>} onClick={() => setAddOpen(true)}>Request Produk</Button>}
          />
          <CardContent className="p-0">
            {dealerRequests.length === 0 ? (
              <EmptyState
                icon={<Search size={18}/>}
                title="Belum ada request"
                description="Klik 'Request Produk' jika ada produk yang belum terdaftar"
                action={<Button size="sm" onClick={() => setAddOpen(true)}>Request Produk</Button>}
              />
            ) : (
              <Table>
                <TableHead>
                  <TableHeader>Serial Number</TableHeader>
                  <TableHeader>Tanggal Request</TableHeader>
                  <TableHeader>Status</TableHeader>
                </TableHead>
                <TableBody>
                  {dealerRequests.map(r => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <span className="font-mono text-xs bg-zinc-100 text-zinc-700 px-2 py-1 rounded-md">{r.serialNumber}</span>
                      </TableCell>
                      <TableCell><span className="text-xs text-zinc-400">{formatDateShort(r.requestDate)}</span></TableCell>
                      <TableCell>
                        {r.notified ? (
                          <div className="flex items-center gap-1.5">
                            <Badge variant="success" dot>Terdaftar</Badge>
                            <CheckCircle size={12} className="text-emerald-500"/>
                          </div>
                        ) : (
                          <Badge variant="warning" dot>Menunggu Tim Sales</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Request Produk ke Tim Sales" size="sm">
        <div className="space-y-3">
          <Input
            label="Serial Number Produk"
            placeholder="Contoh: SN-ABCD-1234"
            value={serialInput}
            onChange={e => setSerialInput(e.target.value)}
            required
            hint={serialInput ? `Disimpan sebagai: ${normalizeSerialNumber(serialInput)}` : undefined}
          />
          <Input
            label="Catatan (opsional)"
            placeholder="Misal: produk kiriman tanggal 20 April"
            value={note}
            onChange={e => setNote(e.target.value)}
          />
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
            <p className="text-[11px] text-amber-700">Tim sales akan memverifikasi dan memasukkan produk ke sistem. Anda dapat memantau status di halaman ini.</p>
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="outline" fullWidth onClick={() => setAddOpen(false)}>Batal</Button>
            <Button fullWidth loading={loading} disabled={!serialInput.trim()} onClick={handleRequest}>Kirim Request</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
