"use client";

import * as React from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import {
  AdminManagementLayout,
  ManagementTableState,
} from "@/components/admin/AdminManagementLayout";
import { AdminModal } from "@/components/admin/AdminModal";
import { FieldBlock, ModalActions } from "@/components/admin/AdminManagementPrimitives";
import { useAdminDataTable } from "@/components/admin/useAdminDataTable";
import { Button } from "@/components/ui/button";
import { type PaginatedResult, type PaginationQuery } from "@/lib/admin/management-types";

type SimpleCrudManagementClientProps<
  TRow extends { id: number },
  TFilters extends PaginationQuery,
  TDraft extends { id?: number }
> = {
  initialData: PaginatedResult<TRow>;
  initialFilters: TFilters;
  loadRecords: (filters: TFilters) => Promise<PaginatedResult<TRow>>;
  createRecord: (payload: TDraft) => Promise<TRow>;
  updateRecord: (payload: TDraft) => Promise<TRow>;
  deleteRecord: (id: number) => Promise<{ id: number }>;
  createEmptyDraft: () => TDraft;
  buildDraft: (row: TRow) => TDraft;
  searchPlaceholder: string;
  emptyMessage: string;
  addLabel: string;
  entityLabel: string;
  columnHeaders: React.ReactNode;
  renderRow: (row: TRow) => React.ReactNode;
  renderForm: (draft: TDraft, setDraft: React.Dispatch<React.SetStateAction<TDraft>>) => React.ReactNode;
};

export function SimpleCrudManagementClient<
  TRow extends { id: number },
  TFilters extends PaginationQuery,
  TDraft extends { id?: number }
>({
  initialData,
  initialFilters,
  loadRecords,
  createRecord,
  updateRecord,
  deleteRecord,
  createEmptyDraft,
  buildDraft,
  searchPlaceholder,
  emptyMessage,
  addLabel,
  entityLabel,
  columnHeaders,
  renderRow,
  renderForm,
}: SimpleCrudManagementClientProps<TRow, TFilters, TDraft>) {
  const router = useRouter();
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<TDraft>(createEmptyDraft);
  const [deleteTarget, setDeleteTarget] = React.useState<TRow | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<number | null>(null);
  const { filters, searchInput, setSearchInput, data, setData, loading, error, updateFilters } =
    useAdminDataTable({
      initialData,
      initialFilters,
      loadRecords,
    });

  const openCreate = () => {
    setDraft(createEmptyDraft());
    setIsFormOpen(true);
  };

  const openEdit = (row: TRow) => {
    setDraft(buildDraft(row));
    setIsFormOpen(true);
  };

  const closeForm = () => {
    if (isSaving) return;
    setIsFormOpen(false);
    setDraft(createEmptyDraft());
  };

  const handleSubmit = async () => {
    setIsSaving(true);

    try {
      const saved = draft.id ? await updateRecord(draft) : await createRecord(draft);
      setData((current) => {
        const exists = current.rows.some((row) => row.id === saved.id);
        return {
          ...current,
          rows: exists
            ? current.rows.map((row) => (row.id === saved.id ? saved : row))
            : [saved, ...current.rows],
        };
      });
      toast.success(draft.id ? `${entityLabel} updated` : `${entityLabel} created`);
      closeForm();
      router.refresh();
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : `Failed to save ${entityLabel}.`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeletingId(deleteTarget.id);
    try {
      await deleteRecord(deleteTarget.id);
      setData((current) => ({
        ...current,
        rows: current.rows.filter((row) => row.id !== deleteTarget.id),
      }));
      setDeleteTarget(null);
      toast.success(`${entityLabel} deleted`);
      router.refresh();
    } catch (deleteError) {
      toast.error(deleteError instanceof Error ? deleteError.message : `Failed to delete ${entityLabel}.`);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <AdminManagementLayout
        searchPlaceholder={searchPlaceholder}
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        controls={
          <Button size="sm" onClick={openCreate} className="rounded-full bg-red-500 text-white hover:bg-red-400">
            <Plus className="h-4 w-4" />
            {addLabel}
          </Button>
        }
        columnHeaders={columnHeaders}
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
          emptyMessage={emptyMessage}
        >
          {data.rows.map((row) => (
            <div
              key={row.id}
              className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-4 rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-[0_12px_24px_rgba(15,23,42,0.06)]"
            >
              <div className="min-w-0">{renderRow(row)}</div>
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
          ))}
        </ManagementTableState>
      </AdminManagementLayout>

      <AdminModal open={isFormOpen} onClose={closeForm} title={draft.id ? `Edit ${entityLabel}` : addLabel}>
        <div className="space-y-5">
          {renderForm(draft, setDraft)}
          <ModalActions
            onCancel={closeForm}
            onConfirm={() => void handleSubmit()}
            confirmLabel={draft.id ? "Save changes" : addLabel}
            confirmDisabled={isSaving}
            loading={isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
          />
        </div>
      </AdminModal>

      <AdminModal open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} title={`Delete ${entityLabel}?`}>
        {deleteTarget ? (
          <div className="space-y-5">
            <FieldBlock label={entityLabel}>{renderRow(deleteTarget)}</FieldBlock>
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
