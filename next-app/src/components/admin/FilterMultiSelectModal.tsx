"use client";

import * as React from "react";

import { AdminModal } from "@/components/admin/AdminModal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FilterMultiSelectModalProps = {
  title: string;
  open: boolean;
  onClose: () => void;
  options: Array<{ value: string; label: string }>;
  selectedValues: string[];
  onApply: (values: string[]) => void;
};

export function FilterMultiSelectModal({
  title,
  open,
  onClose,
  options,
  selectedValues,
  onApply,
}: FilterMultiSelectModalProps) {
  const [localValues, setLocalValues] = React.useState<string[]>(selectedValues);

  React.useEffect(() => {
    if (open) {
      setLocalValues(selectedValues);
    }
  }, [open, selectedValues]);

  const toggleValue = (value: string) => {
    setLocalValues((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    );
  };

  return (
    <AdminModal open={open} onClose={onClose} title={title}>
      <div className="space-y-5">
        <div className="max-h-[420px] overflow-y-auto rounded-3xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex flex-wrap gap-2">
            {options.map((option) => {
              const selected = localValues.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleValue(option.value)}
                  className={cn(
                    "rounded-full border px-3 py-2 text-sm transition",
                    selected
                      ? "border-red-500 bg-red-500 text-white shadow-[0_0_18px_rgba(239,68,68,0.18)]"
                      : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setLocalValues([])}
            className="rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            Clear
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="rounded-full border-slate-300">
              Cancel
            </Button>
            <Button
              onClick={() => {
                onApply(localValues);
                onClose();
              }}
              className="rounded-full bg-red-500 text-white hover:bg-red-400"
            >
              Apply
            </Button>
          </div>
        </div>
      </div>
    </AdminModal>
  );
}
