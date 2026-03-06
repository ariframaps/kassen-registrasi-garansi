"use client";
// app/dashboard/dealers/page.tsx
import { useState } from "react";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal, ConfirmModal } from "@/components/ui/modal";
import { Table, TableHead, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { mockDealers } from "@/lib/mock-data";
import { formatDateShort } from "@/lib/utils";
import { Search, Plus, Pencil, Trash2, Users } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export default function DealersPage() {
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const { success } = useToast();

  const filtered = mockDealers.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <Topbar title="Dealer" description="Kelola daftar dealer terdaftar" />
      <div className="p-6 animate-fade-up space-y-5">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { l: "Total Dealer",     v: mockDealers.length,                               c: "text-zinc-900" },
            { l: "Dealer Aktif",     v: mockDealers.filter(d => d.status==="active").length,   c: "text-emerald-600" },
            { l: "Dealer Nonaktif",  v: mockDealers.filter(d => d.status==="disabled").length, c: "text-red-600" },
          ].map(s => (
            <div key={s.l} className="bg-white border border-zinc-200 rounded-xl px-5 py-4 shadow-sm">
              <p className="text-xs text-zinc-500 mb-1">{s.l}</p>
              <p className={`text-2xl font-semibold font-mono ${s.c}`}>{s.v}</p>
            </div>
          ))}
        </div>

        <Card>
          <div className="px-5 py-3.5 border-b border-zinc-100 flex gap-3 items-center">
            <div className="flex-1 max-w-72">
              <Input placeholder="Cari dealer…" value={search} onChange={e => setSearch(e.target.value)} leftIcon={<Search size={14}/>} />
            </div>
            <Button size="sm" icon={<Plus size={13}/>} onClick={() => setAddOpen(true)} className="ml-auto">Tambah Dealer</Button>
          </div>
          <CardContent className="p-0">
            <Table>
              <TableHead>
                <TableHeader>Dealer</TableHeader>
                <TableHeader>Email</TableHeader>
                <TableHeader>Telepon</TableHeader>
                <TableHeader>Produk</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Bergabung</TableHeader>
                <TableHeader className="text-right pr-5">Aksi</TableHeader>
              </TableHead>
              <TableBody>
                {filtered.map(d => (
                  <TableRow key={d.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                          <Users size={13} className="text-blue-500"/>
                        </div>
                        <span className="text-xs font-medium text-zinc-900">{d.name}</span>
                      </div>
                    </TableCell>
                    <TableCell><span className="text-xs text-zinc-500">{d.email}</span></TableCell>
                    <TableCell><span className="text-xs font-mono text-zinc-500">{d.phone}</span></TableCell>
                    <TableCell><span className="text-xs font-semibold font-mono text-zinc-800">{d.totalProducts}</span></TableCell>
                    <TableCell>
                      <Badge variant={d.status === "active" ? "success" : "danger"} dot>
                        {d.status === "active" ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </TableCell>
                    <TableCell><span className="text-xs text-zinc-400">{formatDateShort(d.createdAt)}</span></TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors"><Pencil size={12}/></button>
                        <button onClick={() => setDeleteTarget(d.id)} className="p-1.5 rounded-md hover:bg-red-50 text-zinc-400 hover:text-red-600 transition-colors"><Trash2 size={12}/></button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Tambah Dealer Baru" size="sm">
        <div className="space-y-3">
          <Input label="Nama Dealer / Perusahaan" placeholder="PT. Contoh Dealer" value={form.name} onChange={e => setForm({...form,name:e.target.value})} required />
          <Input label="Email" type="email" placeholder="dealer@email.com" value={form.email} onChange={e => setForm({...form,email:e.target.value})} required />
          <Input label="Nomor Telepon" type="tel" placeholder="0812-xxxx-xxxx" value={form.phone} onChange={e => setForm({...form,phone:e.target.value})} required />
          <div className="flex gap-2 pt-2">
            <Button variant="outline" fullWidth onClick={() => setAddOpen(false)}>Batal</Button>
            <Button fullWidth loading={loading} disabled={!form.name || !form.email} onClick={async () => {
              setLoading(true); await new Promise(r=>setTimeout(r,600)); setLoading(false); setAddOpen(false);
              success("Dealer berhasil ditambahkan");
            }}>Tambah</Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={() => { setDeleteTarget(null); success("Dealer dinonaktifkan"); }}
        title="Nonaktifkan Dealer?" variant="danger"
        description="Dealer ini tidak akan bisa login dan meregistrasi garansi. Produk tetap tersimpan."
        confirmLabel="Nonaktifkan"
      />
    </div>
  );
}
