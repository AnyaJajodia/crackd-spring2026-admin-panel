"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AdminManagementLayoutProps = {
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  controls: React.ReactNode;
  columnHeaders: React.ReactNode;
  children: React.ReactNode;
  page: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  onPageSizeChange: (value: number) => void;
};

type FilterChipGroupProps<T extends string> = {
  label: string;
  value: T;
  options: Array<{ label: string; value: T }>;
  onChange: (value: T) => void;
};

export function AdminManagementLayout({
  searchPlaceholder,
  searchValue,
  onSearchChange,
  controls,
  columnHeaders,
  children,
  page,
  totalPages,
  totalCount,
  pageSize,
  onPrevPage,
  onNextPage,
  onPageSizeChange,
}: AdminManagementLayoutProps) {
  return (
    <section className="flex h-[calc(100vh-7.5rem)] min-h-[680px] flex-col overflow-hidden rounded-[32px] border border-red-500/10 bg-white/92 shadow-[0_0_0_1px_rgba(255,255,255,0.6),0_22px_60px_rgba(15,23,42,0.14),0_0_38px_rgba(220,38,38,0.08)] backdrop-blur">
      <div className="sticky top-0 z-20 shrink-0 border-b border-slate-200/90 bg-white/95 px-5 py-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <label className="relative block min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-12 w-full rounded-2xl border border-slate-300 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-500 focus:border-red-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(248,113,113,0.12)]"
            />
          </label>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">{controls}</div>
        </div>

        <div className="mt-3 border-t border-slate-200 pt-3">{columnHeaders}</div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>

      <div className="sticky bottom-0 z-20 shrink-0 flex flex-col gap-3 border-t border-slate-200 bg-white/95 px-5 py-4 text-sm text-slate-700 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span>
            Page {page} of {totalPages}
          </span>
          <span className="text-slate-500">{totalCount} total</span>
        </div>
        <div className="flex items-center gap-2">
          <FilterChipGroup
            label="Size"
            value={String(pageSize)}
            onChange={(value) => onPageSizeChange(Number(value))}
            options={[
              { label: "5", value: "5" },
              { label: "10", value: "10" },
              { label: "20", value: "20" },
              { label: "50", value: "50" },
            ]}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={onPrevPage}
            disabled={page <= 1}
            className="rounded-full border-slate-300 bg-white text-slate-800 hover:bg-slate-100"
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onNextPage}
            disabled={page >= totalPages}
            className="rounded-full border-slate-300 bg-white text-slate-800 hover:bg-slate-100"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}

export function FilterChipGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: FilterChipGroupProps<T>) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-slate-300 bg-slate-100 p-1.5 shadow-sm">
      <span className="px-2 text-[11px] uppercase tracking-[0.22em] text-slate-600">{label}</span>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-full border px-3 py-1.5 text-sm transition",
            option.value === value
              ? "border-red-500 bg-red-500 text-white shadow-[0_0_18px_rgba(239,68,68,0.18)]"
              : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function ManagementTableState({
  loading,
  error,
  isEmpty,
  emptyMessage,
  children,
}: {
  loading: boolean;
  error: string | null;
  isEmpty: boolean;
  emptyMessage: string;
  children: React.ReactNode;
}) {
  if (error) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-red-500/20 bg-red-500/5 px-6 text-center text-sm text-red-100">
        {error}
      </div>
    );
  }

  if (loading && isEmpty) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 px-6 text-sm text-slate-600">
        Loading...
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 px-6 text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return <div className={cn("space-y-3 transition-opacity", loading && "opacity-70")}>{children}</div>;
}

export function ThumbnailSquare({
  src,
  alt,
  className,
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = React.useState(false);

  return (
    <div
      className={cn(
        "relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-100 to-slate-200",
        className
      )}
    >
      {!src || failed ? (
        <div className="flex h-full w-full items-center justify-center text-[10px] uppercase tracking-[0.24em] text-slate-500">
          No Img
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}

export function LargeImagePreview({ src, alt }: { src?: string | null; alt: string }) {
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    setFailed(false);
  }, [src]);

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-100 to-slate-200">
      {!src || failed ? (
        <div className="flex h-full w-full items-center justify-center text-xs font-medium uppercase tracking-[0.24em] text-slate-500">
          No Preview
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-contain bg-white"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}

export function BooleanBadge({
  value,
  trueLabel,
  falseLabel,
}: {
  value: boolean | null;
  trueLabel: string;
  falseLabel: string;
}) {
  const active = Boolean(value);

  return (
    <span
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.16em]",
        active
          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
          : "border-slate-300 bg-slate-100 text-slate-600"
      )}
    >
      {active ? trueLabel : falseLabel}
    </span>
  );
}
