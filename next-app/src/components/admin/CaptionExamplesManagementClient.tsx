"use client";

import * as React from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import {
  createCaptionExample,
  deleteCaptionExample,
  getCaptionExamplesPage,
  updateCaptionExample,
} from "@/app/admin/caption-examples/actions";
import {
  AdminManagementLayout,
  ManagementTableState,
  ThumbnailSquare,
} from "@/components/admin/AdminManagementLayout";
import { AdminModal } from "@/components/admin/AdminModal";
import {
  DetailText,
  ExpandChevron,
  ExpandableRow,
  FieldBlock,
  MetadataText,
  ModalActions,
  TextArea,
  TextInput,
  formatAdminDate,
} from "@/components/admin/AdminManagementPrimitives";
import { useAdminDataTable } from "@/components/admin/useAdminDataTable";
import { Button } from "@/components/ui/button";
import {
  type CaptionExampleManagementRow,
  type CaptionExampleMutationInput,
  type CaptionExamplesFilterState,
  type PaginatedResult,
} from "@/lib/admin/management-types";

const emptyDraft: CaptionExampleMutationInput = {
  image_description: "",
  caption: "",
  explanation: "",
  priority: 0,
  image_id: null,
};

export function CaptionExamplesManagementClient({
  initialData,
  initialFilters,
}: {
  initialData: PaginatedResult<CaptionExampleManagementRow>;
  initialFilters: CaptionExamplesFilterState;
}) {
  const router = useRouter();
  const [expandedId, setExpandedId] = React.useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<CaptionExampleMutationInput>(emptyDraft);
  const [deleteTarget, setDeleteTarget] = React.useState<CaptionExampleManagementRow | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<number | null>(null);
  const { filters, searchInput, setSearchInput, data, setData, loading, error, updateFilters } =
    useAdminDataTable({
      initialData,
      initialFilters,
      loadRecords: getCaptionExamplesPage,
    });

  const openCreate = () => {
    setDraft(emptyDraft);
    setIsFormOpen(true);
  };

  const openEdit = (row: CaptionExampleManagementRow) => {
    setDraft({
      id: row.id,
      image_description: row.image_description,
      caption: row.caption,
      explanation: row.explanation,
      priority: row.priority,
      image_id: row.image_id,
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    if (isSaving) return;
    setIsFormOpen(false);
    setDraft(emptyDraft);
  };

  const handleSubmit = async () => {
    if (!draft.image_description.trim() || !draft.caption.trim() || !draft.explanation.trim()) {
      toast.error("Description, caption, and explanation are required.");
      return;
    }

    setIsSaving(true);

    try {
      const saved = draft.id ? await updateCaptionExample(draft) : await createCaptionExample(draft);
      setData((current) => {
        const exists = current.rows.some((row) => row.id === saved.id);
        return {
          ...current,
          rows: exists
            ? current.rows.map((row) => (row.id === saved.id ? saved : row))
            : [saved, ...current.rows],
        };
      });
      toast.success(draft.id ? "Caption example updated" : "Caption example created");
      closeForm();
      router.refresh();
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : "Failed to save caption example.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeletingId(deleteTarget.id);
    try {
      await deleteCaptionExample(deleteTarget.id);
      setData((current) => ({
        ...current,
        rows: current.rows.filter((row) => row.id !== deleteTarget.id),
      }));
      setDeleteTarget(null);
      toast.success("Caption example deleted");
      router.refresh();
    } catch (deleteError) {
      toast.error(deleteError instanceof Error ? deleteError.message : "Failed to delete caption example.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <AdminManagementLayout
        searchPlaceholder="Search image description, caption, or explanation..."
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        controls={
          <Button size="sm" onClick={openCreate} className="rounded-full bg-red-500 text-white hover:bg-red-400">
            <Plus className="h-4 w-4" />
            Add example
          </Button>
        }
        columnHeaders={
          <div className="grid grid-cols-[72px_minmax(0,1fr)_90px_180px_32px] items-center gap-4 px-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            <span>Image</span>
            <span>Caption</span>
            <span>Priority</span>
            <span>Created</span>
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
          emptyMessage="No caption examples matched your current search."
        >
          {data.rows.map((row) => {
            const isOpen = expandedId === row.id;

            return (
              <ExpandableRow
                key={row.id}
                open={isOpen}
                onToggle={() => setExpandedId((current) => (current === row.id ? null : row.id))}
                header={
                  <div className="grid grid-cols-[72px_minmax(0,1fr)_90px_180px_32px] items-center gap-4 px-4 py-4">
                    <ThumbnailSquare src={row.image_url} alt={String(row.id)} className="h-16 w-16" />
                    <span className="truncate text-sm font-medium text-slate-900">{row.caption}</span>
                    <span className="text-sm text-slate-700">{row.priority}</span>
                    <span className="text-sm text-slate-500">{formatAdminDate(row.created_datetime_utc)}</span>
                    <ExpandChevron open={isOpen} className="justify-self-end" />
                  </div>
                }
              >
                <div className="grid gap-4 lg:grid-cols-2">
                  <FieldBlock label="Metadata">
                    <div className="space-y-2">
                      <MetadataText label="Example ID:" value={row.id} />
                      <MetadataText label="Priority:" value={row.priority} />
                      <MetadataText label="Image ID:" value={row.image_id || "None"} />
                      <MetadataText label="Created:" value={formatAdminDate(row.created_datetime_utc)} />
                      <MetadataText label="Modified:" value={formatAdminDate(row.modified_datetime_utc)} />
                    </div>
                  </FieldBlock>
                  <FieldBlock label="Caption">
                    <DetailText value={row.caption} preserveWhitespace />
                  </FieldBlock>
                  <FieldBlock label="Image description" className="lg:col-span-2">
                    <DetailText value={row.image_description} preserveWhitespace />
                  </FieldBlock>
                  <FieldBlock label="Explanation" className="lg:col-span-2">
                    <DetailText value={row.explanation} preserveWhitespace />
                  </FieldBlock>
                </div>
                <div className="flex justify-end gap-2">
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
                    onClick={() => openEdit(row)}
                    className="rounded-full bg-red-500 text-white hover:bg-red-400"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                </div>
              </ExpandableRow>
            );
          })}
        </ManagementTableState>
      </AdminManagementLayout>

      <AdminModal open={isFormOpen} onClose={closeForm} title={draft.id ? "Edit caption example" : "Add caption example"}>
        <div className="space-y-5">
          <FieldBlock label="Priority">
            <TextInput
              value={draft.priority}
              type="number"
              onChange={(value) => setDraft((current) => ({ ...current, priority: Number(value || 0) }))}
            />
          </FieldBlock>
          <FieldBlock label="Image ID (optional)">
            <TextInput
              value={draft.image_id || ""}
              onChange={(value) => setDraft((current) => ({ ...current, image_id: value || null }))}
            />
          </FieldBlock>
          <FieldBlock label="Image description">
            <TextArea value={draft.image_description} onChange={(value) => setDraft((current) => ({ ...current, image_description: value }))} />
          </FieldBlock>
          <FieldBlock label="Caption">
            <TextArea value={draft.caption} onChange={(value) => setDraft((current) => ({ ...current, caption: value }))} rows={3} />
          </FieldBlock>
          <FieldBlock label="Explanation">
            <TextArea value={draft.explanation} onChange={(value) => setDraft((current) => ({ ...current, explanation: value }))} />
          </FieldBlock>
          <ModalActions
            onCancel={closeForm}
            onConfirm={() => void handleSubmit()}
            confirmLabel={draft.id ? "Save changes" : "Add example"}
            confirmDisabled={isSaving}
            loading={isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
          />
        </div>
      </AdminModal>

      <AdminModal open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} title="Delete caption example?">
        {deleteTarget ? (
          <div className="space-y-5">
            <FieldBlock label="Caption">
              <DetailText value={deleteTarget.caption} preserveWhitespace />
            </FieldBlock>
            <p className="text-sm text-slate-600">This action cannot be undone.</p>
            <ModalActions
              onCancel={() => setDeleteTarget(null)}
              onConfirm={() => void handleDelete()}
              confirmLabel="Delete"
              confirmVariant="danger"
              confirmDisabled={deletingId === deleteTarget.id}
              loading={deletingId === deleteTarget.id ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
            />
          </div>
        ) : null}
      </AdminModal>
    </>
  );
}
