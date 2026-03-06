"use client";
// components/layout/sidebar.tsx
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  LayoutDashboard, Package, Users, Clock, Upload, LogOut,
  ChevronRight, Shield, ShoppingBag,
} from "lucide-react";

interface NavItem { href: string; label: string; icon: React.ReactNode; badge?: number; }

const adminNav: NavItem[] = [
  { href: "/dashboard",              label: "Dashboard",    icon: <LayoutDashboard size={15} /> },
  { href: "/dashboard/products",     label: "Produk",       icon: <Package size={15} /> },
  { href: "/dashboard/purchases",    label: "Pembelian",    icon: <ShoppingBag size={15} /> },
  { href: "/dashboard/dealers",      label: "Dealer",       icon: <Users size={15} /> },
  { href: "/dashboard/waiting-list", label: "Waiting List", icon: <Clock size={15} />, badge: 2 },
  { href: "/dashboard/upload",       label: "Upload Accurate", icon: <Upload size={15} /> },
];

const dealerNav: NavItem[] = [
  { href: "/dealer/dashboard",          label: "Dashboard",         icon: <LayoutDashboard size={15} /> },
  { href: "/dealer/register-warranty",  label: "Registrasi Garansi",icon: <Shield size={15} /> },
  { href: "/dealer/purchases",          label: "Daftar Pembelian",  icon: <ShoppingBag size={15} /> },
  { href: "/dealer/waiting-list",       label: "Request Produk",    icon: <Clock size={15} /> },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();
  const isDealer = user?.role === "dealer";
  const nav = isDealer ? dealerNav : adminNav;

  const isActive = (href: string) =>
    (href === "/dashboard" || href === "/dealer/dashboard")
      ? pathname === href
      : pathname.startsWith(href);

  return (
    <aside className="w-56 shrink-0 flex flex-col h-screen sticky top-0" style={{ background: "#18181b" }}>
      {/* Logo */}
      <div className="h-14 flex items-center gap-2.5 px-4 border-b border-zinc-800">
        <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
          <Shield size={14} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white leading-none">KassenGaransi</p>
          <p className="text-[10px] text-zinc-500 mt-0.5 capitalize">{user?.role}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <ul className="space-y-0.5">
          {nav.map(item => {
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 group
                    ${active ? "bg-blue-600/15 text-blue-400" : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"}`}
                >
                  <span className={`shrink-0 ${active ? "text-blue-400" : "text-zinc-500 group-hover:text-zinc-300"}`}>
                    {item.icon}
                  </span>
                  <span className="flex-1">{item.label}</span>
                  {item.badge ? (
                    <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {item.badge}
                    </span>
                  ) : active ? (
                    <ChevronRight size={12} className="text-blue-600 opacity-60" />
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User */}
      <div className="border-t border-zinc-800 p-2">
        <div className="flex items-center gap-2.5 px-3 py-2 mb-0.5">
          <div className="w-6 h-6 rounded-full bg-blue-600/20 border border-blue-600/30 flex items-center justify-center shrink-0">
            <span className="text-blue-400 text-[10px] font-bold uppercase">{user?.name?.charAt(0)}</span>
          </div>
          <p className="text-xs font-medium text-zinc-300 truncate">{user?.name}</p>
        </div>
        <button
          onClick={() => { logout(); router.push("/login"); }}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-all"
        >
          <LogOut size={13} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
