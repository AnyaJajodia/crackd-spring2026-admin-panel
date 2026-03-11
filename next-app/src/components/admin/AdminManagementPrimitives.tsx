"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FieldBlock({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-3xl border border-slate-200 bg-slate-50 p-4", className)}>
      <p className="mb-2 text-[11px] uppercase tracking-[0.22em] text-slate-500">{label}</p>
      {children}
    </div>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "number";
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-red-400"
    />
  );
}

export function TextArea({
  value,
  onChange,
  rows = 4,
  preserveWhitespace = false,
  placeholder,
}: {
  value: string;
  onChange?: (value: string) => void;
  rows?: number;
  preserveWhitespace?: boolean;
  placeholder?: string;
}) {
  if (!onChange) {
    return (
      <pre
        className={cn(
          "overflow-x-auto rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700",
          preserveWhitespace ? "whitespace-pre-wrap font-sans" : "whitespace-pre-wrap font-sans"
        )}
      >
        {value || "No content."}
      </pre>
    );
  }

  return (
    <textarea
      rows={rows}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="min-h-24 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-400"
    />
  );
}

export function SelectField({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-red-400"
    >
      {placeholder ? <option value="">{placeholder}</option> : null}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ label: string; value: T }>;
  onChange: (value: T) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-[11px] uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-slate-100 p-1.5 shadow-sm">
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
    </div>
  );
}

export function DetailText({
  value,
  mutedFallback,
  preserveWhitespace = false,
}: {
  value: string | null | undefined;
  mutedFallback?: string;
  preserveWhitespace?: boolean;
}) {
  if (!value) {
    return <p className="text-sm text-slate-500">{mutedFallback ?? "None"}</p>;
  }

  return (
    <p className={cn("text-sm text-slate-700", preserveWhitespace && "whitespace-pre-wrap")}>
      {value}
    </p>
  );
}

export function MetadataText({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <p className="break-all text-xs text-slate-500">
      <span className="font-medium text-slate-600">{label}</span> {value}
    </p>
  );
}

export function ExpandableRow({
  header,
  children,
  open,
  onToggle,
}: {
  header: React.ReactNode;
  children: React.ReactNode;
  open: boolean;
  onToggle: () => void;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_12px_24px_rgba(15,23,42,0.06)]">
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left transition hover:bg-slate-50"
      >
        {header}
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={reduceMotion ? { opacity: 1 } : { height: "auto", opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.12 : 0.24 }}
            className="overflow-hidden border-t border-slate-200"
          >
            <div className="space-y-5 px-5 py-5">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function ExpandChevron({ open, className }: { open: boolean; className?: string }) {
  return (
    <ChevronDown
      className={cn("h-5 w-5 shrink-0 text-slate-500 transition", open && "rotate-180", className)}
    />
  );
}

export function ModalActions({
  onCancel,
  onConfirm,
  cancelLabel = "Cancel",
  confirmLabel,
  confirmDisabled,
  confirmVariant = "primary",
  loading,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  cancelLabel?: string;
  confirmLabel: string;
  confirmDisabled?: boolean;
  confirmVariant?: "primary" | "danger";
  loading?: React.ReactNode;
}) {
  return (
    <div className="flex justify-end gap-2">
      <Button variant="outline" onClick={onCancel} className="rounded-full border-slate-300">
        {cancelLabel}
      </Button>
      <Button
        onClick={onConfirm}
        disabled={confirmDisabled}
        className={cn(
          "rounded-full text-white",
          confirmVariant === "danger"
            ? "bg-red-500 hover:bg-red-400"
            : "bg-red-500 hover:bg-red-400"
        )}
      >
        {loading}
        {!loading ? confirmLabel : null}
      </Button>
    </div>
  );
}

export function formatAdminDate(value: string | null | undefined) {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}
