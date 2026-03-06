"use client";
// app/check/page.tsx — Public warranty check for end customers
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { normalizeSerialNumber, formatDateShort, getDaysRemaining } from "@/lib/utils";
import { mockProducts } from "@/lib/mock-data";
import { Search, Shield, ShieldOff, CheckCircle2, AlertCircle, Zap, Clock } from "lucide-react";
import { SITE_NAME } from "@/lib/constants";

type State = "idle" | "found" | "notfound" | "submitted";

export default function CheckPage() {
  const [sn, setSn] = useState("");
  const [state, setState] = useState<State>("idle");
  const [loading, setLoading] = useState(false);
  const [found, setFound] = useState<typeof mockProducts[0] | null>(null);
  const [contact, setContact] = useState({ name: "", phone: "", email: "" });
  const [submitting, setSubmitting] = useState(false);
  const [cErrors, setCErrors] = useState<Record<string, string>>({});

  const check = async () => {
    if (!sn.trim()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    const norm = normalizeSerialNumber(sn);
    const p = mockProducts.find(p => normalizeSerialNumber(p.serialNumber) === norm && p.warrantyStatus !== "none");
    setLoading(false);
    if (p) { setFound(p); setState("found"); }
    else setState("notfound");
  };

  const submitContact = async () => {
    const e: Record<string,string> = {};
    if (!contact.name) e.name = "Wajib diisi";
    if (!contact.phone) e.phone = "Wajib diisi";
    if (!contact.email) e.email = "Wajib diisi";
    setCErrors(e);
    if (Object.keys(e).length > 0) return;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 700));
    setSubmitting(false);
    setState("submitted");
  };

  const days = found?.warrantyEndDate ? getDaysRemaining(found.warrantyEndDate) : 0;

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center"><Zap size={13} className="text-white"/></div>
            <span className="text-white font-semibold text-sm">{SITE_NAME}</span>
          </div>
          <span className="text-zinc-500 text-xs">Cek Status Garansi</span>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-6 py-14 animate-fade-up">
        {/* Hero */}
        {state === "idle" && (
          <div className="text-center mb-10">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield size={24} className="text-white"/>
            </div>
            <h1 className="text-2xl font-semibold text-zinc-900 mb-2">Cek Status Garansi</h1>
            <p className="text-sm text-zinc-500">Masukkan serial number produk Anda</p>
          </div>
        )}

        {/* Search box */}
        {(state === "idle" || state === "notfound") && (
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-5">
            <div className="space-y-3">
              <Input
                label="Serial Number"
                placeholder="Contoh: SN-ABCD-1234"
                value={sn}
                onChange={e => setSn(e.target.value)}
                onKeyDown={e => e.key === "Enter" && check()}
                hint="Serial number tertera di label atau kartu garansi produk"
                leftIcon={<Search size={14}/>}
              />
              <Button fullWidth size="lg" loading={loading} onClick={check} disabled={!sn.trim()}>Cek Garansi</Button>
            </div>

            {state === "notfound" && (
              <div className="mt-5 pt-5 border-t border-zinc-100 animate-fade-up">
                <div className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl mb-4">
                  <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5"/>
                  <div>
                    <p className="text-xs font-semibold text-amber-800">Serial number tidak ditemukan</p>
                    <p className="text-xs text-amber-700 mt-0.5">Isi data kontak Anda. Kami akan menghubungi setelah data tersedia.</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <Input label="Nama Lengkap" placeholder="Nama Anda" value={contact.name} onChange={e => setContact({...contact,name:e.target.value})} error={cErrors.name} required/>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="No. HP" type="tel" placeholder="08xx-xxxx" value={contact.phone} onChange={e => setContact({...contact,phone:e.target.value})} error={cErrors.phone} required/>
                    <Input label="Email" type="email" placeholder="email@contoh.com" value={contact.email} onChange={e => setContact({...contact,email:e.target.value})} error={cErrors.email} required/>
                  </div>
                  <Button fullWidth loading={submitting} onClick={submitContact}>Submit</Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Found */}
        {state === "found" && found && (
          <div className="space-y-4 animate-fade-up">
            <div className={`rounded-2xl border p-5 ${found.warrantyStatus === "active" ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2.5 rounded-xl ${found.warrantyStatus === "active" ? "bg-emerald-100" : "bg-red-100"}`}>
                  {found.warrantyStatus === "active" ? <Shield size={20} className="text-emerald-600"/> : <ShieldOff size={20} className="text-red-600"/>}
                </div>
                <div>
                  <p className={`font-semibold text-base ${found.warrantyStatus === "active" ? "text-emerald-800" : "text-red-800"}`}>
                    {found.warrantyStatus === "active" ? "Garansi Aktif" : "Garansi Berakhir"}
                  </p>
                  <p className="font-mono text-xs text-zinc-500">{found.serialNumber}</p>
                </div>
              </div>

              <div className="bg-white/70 rounded-xl p-4 grid grid-cols-2 gap-x-6 gap-y-3">
                {[
                  { l: "Tipe Produk",   v: found.productType },
                  { l: "Dealer",        v: found.assignedDealerName ?? "—" },
                  { l: "Mulai Garansi", v: found.warrantyStartDate ? formatDateShort(found.warrantyStartDate) : "—" },
                  { l: "Berakhir",      v: found.warrantyEndDate ? formatDateShort(found.warrantyEndDate) : "—" },
                ].map(item => (
                  <div key={item.l}>
                    <p className="text-[11px] text-zinc-500">{item.l}</p>
                    <p className="text-xs font-semibold text-zinc-800 mt-0.5">{item.v}</p>
                  </div>
                ))}
              </div>

              {found.warrantyStatus === "active" && days > 0 && (
                <div className="flex items-center gap-2 mt-3 text-emerald-700">
                  <Clock size={13}/>
                  <p className="text-xs font-medium">Sisa <strong>{days} hari</strong></p>
                </div>
              )}
            </div>
            <Button variant="outline" fullWidth onClick={() => { setState("idle"); setSn(""); setFound(null); }} icon={<Search size={13}/>}>
              Cek Serial Number Lain
            </Button>
          </div>
        )}

        {/* Submitted */}
        {state === "submitted" && (
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-8 text-center animate-fade-up">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={24} className="text-emerald-600"/>
            </div>
            <h3 className="text-base font-semibold text-zinc-900 mb-1.5">Data Tersimpan</h3>
            <p className="text-xs text-zinc-500 mb-0.5">Kami akan mengirim notifikasi ke</p>
            <p className="text-sm font-semibold text-blue-600 mb-1">{contact.email}</p>
            <p className="text-[11px] text-zinc-400 mb-6">
              Setelah produk <span className="font-mono font-semibold">{normalizeSerialNumber(sn)}</span> tersedia di sistem.
            </p>
            <Button variant="outline" fullWidth onClick={() => { setState("idle"); setSn(""); setContact({name:"",phone:"",email:""}); }}>
              Cek Serial Number Lain
            </Button>
          </div>
        )}

        <p className="text-center text-[11px] text-zinc-400 mt-8">
          Butuh bantuan? <a href="mailto:info@kassen.com.tw" className="text-blue-600 hover:underline">Hubungi Support</a>
        </p>
      </div>
    </div>
  );
}
