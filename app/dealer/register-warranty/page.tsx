"use client";
// app/dealer/register-warranty/page.tsx
// Revisions:
// - Step 1: searchable by SN AND product type
// - Warranty group: group ID for same customer+date+invoice = 1 pembelian

import { useState } from "react";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { dealerProducts } from "@/lib/mock-data";
import { Check, ChevronRight, Package, X, Upload, CheckCircle2, Search, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

const unregistered = dealerProducts.filter(p => p.warrantyStatus === "none");

interface FormData {
  selectedSNs: string[];
  customerName: string;
  phone: string;
  email: string;
  purchaseDate: string;
  invoiceFile: File | null;
}

const INIT: FormData = {
  selectedSNs: [], customerName: "", phone: "", email: "", purchaseDate: "", invoiceFile: null,
};

export default function RegisterWarrantyPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<FormData>(INIT);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const router = useRouter();
  const { success: toast } = useToast();

  const toggle = (sn: string) => setForm(p => ({
    ...p,
    selectedSNs: p.selectedSNs.includes(sn) ? p.selectedSNs.filter(s => s !== sn) : [...p.selectedSNs, sn],
  }));

  const filteredProducts = unregistered.filter(p => {
    const q = search.toLowerCase();
    return p.serialNumber.toLowerCase().includes(q) || p.productType.toLowerCase().includes(q);
  });

  const validate = () => {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (!form.customerName) e.customerName = "Wajib diisi";
    if (!form.phone) e.phone = "Wajib diisi";
    if (!form.email) e.email = "Wajib diisi";
    if (!form.purchaseDate) e.purchaseDate = "Wajib diisi";
    if (!form.invoiceFile) e.invoiceFile = "Invoice wajib diunggah";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    setSuccess(true);
  };

  // Generates a group ID based on customer+date — for grouping purchases
  const groupId = form.customerName && form.purchaseDate
    ? `GRP-${form.customerName.slice(0,3).toUpperCase()}-${form.purchaseDate.replace(/-/g,"").slice(2)}`
    : null;

  return (
    <div>
      <Topbar title="Registrasi Garansi" />
      <div className="p-6 max-w-xl mx-auto">
        {/* Stepper */}
        <div className="flex items-center gap-0 mb-6 animate-fade-up">
          {[{ n: 1, l: "Pilih Produk" }, { n: 2, l: "Data Customer" }].map((s, i) => (
            <div key={s.n} className="flex items-center flex-1">
              <button
                onClick={() => s.n < step && setStep(s.n as 1 | 2)}
                className="flex items-center gap-2"
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                  step > s.n ? "bg-emerald-500 text-white" : step === s.n ? "bg-blue-600 text-white" : "bg-zinc-200 text-zinc-500"
                }`}>
                  {step > s.n ? <Check size={12}/> : s.n}
                </div>
                <span className={`text-xs font-medium ${step === s.n ? "text-zinc-900" : "text-zinc-400"}`}>{s.l}</span>
              </button>
              {i < 1 && <div className={`flex-1 h-px mx-3 ${step > s.n ? "bg-emerald-400" : "bg-zinc-200"}`}/>}
            </div>
          ))}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <Card className="animate-fade-up">
            <CardHeader title="Pilih Produk" description="Pilih produk yang akan didaftarkan garansinya" />
            <CardContent>
              {/* Search */}
              <div className="mb-3">
                <Input
                  placeholder="Cari serial number atau tipe produk…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  leftIcon={<Search size={14}/>}
                />
              </div>

              {filteredProducts.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-sm text-zinc-400">Tidak ada produk yang cocok</p>
                  {search && <button onClick={() => setSearch("")} className="text-xs text-blue-600 mt-1 hover:underline">Reset pencarian</button>}
                </div>
              ) : (
                <div className="space-y-1.5 max-h-72 overflow-y-auto -mx-1 px-1">
                  {filteredProducts.map(p => {
                    const sel = form.selectedSNs.includes(p.serialNumber);
                    return (
                      <button
                        key={p.id}
                        onClick={() => toggle(p.serialNumber)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-100 ${
                          sel ? "border-blue-400 bg-blue-50 shadow-sm" : "border-zinc-100 hover:border-zinc-200 hover:bg-zinc-50"
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${sel ? "bg-blue-600 border-blue-600" : "border-zinc-300"}`}>
                          {sel && <Check size={10} className="text-white" strokeWidth={3}/>}
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
                          <Package size={14} className="text-zinc-400"/>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-mono text-xs font-semibold text-zinc-900">{p.serialNumber}</p>
                          <p className="text-[11px] text-zinc-400 truncate mt-0.5">{p.productType}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {form.selectedSNs.length > 0 && (
                <div className="mt-3 p-3 rounded-xl bg-blue-50 border border-blue-100">
                  <p className="text-xs text-blue-700 font-medium mb-2">{form.selectedSNs.length} dipilih</p>
                  <div className="flex flex-wrap gap-1.5">
                    {form.selectedSNs.map(sn => (
                      <span key={sn} className="inline-flex items-center gap-1 bg-white border border-blue-200 px-2 py-0.5 rounded-md text-[11px] font-mono text-blue-700">
                        {sn}
                        <button onClick={e => { e.stopPropagation(); toggle(sn); }}><X size={9}/></button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-5">
                <Button variant="outline" onClick={() => router.push("/dealer/dashboard")}>Batal</Button>
                <Button
                  fullWidth
                  disabled={form.selectedSNs.length === 0}
                  icon={<ChevronRight size={14}/>} iconPosition="right"
                  onClick={() => setStep(2)}
                >
                  Lanjutkan ({form.selectedSNs.length})
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <Card className="animate-fade-up">
            <CardHeader title="Data Customer" description={`Untuk ${form.selectedSNs.length} produk terpilih`} />
            <CardContent>
              {/* Selected SNs summary */}
              <div className="p-3 bg-zinc-50 border border-zinc-100 rounded-xl mb-4">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {form.selectedSNs.map(sn => (
                    <span key={sn} className="font-mono text-[11px] bg-white border border-zinc-200 px-2 py-0.5 rounded-md text-zinc-600">{sn}</span>
                  ))}
                </div>
                <p className="text-[11px] text-amber-600">⚠ Semua produk di atas menggunakan 1 data customer & 1 invoice (1 transaksi pembelian)</p>
                {groupId && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="text-[11px] text-zinc-400">ID Grup:</span>
                    <span className="font-mono text-[11px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{groupId}</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Input label="Nama Customer" placeholder="Nama lengkap pembeli" required value={form.customerName} onChange={e => setForm({...form,customerName:e.target.value})} error={errors.customerName}/>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="No. HP" type="tel" placeholder="08xx-xxxx-xxxx" required value={form.phone} onChange={e => setForm({...form,phone:e.target.value})} error={errors.phone}/>
                  <Input label="Email" type="email" placeholder="email@contoh.com" required value={form.email} onChange={e => setForm({...form,email:e.target.value})} error={errors.email}/>
                </div>
                <Input
                  label="Tanggal Terjual (= Tanggal Mulai Garansi)"
                  type="date"
                  required
                  value={form.purchaseDate}
                  onChange={e => setForm({...form,purchaseDate:e.target.value})}
                  error={errors.purchaseDate}
                  hint="Garansi dihitung mulai dari tanggal ini"
                />
                {/* Invoice */}
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1.5">Foto Invoice <span className="text-red-500">*</span></label>
                  <label className={`flex flex-col items-center justify-center p-5 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${form.invoiceFile ? "border-emerald-400 bg-emerald-50" : "border-zinc-200 hover:border-zinc-300 bg-zinc-50"}`}>
                    {form.invoiceFile ? (
                      <div className="flex items-center gap-2 text-emerald-700">
                        <CheckCircle2 size={16}/>
                        <span className="text-xs font-medium">{form.invoiceFile.name}</span>
                        <button type="button" onClick={e => { e.preventDefault(); setForm({...form,invoiceFile:null}); }} className="text-zinc-400 hover:text-zinc-600 ml-1"><X size={12}/></button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload size={20} className="text-zinc-300 mx-auto mb-1.5"/>
                        <p className="text-xs text-zinc-400">Klik untuk upload</p>
                        <p className="text-[11px] text-zinc-300 mt-0.5">PNG, JPG, PDF · maks 4MB</p>
                      </div>
                    )}
                    <input type="file" accept=".png,.jpg,.jpeg,.pdf" className="sr-only" onChange={e => { const f=e.target.files?.[0]; if(f) setForm({...form,invoiceFile:f}); }}/>
                  </label>
                  {errors.invoiceFile && <p className="mt-1 text-xs text-red-600">{errors.invoiceFile}</p>}
                </div>
              </div>

              <div className="flex gap-2 mt-5">
                <Button variant="outline" icon={<ArrowLeft size={13}/>} onClick={() => setStep(1)}>Kembali</Button>
                <Button fullWidth loading={loading} icon={<CheckCircle2 size={14}/>} onClick={handleSubmit}>Submit Registrasi</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Success Modal */}
      <Modal open={success} onClose={() => { setSuccess(false); router.push("/dealer/dashboard"); }} size="sm">
        <div className="text-center py-3">
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={28} className="text-emerald-600"/>
          </div>
          <h3 className="text-base font-semibold text-zinc-900 mb-1.5">Garansi Berhasil Terdaftar</h3>
          <p className="text-xs text-zinc-500 mb-1">
            <span className="font-semibold text-zinc-800">{form.selectedSNs.length} produk</span> atas nama <span className="font-semibold text-zinc-800">{form.customerName}</span>
          </p>
          {groupId && (
            <p className="text-[11px] text-zinc-400 mb-1">Grup: <span className="font-mono text-blue-600">{groupId}</span></p>
          )}
          <p className="text-[11px] text-zinc-400 mb-5">Mulai: {form.purchaseDate}</p>
          <Button fullWidth onClick={() => { setSuccess(false); router.push("/dealer/dashboard"); }}>Kembali ke Dashboard</Button>
        </div>
      </Modal>
    </div>
  );
}
