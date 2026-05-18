"use client";
// app/dashboard/logs/page.tsx — Admin only
import { useState, useEffect, useCallback } from "react";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import {
  Table, TableHead, TableHeader, TableBody, TableRow, TableCell, EmptyState,
} from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
// import { auditLogAdapter } from "@/lib/adapters";
// import type { AuditLog } from "@/lib/adapters";
import { Search, FileText, X, ChevronRight } from "lucide-react";

// ── Helpers ──

type LogCategory = AuditLog["category"];
type LogPriority = AuditLog["priority"];

const CATEGORIES: { value: LogCategory | ""; label: string }[] = [
  { value: "", label: "Semua Kategori" },
  { value: "AUTH", label: "Auth" },
  { value: "PRODUCT", label: "Product" },
  { value: "WARRANTY", label: "Warranty" },
  { value: "DEALER", label: "Dealer" },
  { value: "USER", label: "User" },
  { value: "PURCHASE", label: "Purchase" },
  { value: "WAITING_LIST", label: "Waiting List" },
  { value: "SYSTEM", label: "System" },
];

const PRIORITIES: { value: LogPriority | ""; label: string }[] = [
  { value: "", label: "Semua Prioritas" },
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
];

function priorityBadge(priority: LogPriority) {
  if (priority === "HIGH") return <Badge variant="danger">{priority}</Badge>;
  if (priority === "MEDIUM") return <Badge variant="warning">{priority}</Badge>;
  return <Badge variant="neutral">{priority}</Badge>;
}

function categoryBadge(cat: LogCategory) {
  const map: Record<LogCategory, "blue" | "success" | "warning" | "info" | "neutral" | "danger"> = {
    AUTH: "blue",
    PRODUCT: "info",
    WARRANTY: "success",
    DEALER: "info",
    USER: "warning",
    PURCHASE: "success",
    WAITING_LIST: "neutral",
    SYSTEM: "danger",
  };
  return <Badge variant={map[cat]}>{cat}</Badge>;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ── Log Detail Modal ──
function LogDetailModal({ log, onClose }: { log: AuditLog | null; onClose: () => void }) {
  return (
    <Modal open={!!log} onClose={onClose} title="Detail Log" size="xl">
      {log && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-zinc-400 mb-0.5">Event</p>
              <p className="text-sm font-mono font-medium text-zinc-900">{log.event}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-400 mb-0.5">Waktu</p>
              <p className="text-sm text-zinc-700">{formatDateTime(log.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-400 mb-0.5">Kategori</p>
              {categoryBadge(log.category)}
            </div>
            <div>
              <p className="text-xs text-zinc-400 mb-0.5">Prioritas</p>
              {priorityBadge(log.priority)}
            </div>
            {log.actorName && (
              <div>
                <p className="text-xs text-zinc-400 mb-0.5">Aktor</p>
                <p className="text-sm text-zinc-700">
                  {log.actorName}
                  {log.actorRole && (
                    <span className="text-zinc-400 ml-1">({log.actorRole})</span>
                  )}
                </p>
              </div>
            )}
            {log.targetLabel && (
              <div>
                <p className="text-xs text-zinc-400 mb-0.5">Target</p>
                <p className="text-sm text-zinc-700">{log.targetLabel}</p>
              </div>
            )}
            {log.ipAddress && (
              <div>
                <p className="text-xs text-zinc-400 mb-0.5">IP Address</p>
                <p className="text-sm font-mono text-zinc-700">{log.ipAddress}</p>
              </div>
            )}
          </div>

          <div>
            <p className="text-xs text-zinc-400 mb-1.5">Data (JSONB)</p>
            <pre className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-xs font-mono text-zinc-700 overflow-x-auto whitespace-pre-wrap break-all">
              {JSON.stringify(log.data, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function LogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<LogCategory | "">("");
  const [priority, setPriority] = useState<LogPriority | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await auditLogAdapter.getPaginated({
      page,
      pageSize,
      search: search || undefined,
      category: category || undefined,
      priority: priority || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    });
    setLogs(result.items);
    setTotal(result.total);
    setLoading(false);
  }, [page, pageSize, search, category, priority, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  const resetFilters = () => {
    setSearch("");
    setCategory("");
    setPriority("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const hasFilters = search || category || priority || dateFrom || dateTo;

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg)]">
      <Topbar title="Audit Log" />
      <main className="flex-1 p-6 space-y-5 animate-fade-up">

        <Card>
          <CardHeader
            title="Log Aktivitas Sistem"
            description="Semua aksi bisnis user yang tercatat di sistem"
            action={
              hasFilters ? (
                <Button variant="ghost" size="sm" icon={<X size={13} />} onClick={resetFilters}>
                  Reset Filter
                </Button>
              ) : undefined
            }
          />

          {/* Filters */}
          <div className="px-5 py-3 border-b border-zinc-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
            <Input
              placeholder="Cari event, aktor, target…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              leftIcon={<Search size={13} />}
              className="lg:col-span-2"
            />
            <Select
              options={CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
              placeholder="Semua Kategori"
              value={category}
              onChange={(e) => { setCategory(e.target.value as LogCategory | ""); setPage(1); }}
            />
            <Select
              options={PRIORITIES.map((p) => ({ value: p.value, label: p.label }))}
              placeholder="Semua Prioritas"
              value={priority}
              onChange={(e) => { setPriority(e.target.value as LogPriority | ""); setPage(1); }}
            />
            <div className="flex gap-1">
              <Input
                type="date"
                placeholder="Dari"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                className="text-xs"
              />
              <Input
                type="date"
                placeholder="Sampai"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                className="text-xs"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-14 text-center text-sm text-zinc-400">Memuat log…</div>
          ) : (
            <>
              <Table>
                <TableHead>
                  <TableHeader>Waktu</TableHeader>
                  <TableHeader>Event</TableHeader>
                  <TableHeader>Kategori</TableHeader>
                  <TableHeader>Prioritas</TableHeader>
                  <TableHeader>Aktor</TableHeader>
                  <TableHeader>Target</TableHeader>
                  <TableHeader className="w-8"></TableHeader>
                </TableHead>
                <TableBody>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={7}>
                        <EmptyState
                          icon={<FileText size={18} />}
                          title="Tidak ada log"
                          description="Tidak ada log yang cocok dengan filter yang dipilih"
                        />
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <TableRow key={log.id} onClick={() => setSelectedLog(log)}>
                        <TableCell className="text-xs text-zinc-500 whitespace-nowrap">
                          {formatDateTime(log.createdAt)}
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-xs text-zinc-800">{log.event}</span>
                        </TableCell>
                        <TableCell>{categoryBadge(log.category)}</TableCell>
                        <TableCell>{priorityBadge(log.priority)}</TableCell>
                        <TableCell className="text-xs text-zinc-600">
                          {log.actorName ?? <span className="text-zinc-300">—</span>}
                        </TableCell>
                        <TableCell className="text-xs text-zinc-600 max-w-[180px] truncate">
                          {log.targetLabel ?? <span className="text-zinc-300">—</span>}
                        </TableCell>
                        <TableCell>
                          <ChevronRight size={13} className="text-zinc-300" />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <Pagination
                page={page}
                pageSize={pageSize}
                total={total}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            </>
          )}
        </Card>
      </main>

      <LogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  );
}
