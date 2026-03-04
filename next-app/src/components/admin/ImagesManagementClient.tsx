"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Loader2, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { deleteImageRow, getImagesPage, updateImageRow } from "@/app/admin/images/actions";
import {
  AdminManagementLayout,
  BooleanBadge,
  FilterChipGroup,
  LargeImagePreview,
  ManagementTableState,
  ThumbnailSquare,
} from "@/components/admin/AdminManagementLayout";
import { AdminModal } from "@/components/admin/AdminModal";
import { useDebouncedValue } from "@/components/admin/useDebouncedValue";
import { Button } from "@/components/ui/button";
import { type ImageManagementRow, type ImagesFilterState, type PaginatedResult } from "@/lib/admin/management-types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
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

type AddImageDraft = {
  file: File | null;
  is_common_use: "true" | "false" | "";
  is_public: "true" | "false" | "";
  additional_context: string;
  image_description: string;
};

const initialAddImageDraft: AddImageDraft = {
  file: null,
  is_common_use: "",
  is_public: "",
  additional_context: "",
  image_description: "",
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

function BooleanSegmentedControl({
  label,
  value,
  trueLabel,
  falseLabel,
  onChange,
}: {
  label: string;
  value: boolean | "true" | "false" | "";
  trueLabel: string;
  falseLabel: string;
  onChange: (value: boolean | "true" | "false") => void;
}) {
  const normalized = typeof value === "boolean" ? (value ? "true" : "false") : value;

  return (
    <div>
      <p className="mb-2 text-[11px] uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-slate-100 p-1.5 shadow-sm">
        {[
          { label: trueLabel, value: "true" as const },
          { label: falseLabel, value: "false" as const },
        ].map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(typeof value === "boolean" ? option.value === "true" : option.value)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm transition",
              normalized === option.value
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

function FieldBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <p className="mb-2 text-[11px] uppercase tracking-[0.22em] text-slate-500">{label}</p>
      {children}
    </div>
  );
}

function isAcceptedImage(file: File) {
  const allowedTypes = new Set([
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/heic",
    "image/webp",
  ]);

  return allowedTypes.has(file.type);
}

async function readApiError(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { message?: string };
    if (body.message) {
      return body.message;
    }
  } catch {}

  return fallback;
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
  const [deleteTarget, setDeleteTarget] = React.useState<ImageManagementRow | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [addDraft, setAddDraft] = React.useState<AddImageDraft>(initialAddImageDraft);
  const [isAdding, setIsAdding] = React.useState(false);
  const addInFlightRef = React.useRef(false);
  const debouncedSearch = useDebouncedValue(searchInput, 250);

  const loadRecords = React.useCallback(async (nextFilters: ImagesFilterState) => {
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
  }, []);

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

  const handleDelete = async () => {
    if (!deleteTarget) return;

    const previousRows = data.rows;
    setDeletingId(deleteTarget.id);
    setData((current) => ({
      ...current,
      rows: current.rows.filter((row) => row.id !== deleteTarget.id),
      totalCount: Math.max(0, current.totalCount - 1),
      totalPages: Math.max(1, Math.ceil(Math.max(0, current.totalCount - 1) / current.pageSize)),
    }));

    try {
      await deleteImageRow(deleteTarget.id);
      toast.success("Image deleted");
      setDeleteTarget(null);
      setExpandedId((current) => (current === deleteTarget.id ? null : current));
      const refreshed = await getImagesPage(filters);
      setData(refreshed);
      router.refresh();
    } catch (deleteError) {
      setData((current) => ({ ...current, rows: previousRows, totalCount: data.totalCount, totalPages: data.totalPages }));
      toast.error(deleteError instanceof Error ? deleteError.message : "Failed to delete image.");
    } finally {
      setDeletingId(null);
    }
  };

  const closeAddModal = () => {
    if (isAdding) return;
    setIsAddOpen(false);
    setAddDraft(initialAddImageDraft);
  };

  const handleAddImage = async () => {
    if (addInFlightRef.current || !addDraft.file || !addDraft.is_common_use || !addDraft.is_public) {
      return;
    }

    addInFlightRef.current = true;
    setIsAdding(true);

    try {
      const file = addDraft.file;
      const isCommonUse = addDraft.is_common_use === "true";
      const isPublic = addDraft.is_public === "true";
      const imageDescription = addDraft.image_description;
      const additionalContext = addDraft.additional_context;
      const supabase = createSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        throw new Error("Missing session access token.");
      }

      const presignResponse = await fetch("/api/admin/images/presign", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contentType: file.type,
        }),
      });

      if (!presignResponse.ok) {
        throw new Error(await readApiError(presignResponse, "Failed to prepare image upload."));
      }

      const presignBody = (await presignResponse.json()) as {
        presignedUrl?: string;
        cdnUrl?: string;
      };

      if (!presignBody.presignedUrl || !presignBody.cdnUrl) {
        throw new Error("Presign response was missing upload URLs.");
      }

      const uploadResponse = await fetch(presignBody.presignedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Image upload failed (${uploadResponse.status}).`);
      }

      const registerResponse = await fetch("/api/admin/images/register", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cdnUrl: presignBody.cdnUrl,
          isCommonUse,
          isPublic,
          imageDescription,
          additionalContext,
        }),
      });

      if (!registerResponse.ok) {
        throw new Error(await readApiError(registerResponse, "Failed to register image."));
      }

      toast.success("Image added");
      closeAddModal();
      const refreshed = await getImagesPage(filters);
      setData(refreshed);
      router.refresh();
    } catch (addError) {
      toast.error(addError instanceof Error ? addError.message : "Failed to add image.");
    } finally {
      addInFlightRef.current = false;
      setIsAdding(false);
    }
  };

  const canSubmitAdd =
    Boolean(addDraft.file) &&
    Boolean(addDraft.is_common_use) &&
    Boolean(addDraft.is_public) &&
    !isAdding;

  return (
    <>
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
            <Button
              size="sm"
              onClick={() => setIsAddOpen(true)}
              className="rounded-full bg-red-500 text-white hover:bg-red-400"
            >
              <Plus className="h-4 w-4" />
              Add image
            </Button>
          </>
        }
        columnHeaders={
          <div className="grid grid-cols-[72px_minmax(0,1fr)_auto_auto_32px] items-center gap-4 px-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            <span>Image</span>
            <span>Image</span>
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
                className="grid w-full grid-cols-[72px_minmax(0,1fr)_auto_auto_32px] items-center gap-4 px-4 py-3 text-left transition hover:bg-slate-50"
              >
                  <div className="flex h-14 w-[72px] items-center">
                    <ThumbnailSquare src={row.url} alt={row.url ?? "Image"} className="h-16 w-16" />
                  </div>
                  <span className="truncate text-sm font-medium text-slate-900" title={row.id}>
                    {row.id.slice(0, 8)}...
                  </span>
                  <div className="justify-self-start">
                    <BooleanBadge value={row.is_common_use} trueLabel="Common-use" falseLabel="Not common" />
                  </div>
                  <div className="justify-self-start">
                    <BooleanBadge value={row.is_public} trueLabel="Public" falseLabel="Private" />
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 shrink-0 justify-self-end text-slate-500 transition",
                      isExpanded && "rotate-180"
                    )}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isExpanded ? (
                    <motion.div
                      initial={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                      animate={reduceMotion ? { opacity: 1 } : { height: "auto", opacity: 1 }}
                      exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                      transition={{ duration: reduceMotion ? 0.12 : 0.24 }}
                      className="overflow-hidden border-t border-slate-200"
                    >
                      <div className="space-y-5 px-5 py-5">
                        <div className="grid gap-5 lg:grid-cols-2">
                          <div className="space-y-4">
                            <div className="max-w-sm">
                              <LargeImagePreview src={row.url} alt={row.id} />
                            </div>
                            <div className="space-y-1.5 px-1">
                              <p className="break-all text-xs text-slate-500">
                                <span className="font-medium text-slate-600">Profile ID:</span>{" "}
                                {row.profile_id || "No profile."}
                              </p>
                              <p className="break-all text-xs text-slate-500">
                                <span className="font-medium text-slate-600">Image ID:</span> {row.id}
                              </p>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                              {isEditing && draft ? (
                                <>
                                  <BooleanSegmentedControl
                                    label="Common use"
                                    value={draft.is_common_use}
                                    trueLabel="Common-use"
                                    falseLabel="Not common"
                                    onChange={(value) =>
                                      setDraft((current) =>
                                        current
                                          ? { ...current, is_common_use: Boolean(value) }
                                          : current
                                      )
                                    }
                                  />
                                  <BooleanSegmentedControl
                                    label="Visibility"
                                    value={draft.is_public}
                                    trueLabel="Public"
                                    falseLabel="Private"
                                    onChange={(value) =>
                                      setDraft((current) =>
                                        current ? { ...current, is_public: Boolean(value) } : current
                                      )
                                    }
                                  />
                                </>
                              ) : (
                                <>
                                  <FieldBlock label="Common use">
                                    <BooleanBadge
                                      value={row.is_common_use}
                                      trueLabel="Common-use"
                                      falseLabel="Not common"
                                    />
                                  </FieldBlock>
                                  <FieldBlock label="Visibility">
                                    <BooleanBadge
                                      value={row.is_public}
                                      trueLabel="Public"
                                      falseLabel="Private"
                                    />
                                  </FieldBlock>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="space-y-4">
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
                          </div>
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
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDeleteTarget(row)}
                                className="rounded-full border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => beginEdit(row)}
                                className="rounded-full bg-red-500 text-white hover:bg-red-400"
                              >
                                <Pencil className="h-4 w-4" />
                                Edit
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            );
          })}
        </ManagementTableState>
      </AdminManagementLayout>

      <AdminModal open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} title="Delete image?">
        {deleteTarget ? (
          <div className="space-y-5">
            <p className="text-sm text-slate-600">
              This permanently removes the image record. This action cannot be undone.
            </p>
            <div className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <ThumbnailSquare src={deleteTarget.url} alt={deleteTarget.id} />
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Image</p>
                <p className="truncate text-sm font-medium text-slate-900" title={deleteTarget.id}>
                  {deleteTarget.id.slice(0, 8)}...
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteTarget(null)}
                className="rounded-full border-slate-300"
              >
                Cancel
              </Button>
              <Button
                onClick={() => void handleDelete()}
                disabled={deletingId === deleteTarget.id}
                className="rounded-full bg-red-500 text-white hover:bg-red-400"
              >
                {deletingId === deleteTarget.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete
              </Button>
            </div>
          </div>
        ) : null}
      </AdminModal>

      <AdminModal open={isAddOpen} onClose={closeAddModal} title="Add image">
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-[11px] uppercase tracking-[0.22em] text-slate-500">Image file</p>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.gif,.heic,image/jpeg,image/png,image/gif,image/heic,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                if (file && !isAcceptedImage(file)) {
                  toast.error("Unsupported image type.");
                  event.currentTarget.value = "";
                  return;
                }
                setAddDraft((current) => ({ ...current, file }));
              }}
              className="block w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 file:mr-4 file:rounded-full file:border-0 file:bg-red-500 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <BooleanSegmentedControl
              label="Common use"
              value={addDraft.is_common_use}
              trueLabel="Common-use"
              falseLabel="Not common"
              onChange={(value) =>
                setAddDraft((current) => ({
                  ...current,
                  is_common_use: value as "true" | "false",
                }))
              }
            />
            <BooleanSegmentedControl
              label="Visibility"
              value={addDraft.is_public}
              trueLabel="Public"
              falseLabel="Private"
              onChange={(value) =>
                setAddDraft((current) => ({
                  ...current,
                  is_public: value as "true" | "false",
                }))
              }
            />
          </div>

          <div className="grid gap-4">
            <FieldBlock label="Image description">
              <textarea
                rows={4}
                value={addDraft.image_description}
                onChange={(event) =>
                  setAddDraft((current) => ({ ...current, image_description: event.target.value }))
                }
                className="min-h-24 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-400"
              />
            </FieldBlock>
            <FieldBlock label="Additional context">
              <textarea
                rows={4}
                value={addDraft.additional_context}
                onChange={(event) =>
                  setAddDraft((current) => ({ ...current, additional_context: event.target.value }))
                }
                className="min-h-24 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-400"
              />
            </FieldBlock>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeAddModal} className="rounded-full border-slate-300">
              Cancel
            </Button>
            <Button
              onClick={() => void handleAddImage()}
              disabled={!canSubmitAdd}
              className="rounded-full bg-red-500 text-white hover:bg-red-400"
            >
              {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add image
            </Button>
          </div>
        </div>
      </AdminModal>
    </>
  );
}
