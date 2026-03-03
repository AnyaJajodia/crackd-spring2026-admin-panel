"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Loader2, Pencil, Save, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  AdminManagementLayout,
  BooleanBadge,
  FilterChipGroup,
  ManagementTableState,
  ThumbnailSquare,
} from "@/components/admin/AdminManagementLayout";
import { useDebouncedValue } from "@/components/admin/useDebouncedValue";
import { Button } from "@/components/ui/button";
import { getCaptionsPage, updateCaptionRow } from "@/app/admin/captions/actions";
import {
  type CaptionManagementRow,
  type CaptionsFilterState,
  type PaginatedResult,
} from "@/lib/admin/management-types";
import { cn } from "@/lib/utils";

type CaptionsManagementClientProps = {
  initialData: PaginatedResult<CaptionManagementRow>;
  initialFilters: CaptionsFilterState;
};

type CaptionDraft = {
  is_public: boolean;
  is_featured: boolean;
};

function BooleanSelect(props: {
  value: boolean;
  trueLabel: string;
  falseLabel: string;
  onChange: (value: boolean) => void;
}) {
  const { value, trueLabel, falseLabel, onChange } = props;

  return (
    <select
      value={value ? "true" : "false"}
      onChange={(event) => onChange(event.target.value === "true")}
      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-400"
    >
      <option value="true">{trueLabel}</option>
      <option value="false">{falseLabel}</option>
    </select>
  );
}

