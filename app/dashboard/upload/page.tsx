"use client";
// app/dashboard/upload/page.tsx
import { useState, useCallback } from "react";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHead, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { ConfirmModal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { Upload, FileSpreadsheet, Download, CheckCircle, AlertTriangle, X } from "lucide-react";
import { normalizeSerialNumber } from "@/lib/utils";

interface PreviewRow {
  serialNumber: string;
  productType: string;
  productCategory: string;
  status: "valid" | "duplicate" | "invalid";
  message?: string;
}

const MOCK_PREVIEW: PreviewRow[] = [
  { serialNumber: "SNNEW001XY", productType: "KDS 2215W",          productCategory: "POS System",      status: "valid" },
  { serialNumber: "SNNEW002AB", productType: "Queue Kiosk - Luna",  productCategory: "POS System",      status: "valid" },
  { serialNumber: "SNAC1234XY", productType: "KDS 2215W",           productCategory: "POS System",      status: "duplicate", message: "Serial number sudah ada di sistem" },
  { serialNumber: "SNNEW004CD", productType: "MC 40C",              productCategory: "Bill Counter",    status: "valid" },
  { serialNumber: "SN 005 INVALID", productType: "",                productCategory: "",                status: "invalid",   message: "Tipe produk wajib diisi" },
];

export default function UploadPage() {
  const [dragOver, setDragOver]       = useState(false);
  const [file, setFile]               = useState<File | null>(null);
  const [previewing, setPreviewing]   = useState(false);
  const [preview, setPreview]         = useState<PreviewRow[] | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [uploading, setUploading]     = useState(false);
  const { success, error }            = useToast();

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f?.name.match(/\.(xlsx|xls)$/)) setFile(f);
    else error("Format tidak valid", "Upload file Excel (.xlsx atau .xls)");
  }, [error]);

  const handlePreview = async () => {
    setPreviewing(true);
    await new Promise(r => setTimeout(r, 900));
    setPreview(MOCK_PREVIEW);
    setPreviewing(false);
  };

  const handleUpload = async () => {
    setUploading(true);
    await new Promise(r => setTimeout(r, 1200));
    setUploading(false);
    setConfirmOpen(false);
    setFile(null); setPreview(null);
    success("Upload berhasil", `${validCount} produk baru ditambahkan ke sistem`);
  };

  const validCount = preview?.filter(r => r.status === "valid").length ?? 0;
  const dupCount   = preview?.filter(r => r.status === "duplicate").length ?? 0;
  const invCount   = preview?.filter(r => r.status === "invalid").length ?? 0;

  return (
    <div>
      <Topbar title="Upload dari Accurate" description="Import data produk dari ekspor file Accurate" />
      <div className="p-6 animate-fade-up space-y-5 max-w-3xl">

        {/* 2-step guide */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { n: "1", t: "Download File dari Accurate", d: "Export file Excel yang tersedia di Accurate" },
            { n: "2", t: "Upload & Konfirmasi",          d: "Upload, preview hasilnya, lalu konfirmasi" },
          ].map(s => (
            <div key={s.n} className="bg-white border border-zinc-100 rounded-xl px-4 py-3.5 shadow-sm flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-white text-[10px] font-bold">{s.n}</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-800">{s.t}</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">{s.d}</p>
              </div>
            </div>
          ))}
        </div>

        <Card>
          <CardHeader
            title="Upload File Excel"
            action={<Button variant="outline" size="xs" icon={<Download size={12} />}>Download Template</Button>}
          />
          <CardContent>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-xl transition-all duration-200 ${
                dragOver   ? "border-blue-400 bg-blue-50"
                : file     ? "border-emerald-400 bg-emerald-50"
                : "border-zinc-200 hover:border-zinc-300 bg-zinc-50"
              }`}
            >
              <div className="py-10 text-center">
                {file ? (
                  <div className="flex flex-col items-center">
                    <FileSpreadsheet size={28} className="text-emerald-500 mb-2" />
                    <p className="text-sm font-medium text-zinc-800">{file.name}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">{(file.size / 1024).toFixed(0)} KB</p>
                    <button
                      onClick={() => { setFile(null); setPreview(null); }}
                      className="mt-2 text-xs text-red-400 hover:text-red-600 flex items-center gap-1"
                    >
                      <X size={11} /> Hapus
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload size={24} className="text-zinc-300 mx-auto mb-2" />
                    <p className="text-sm text-zinc-500">Drag & drop atau klik untuk browse</p>
                    <p className="text-xs text-zinc-400 mt-1">.xlsx atau .xls · maks 10MB</p>
                  </>
                )}
              </div>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={e => { const f = e.target.files?.[0]; if (f) setFile(f); }}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>

            {file && !preview && (
              <div className="mt-4 flex justify-end">
                <Button onClick={handlePreview} loading={previewing} icon={<FileSpreadsheet size={14} />}>
                  Preview Data
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {preview && (
          <Card className="animate-fade-up">
            <CardHeader
              title="Preview Data"
              description="Verifikasi sebelum upload ke sistem"
              action={
                <div className="flex items-center gap-1.5">
                  <Badge variant="success">{validCount} valid</Badge>
                  {dupCount > 0 && <Badge variant="warning">{dupCount} duplikat</Badge>}
                  {invCount > 0 && <Badge variant="danger">{invCount} invalid</Badge>}
                </div>
              }
            />
            <CardContent className="p-0">
              <Table>
                <TableHead>
                  <TableHeader>Serial Number</TableHeader>
                  <TableHeader>Tipe Produk</TableHeader>
                  <TableHeader>Kategori</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Keterangan</TableHeader>
                </TableHead>
                <TableBody>
                  {preview.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <span className="font-mono text-xs bg-zinc-100 text-zinc-700 px-2 py-1 rounded-md">
                          {normalizeSerialNumber(r.serialNumber)}
                        </span>
                      </TableCell>
                      <TableCell><span className="text-xs text-zinc-600">{r.productType || "—"}</span></TableCell>
                      <TableCell><span className="text-xs text-zinc-500">{r.productCategory || "—"}</span></TableCell>
                      <TableCell>
                        <Badge
                          variant={r.status === "valid" ? "success" : r.status === "duplicate" ? "warning" : "danger"}
                          dot
                        >
                          {r.status === "valid" ? "Valid" : r.status === "duplicate" ? "Duplikat" : "Invalid"}
                        </Badge>
                      </TableCell>
                      <TableCell><span className="text-xs text-zinc-400">{r.message ?? "—"}</span></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="px-5 py-4 border-t border-zinc-50">
                {validCount === 0 ? (
                  <div className="flex items-center gap-2 text-xs text-red-600">
                    <AlertTriangle size={14} />
                    <span>Tidak ada data valid. Periksa kembali file Anda.</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-emerald-700">
                      <CheckCircle size={14} />
                      <span><strong>{validCount} produk</strong> siap diupload ke sistem</span>
                    </div>
                    <Button size="sm" icon={<Upload size={13} />} onClick={() => setConfirmOpen(true)}>
                      Upload {validCount} Produk
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleUpload}
        title="Konfirmasi Upload"
        description={`${validCount} produk valid akan ditambahkan ke sistem. ${dupCount + invCount} baris akan diabaikan.`}
        confirmLabel="Upload Sekarang"
        loading={uploading}
      />
    </div>
  );
}
