"use client";

import * as React from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { createTerm, deleteTerm, getTermsPage, updateTerm } from "@/app/admin/terms/actions";
import {
  AdminManagementLayout,
  ManagementTableState,
} from "@/components/admin/AdminManagementLayout";
import { AdminModal } from "@/components/admin/AdminModal";
import {
  DetailText,
  ExpandChevron,
  ExpandableRow,
  FieldBlock,
  MetadataText,
  ModalActions,
  SelectField,
  TextArea,
  TextInput,
  formatAdminDate,
} from "@/components/admin/AdminManagementPrimitives";
import { useAdminDataTable } from "@/components/admin/useAdminDataTable";
import { Button } from "@/components/ui/button";
import {
  type LookupOption,
  type PaginatedResult,
  type TermManagementRow,
  type TermMutationInput,
  type TermsFilterState,
} from "@/lib/admin/management-types";

const emptyDraft: TermMutationInput = {
  term: "",
  definition: "",
  example: "",
  priority: 0,
  term_type_id: null,
};

export function TermsManagementClient({
  initialData,
  initialFilters,
  termTypeOptions,
}: {
  initialData: PaginatedResult<TermManagementRow>;
  initialFilters: TermsFilterState;
  termTypeOptions: LookupOption[];
}) {
  const router = useRouter();
  const [expandedId, setExpandedId] = React.useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<TermMutationInput>(emptyDraft);
  const [deleteTarget, setDeleteTarget] = React.useState<TermManagementRow | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<number | null>(null);
  const { filters, searchInput, setSearchInput, data, setData, loading, error, updateFilters } =
    useAdminDataTable({
      initialData,
      initialFilters,
      loadRecords: getTermsPage,
    });

  const openCreate = () => {
    setDraft(emptyDraft);
    setIsFormOpen(true);
  };

  const openEdit = (row: TermManagementRow) => {
    setDraft({
      id: row.id,
      term: row.term,
      definition: row.definition,
      example: row.example,
      priority: row.priority,
      term_type_id: row.term_type_id,
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    if (isSaving) return;
    setIsFormOpen(false);
    setDraft(emptyDraft);
  };

  const handleSubmit = async () => {
    if (!draft.term.trim()) {
      toast.error("Term is required.");
      return;
    }

    setIsSaving(true);

    try {
      const saved = draft.id ? await updateTerm(draft) : await createTerm(draft);
      setData((current) => {
        const exists = current.rows.some((row) => row.id === saved.id);
        return {
          ...current,
          rows: exists
            ? current.rows.map((row) => (row.id === saved.id ? saved : row))
            : [saved, ...current.rows],
        };
      });
      toast.success(draft.id ? "Term updated" : "Term created");
      closeForm();
      router.refresh();
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : "Failed to save term.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeletingId(deleteTarget.id);
    try {
      await deleteTerm(deleteTarget.id);
      setData((current) => ({
        ...current,
        rows: current.rows.filter((row) => row.id !== deleteTarget.id),
      }));
      setDeleteTarget(null);
      toast.success("Term deleted");
      router.refresh();
    } catch (deleteError) {
      toast.error(deleteError instanceof Error ? deleteError.message : "Failed to delete term.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <AdminManagementLayout
        searchPlaceholder="Search term, definition, or example..."
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        controls={
          <Button size="sm" onClick={openCreate} className="rounded-full bg-red-500 text-white hover:bg-red-400">
            <Plus className="h-4 w-4" />
            Add term
          </Button>
        }
        columnHeaders={
          <div className="grid grid-cols-[minmax(0,1fr)_100px_140px_180px_32px] items-center gap-4 px-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            <span>Term</span>
            <span>Priority</span>
            <span>Type</span>
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
          emptyMessage="No terms matched your current search."
        >
          {data.rows.map((row) => {
            const isOpen = expandedId === row.id;

            return (
              <ExpandableRow
                key={row.id}
                open={isOpen}
                onToggle={() => setExpandedId((current) => (current === row.id ? null : row.id))}
                header={
                  <div className="grid grid-cols-[minmax(0,1fr)_100px_140px_180px_32px] items-center gap-4 px-4 py-4">
                    <span className="truncate text-sm font-medium text-slate-900">{row.term}</span>
                    <span className="text-sm text-slate-700">{row.priority}</span>
                    <span className="truncate text-sm text-slate-600">{row.term_type_name || "Unassigned"}</span>
                    <span className="text-sm text-slate-500">{formatAdminDate(row.created_datetime_utc)}</span>
                    <ExpandChevron open={isOpen} className="justify-self-end" />
                  </div>
                }
              >
                <div className="grid gap-4 lg:grid-cols-2">
                  <FieldBlock label="Term details">
                    <div className="space-y-2">
                      <MetadataText label="Term ID:" value={row.id} />
                      <MetadataText label="Type:" value={row.term_type_name || "Unassigned"} />
                      <MetadataText label="Priority:" value={row.priority} />
                      <MetadataText label="Created:" value={formatAdminDate(row.created_datetime_utc)} />
                      <MetadataText label="Modified:" value={formatAdminDate(row.modified_datetime_utc)} />
                    </div>
                  </FieldBlock>
                  <FieldBlock label="Definition">
                    <DetailText value={row.definition} preserveWhitespace />
                  </FieldBlock>
                  <FieldBlock label="Example" className="lg:col-span-2">
                    <DetailText value={row.example} preserveWhitespace />
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

      <AdminModal open={isFormOpen} onClose={closeForm} title={draft.id ? "Edit term" : "Add term"}>
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <FieldBlock label="Term">
              <TextInput value={draft.term} onChange={(value) => setDraft((current) => ({ ...current, term: value }))} />
            </FieldBlock>
            <FieldBlock label="Priority">
              <TextInput
                value={draft.priority}
                type="number"
                onChange={(value) =>
                  setDraft((current) => ({ ...current, priority: Number(value || 0) }))
                }
              />
            </FieldBlock>
          </div>
          <FieldBlock label="Term Type">
            <SelectField
              value={draft.term_type_id == null ? "" : String(draft.term_type_id)}
              onChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  term_type_id: value ? Number(value) : null,
                }))
              }
              placeholder="Unassigned"
              options={termTypeOptions.map((option) => ({ value: option.value, label: option.label }))}
            />
          </FieldBlock>
          <FieldBlock label="Definition">
            <TextArea value={draft.definition} onChange={(value) => setDraft((current) => ({ ...current, definition: value }))} />
          </FieldBlock>
          <FieldBlock label="Example">
            <TextArea value={draft.example} onChange={(value) => setDraft((current) => ({ ...current, example: value }))} />
          </FieldBlock>
          <ModalActions
            onCancel={closeForm}
            onConfirm={() => void handleSubmit()}
            confirmLabel={draft.id ? "Save changes" : "Add term"}
            confirmDisabled={isSaving}
            loading={isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
          />
        </div>
      </AdminModal>

      <AdminModal open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} title="Delete term?">
        {deleteTarget ? (
          <div className="space-y-5">
            <FieldBlock label="Term">
              <p className="text-sm font-medium text-slate-900">{deleteTarget.term}</p>
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