export function CaptionsManagementClient({
  initialData,
  initialFilters,
}: CaptionsManagementClientProps) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [filters, setFilters] = React.useState(initialFilters);
  const [searchInput, setSearchInput] = React.useState(initialFilters.search);
  const [data, setData] = React.useState(initialData);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<CaptionDraft | null>(null);
  const [savingId, setSavingId] = React.useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(searchInput, 250);

  const loadRecords = React.useCallback(
    async (nextFilters: CaptionsFilterState) => {
      setLoading(true);
      setError(null);
      try {
      const nextData = await getCaptionsPage(nextFilters);
        setData(nextData);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load captions.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  React.useEffect(() => {
    setData(initialData);
  }, [initialData]);

  React.useEffect(() => {
    setFilters((current) =>
      current.search === debouncedSearch
        ? current
        : {
            ...current,
            search: debouncedSearch,
            page: 1,
          }
    );
  }, [debouncedSearch]);

  React.useEffect(() => {
    void loadRecords(filters);
  }, [filters, loadRecords]);

  const updateFilters = (updater: (current: CaptionsFilterState) => CaptionsFilterState) => {
    React.startTransition(() => setFilters((current) => updater(current)));
  };

  const startEditing = (row: CaptionManagementRow) => {
    setExpandedId(row.id);
    setEditingId(row.id);
    setDraft({
      is_public: Boolean(row.is_public),
      is_featured: Boolean(row.is_featured),
    });
  };

  const handleSave = async (row: CaptionManagementRow) => {
    if (!draft) return;

    const previousRows = data.rows;
    setSavingId(row.id);
    setData((current) => ({
      ...current,
      rows: current.rows.map((item) =>
        item.id === row.id ? { ...item, is_public: draft.is_public, is_featured: draft.is_featured } : item
      ),
    }));

    try {
      const updated = await updateCaptionRow({ id: row.id, ...draft });
      setData((current) => ({
        ...current,
        rows: current.rows.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)),
      }));
      setEditingId(null);
      setDraft(null);
      toast.success("Saved");
      const refreshed = await getCaptionsPage(filters);
      setData(refreshed);
      router.refresh();
    } catch (saveError) {
      setData((current) => ({ ...current, rows: previousRows }));
      toast.error(saveError instanceof Error ? saveError.message : "Failed to save caption.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <AdminManagementLayout
      searchPlaceholder="Search caption text..."
      searchValue={searchInput}
      onSearchChange={setSearchInput}
      controls={
        <>
          <FilterChipGroup
            label="Visibility"
            value={filters.visibility}
            onChange={(value) => updateFilters((current) => ({ ...current, visibility: value, page: 1 }))}
            options={[
              { label: "All", value: "all" },
              { label: "Public", value: "public" },
              { label: "Private", value: "private" },
            ]}
          />
          <FilterChipGroup
            label="Featured"
            value={filters.featured}
            onChange={(value) => updateFilters((current) => ({ ...current, featured: value, page: 1 }))}
            options={[
              { label: "All", value: "all" },
              { label: "Featured", value: "featured" },
              { label: "Not featured", value: "not_featured" },
            ]}
          />
          <FilterChipGroup
            label="Sort"
            value={filters.sort}
            onChange={(value) => updateFilters((current) => ({ ...current, sort: value, page: 1 }))}
            options={[
              { label: "Newest", value: "newest" },
              { label: "Likes", value: "likes" },
            ]}
          />
        </>
      }
      columnHeaders={
        <div className="grid grid-cols-[72px_minmax(0,1fr)_auto_auto_auto_32px] items-center gap-4 px-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          <span>Image</span>
          <span>Caption</span>
          <span>Featured</span>
          <span>Visibility</span>
          <span>Likes</span>
          <span className="text-right">Open</span>
        </div>
      }
      page={data.page}
      totalPages={data.totalPages}
      totalCount={data.totalCount}
      pageSize={filters.pageSize}
      onPrevPage={() => updateFilters((current) => ({ ...current, page: Math.max(1, current.page - 1) }))}
      onNextPage={() =>
        updateFilters((current) => ({ ...current, page: Math.min(data.totalPages, current.page + 1) }))
      }
      onPageSizeChange={(value) => updateFilters((current) => ({ ...current, pageSize: value, page: 1 }))}
    >
      <ManagementTableState
        loading={loading}
        error={error}
        isEmpty={data.rows.length === 0}
        emptyMessage="No captions matched your current filters."
      >
        {data.rows.map((row) => {
          const isExpanded = expandedId === row.id;
          const isEditing = editingId === row.id && draft;

          return (
            <div
              key={row.id}
              className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_12px_24px_rgba(15,23,42,0.06)]"
            >
              <button
                type="button"
                onClick={() =>
                  setExpandedId((current) => {
                    const next = current === row.id ? null : row.id;
                    if (next !== row.id) {
                      setEditingId(null);
                      setDraft(null);
                    }
                    return next;
                  })
                }
                className="grid w-full grid-cols-[72px_minmax(0,1fr)_auto_auto_auto_32px] items-center gap-4 px-4 py-4 text-left transition hover:bg-slate-50"
              >
                <ThumbnailSquare src={row.image_url} alt={row.content ?? "Caption image"} />
                <p className="overflow-hidden text-sm font-medium text-slate-900 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                  {row.content ?? "No caption text."}
                </p>
                <div className="justify-self-start">
                  <BooleanBadge value={row.is_featured} trueLabel="Featured" falseLabel="Not featured" />
                </div>
                <div className="justify-self-start">
                  <BooleanBadge value={row.is_public} trueLabel="Public" falseLabel="Private" />
                </div>
                <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-sm font-medium text-red-700">
                  {row.like_count ?? 0}
                </span>
                <ChevronDown
                  className={cn("h-5 w-5 shrink-0 justify-self-end text-slate-500 transition", isExpanded && "rotate-180")}
                />
              </button>

              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                    animate={reduceMotion ? { opacity: 1 } : { height: "auto", opacity: 1 }}
                    exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                    transition={{ duration: reduceMotion ? 0.12 : 0.24 }}
                    className="overflow-hidden border-t border-slate-200"
                  >
                    <div className="space-y-5 px-5 py-5">
                      <div className="grid gap-4 lg:grid-cols-2">
                        <FieldBlock label="Visibility">
                          {isEditing ? (
                            <BooleanSelect
                              value={draft.is_public}
                              trueLabel="Public"
                              falseLabel="Private"
                              onChange={(value) =>
                                setDraft((current) => (current ? { ...current, is_public: value } : current))
                              }
                            />
                          ) : (
                            <BooleanBadge value={row.is_public} trueLabel="Public" falseLabel="Private" />
                          )}
                        </FieldBlock>
                        <FieldBlock label="Featured">
                          {isEditing ? (
                            <BooleanSelect
                              value={draft.is_featured}
                              trueLabel="Featured"
                              falseLabel="Not featured"
                              onChange={(value) =>
                                setDraft((current) => (current ? { ...current, is_featured: value } : current))
                              }
                            />
                          ) : (
                            <BooleanBadge value={row.is_featured} trueLabel="Featured" falseLabel="Not featured" />
                          )}
                        </FieldBlock>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-2">
                        <FieldBlock label="Humor flavor ID">
                          <p className="break-all text-sm text-slate-700">{row.humor_flavor_id ?? "--"}</p>
                        </FieldBlock>
                        <FieldBlock label="Profile ID">
                          <p className="break-all text-sm text-slate-700">{row.profile_id ?? "--"}</p>
                        </FieldBlock>
                        <FieldBlock label="Image ID">
                          <p className="break-all text-sm text-slate-700">{row.image_id ?? "--"}</p>
                        </FieldBlock>
                        <FieldBlock label="Created">
                          <p className="text-sm text-slate-700">
                            {row.created_datetime_utc ? new Date(row.created_datetime_utc).toLocaleString() : "--"}
                          </p>
                        </FieldBlock>
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {isEditing ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingId(null);
                                setDraft(null);
                              }}
                              className="rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            >
                              <X className="h-4 w-4" />
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => void handleSave(row)}
                              disabled={savingId === row.id}
                              className="rounded-full bg-red-500 text-white hover:bg-red-400"
                            >
                              {savingId === row.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Save className="h-4 w-4" />
                              )}
                              Confirm
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => startEditing(row)}
                            className="rounded-full bg-red-500 text-white hover:bg-red-400"
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </ManagementTableState>
    </AdminManagementLayout>
  );
}

function FieldBlock(props: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <p className="mb-2 text-[11px] uppercase tracking-[0.22em] text-slate-500">{props.label}</p>
      {props.children}
    </div>
  );
}
