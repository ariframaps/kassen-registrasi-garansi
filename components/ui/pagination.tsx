"use client";
// components/ui/pagination.tsx
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Select } from "./select";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const PAGE_SIZE_OPTIONS = [
  { value: "10", label: "10 / halaman" },
  { value: "20", label: "20 / halaman" },
  { value: "30", label: "30 / halaman" },
  { value: "40", label: "40 / halaman" },
  { value: "50", label: "50 / halaman" },
  { value: "100", label: "100 / halaman" },
];

export function Pagination({ page, pageSize, total, onPageChange, onPageSizeChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const btn = (onClick: () => void, disabled: boolean, children: React.ReactNode, title?: string) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="h-7 w-7 flex items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-500
        hover:bg-zinc-50 hover:border-zinc-300 hover:text-zinc-700
        disabled:opacity-40 disabled:pointer-events-none transition-all text-xs"
    >
      {children}
    </button>
  );

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-100 bg-white rounded-b-xl">
      {/* Left: info */}
      <p className="text-xs text-zinc-500">
        {total === 0 ? "Tidak ada data" : `${from}–${to} dari ${total} data`}
      </p>

      {/* Right: controls */}
      <div className="flex items-center gap-2">
        <div className="w-36">
          <Select
            options={PAGE_SIZE_OPTIONS}
            value={String(pageSize)}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value));
              onPageChange(1);
            }}
            className="h-7 text-xs"
          />
        </div>

        <div className="flex items-center gap-1">
          {btn(() => onPageChange(1), page === 1, <ChevronsLeft size={12} />, "Halaman pertama")}
          {btn(() => onPageChange(page - 1), page === 1, <ChevronLeft size={12} />, "Sebelumnya")}

          <span className="text-xs text-zinc-600 px-2 min-w-[80px] text-center">
            {page} / {totalPages}
          </span>

          {btn(() => onPageChange(page + 1), page >= totalPages, <ChevronRight size={12} />, "Berikutnya")}
          {btn(() => onPageChange(totalPages), page >= totalPages, <ChevronsRight size={12} />, "Halaman terakhir")}
        </div>
      </div>
    </div>
  );
}
