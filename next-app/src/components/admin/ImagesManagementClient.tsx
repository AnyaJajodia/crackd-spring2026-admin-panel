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
import { getImagesPage, updateImageRow } from "@/app/admin/images/actions";
import {
  type ImageManagementRow,
  type ImagesFilterState,
  type PaginatedResult,
} from "@/lib/admin/management-types";
import { cn } from "@/lib/utils";

type ImagesManagementClientProps = {
  initialData: PaginatedResult<ImageManagementRow>;
  initialFilters: ImagesFilterState;
};

type ImageDraft = {
  is_common_use: boolean;
  is_public: boolean;
  additional_context: string;
  image_description: string;
};

function createDraft(row: ImageManagementRow): ImageDraft {
  return {
    is_common_use: Boolean(row.is_common_use),
    is_public: Boolean(row.is_public),
    additional_context: row.additional_context ?? "",
    image_description: row.image_description ?? "",
  };
}

function getImageIdentifier(row: ImageManagementRow) {
  if (row.url) {
    try {
      const parsed = new URL(row.url);
      const tail = parsed.pathname.split("/").filter(Boolean).pop();
      return tail ? `${parsed.hostname}/${tail}` : parsed.hostname;
    } catch {
      return row.url;
    }
  }

  return row.id.slice(0, 8);
}

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

export function ImagesManagementClient({
  initialData,
  initialFilters,
}: ImagesManagementClientProps) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [filters, setFilters] = React.useState(initialFilters);
  const [searchInput, setSearchInput] = React.useState(initialFilters.search);
  const [data, setData] = React.useState(initialData);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<ImageDraft | null>(null);
  const [savingId, setSavingId] = React.useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(searchInput, 250);

  const loadRecords = React.useCallback(
    async (nextFilters: ImagesFilterState) => {
      setLoading(true);
      setError(null);
      try {
        const nextData = await getImagesPage(nextFilters);
        setData(nextData);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load images.");
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

  const updateFilters = (updater: (current: ImagesFilterState) => ImagesFilterState) => {
    React.startTransition(() => setFilters((current) => updater(current)));
  };

  const beginEdit = (row: ImageManagementRow) => {
    setExpandedId(row.id);
    setEditingId(row.id);
    setDraft(createDraft(row));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(null);
  };

  const handleSave = async (row: ImageManagementRow) => {
    if (!draft) return;

    const previousRows = data.rows;
    setSavingId(row.id);
    setData((current) => ({
      ...current,
      rows: current.rows.map((item) =>
        item.id === row.id
          ? {
              ...item,
              is_common_use: draft.is_common_use,
              is_public: draft.is_public,
              additional_context: draft.additional_context || null,
              image_description: draft.image_description || null,
            }
          : item
      ),
    }));

    try {
      const updated = await updateImageRow({ id: row.id, ...draft });
      setData((current) => ({
        ...current,
        rows: current.rows.map((item) => (item.id === updated.id ? updated : item)),
      }));
      setEditingId(null);
      setDraft(createDraft(updated));
      toast.success("Saved");
      const refreshed = await getImagesPage(filters);
      setData(refreshed);
      router.refresh();
    } catch (saveError) {
      setData((current) => ({ ...current, rows: previousRows }));
      toast.error(saveError instanceof Error ? saveError.message : "Failed to save image.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <AdminManagementLayout
      searchPlaceholder="Search image URL, description, or context..."
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
            label="Usage"
            value={filters.commonUse}
            onChange={(value) => updateFilters((current) => ({ ...current, commonUse: value, page: 1 }))}
            options={[
              { label: "All", value: "all" },
              { label: "Common-use", value: "common" },
              { label: "Not common", value: "not_common" },
            ]}
          />
        </>
      }
      columnHeaders={
        <div className="grid grid-cols-[72px_minmax(0,1fr)_auto_auto_32px] items-center gap-4 px-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          <span>Image</span>
          <span>Identifier</span>
          <span>Usage</span>
          <span>Visibility</span>
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
        emptyMessage="No images matched your current filters."
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
                className="grid w-full grid-cols-[72px_minmax(0,1fr)_auto_auto_32px] items-center gap-4 px-4 py-4 text-left transition hover:bg-slate-50"
              >
                <ThumbnailSquare src={row.url} alt={row.url ?? "Image"} />
                <p className="truncate text-sm font-medium text-slate-900">{getImageIdentifier(row)}</p>
                <div className="justify-self-start">
                  <BooleanBadge value={row.is_common_use} trueLabel="Common-use" falseLabel="Not common" />
                </div>
                <div className="justify-self-start">
                  <BooleanBadge value={row.is_public} trueLabel="Public" falseLabel="Private" />
                </div>
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
                      {/* URL stays read-only because it represents the image asset itself. */}
                      <div className="grid gap-4 lg:grid-cols-2">
                        <FieldBlock label="Image URL">
                          <p className="break-all text-sm text-slate-700">{row.url || "No URL."}</p>
                        </FieldBlock>
                        <FieldBlock label="Image description">
                          {isEditing ? (
                            <textarea
                              rows={4}
                              value={draft.image_description}
                              onChange={(event) =>
                                setDraft((current) =>
                                  current ? { ...current, image_description: event.target.value } : current
                                )
                              }
                              className="min-h-24 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-400"
                            />
                          ) : (
                            <p className="text-sm text-slate-700">{row.image_description || "No description."}</p>
                          )}
                        </FieldBlock>
                        <FieldBlock label="Additional context">
                          {isEditing ? (
                            <textarea
                              rows={4}
                              value={draft.additional_context}
                              onChange={(event) =>
                                setDraft((current) =>
                                  current ? { ...current, additional_context: event.target.value } : current
                                )
                              }
                              className="min-h-24 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-400"
                            />
                          ) : (
                            <p className="text-sm text-slate-700">{row.additional_context || "No context."}</p>
                          )}
                        </FieldBlock>
                        <FieldBlock label="Celebrity recognition">
                          <p className="text-sm text-slate-700">
                            {row.celebrity_recognition || "No recognition notes."}
                          </p>
                        </FieldBlock>
                        <FieldBlock label="Profile ID">
                          <p className="break-all text-sm text-slate-700">{row.profile_id || "No profile."}</p>
                        </FieldBlock>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <FieldBlock label="Common use">
                          {isEditing ? (
                            <BooleanSelect
                              value={draft.is_common_use}
                              trueLabel="Common-use"
                              falseLabel="Not common-use"
                              onChange={(value) =>
                                setDraft((current) =>
                                  current ? { ...current, is_common_use: value } : current
                                )
                              }
                            />
                          ) : (
                            <BooleanBadge value={row.is_common_use} trueLabel="Common use" falseLabel="Not common" />
                          )}
                        </FieldBlock>
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
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {isEditing ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={cancelEdit}
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
                            onClick={() => beginEdit(row)}
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
