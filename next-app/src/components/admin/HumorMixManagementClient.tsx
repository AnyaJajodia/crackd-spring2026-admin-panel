"use client";

import * as React from "react";
import { Loader2, Pencil, Save, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { getHumorMixPage, updateHumorMixRow } from "@/app/admin/humor-mix/actions";
import {
  AdminManagementLayout,
  ManagementTableState,
} from "@/components/admin/AdminManagementLayout";
import {
  DetailText,
  ExpandChevron,
  ExpandableRow,
  FieldBlock,
  MetadataText,
  TextInput,
  formatAdminDate,
} from "@/components/admin/AdminManagementPrimitives";
import { useAdminDataTable } from "@/components/admin/useAdminDataTable";
import { Button } from "@/components/ui/button";
import {
  type HumorMixFilterState,
  type HumorMixManagementRow,
  type PaginatedResult,
} from "@/lib/admin/management-types";

export function HumorMixManagementClient({
  initialData,
  initialFilters,
}: {
  initialData: PaginatedResult<HumorMixManagementRow>;
  initialFilters: HumorMixFilterState;
}) {
  const router = useRouter();
  const [expandedId, setExpandedId] = React.useState<number | null>(null);
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [draftCount, setDraftCount] = React.useState("");
  const [savingId, setSavingId] = React.useState<number | null>(null);
  const { filters, searchInput, setSearchInput, data, setData, loading, error, updateFilters } =
    useAdminDataTable({
      initialData,
      initialFilters,
      loadRecords: getHumorMixPage,
    });

  const beginEdit = (row: HumorMixManagementRow) => {
    setExpandedId(row.id);
    setEditingId(row.id);
    setDraftCount(String(row.caption_count));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraftCount("");
  };

  const handleSave = async (row: HumorMixManagementRow) => {
    const nextCount = Number(draftCount);
    if (!Number.isInteger(nextCount) || nextCount < 0) {
      toast.error("Caption count must be a non-negative integer.");
      return;
    }

    setSavingId(row.id);

    try {
      const updated = await updateHumorMixRow({ id: row.id, caption_count: nextCount });
      setData((current) => ({
        ...current,
        rows: current.rows.map((item) => (item.id === row.id ? updated : item)),
      }));
      setEditingId(null);
      toast.success("Humor mix updated");
      router.refresh();
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : "Failed to update humor mix.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <AdminManagementLayout
      searchPlaceholder="Search humor flavor slug, description, or caption count..."
      searchValue={searchInput}
      onSearchChange={setSearchInput}
      controls={<div className="text-xs uppercase tracking-[0.22em] text-slate-500">Update caption counts</div>}
      columnHeaders={
        <div className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,1.6fr)_120px_180px_32px] items-center gap-4 px-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          <span>Flavor</span>
          <span>Description</span>
          <span>Captions</span>
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
        emptyMessage="No humor mix entries matched your search."
      >
        {data.rows.map((row) => {
          const isOpen = expandedId === row.id;
          const isEditing = editingId === row.id;

          return (
            <ExpandableRow
              key={row.id}
              open={isOpen}
              onToggle={() => {
                setExpandedId((current) => (current === row.id ? null : row.id));
                if (expandedId === row.id) {
                  cancelEdit();
                }
              }}
              header={
                <div className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,1.6fr)_120px_180px_32px] items-center gap-4 px-4 py-4">
                  <span className="truncate text-sm font-medium text-slate-900">
                    {row.humor_flavor_slug || `Flavor #${row.humor_flavor_id}`}
                  </span>
                  <span className="truncate text-sm text-slate-600">{row.humor_flavor_description || "No description."}</span>
                  <span className="text-sm text-slate-700">{row.caption_count}</span>
                  <span className="text-sm text-slate-500">{formatAdminDate(row.created_datetime_utc)}</span>
                  <ExpandChevron open={isOpen} className="justify-self-end" />
                </div>
              }
            >
              <div className="grid gap-4 lg:grid-cols-2">
                <FieldBlock label="Humor flavor">
                  <div className="space-y-2">
                    <MetadataText label="Mix ID:" value={row.id} />
                    <MetadataText label="Flavor ID:" value={row.humor_flavor_id} />
                    <MetadataText label="Slug:" value={row.humor_flavor_slug || "Unknown"} />
                    <MetadataText label="Created:" value={formatAdminDate(row.created_datetime_utc)} />
                  </div>
                </FieldBlock>
                <FieldBlock label="Flavor description">
                  <DetailText value={row.humor_flavor_description} mutedFallback="No description." preserveWhitespace />
                </FieldBlock>
                <FieldBlock label="Caption count">
                  {isEditing ? (
                    <TextInput value={draftCount} onChange={setDraftCount} type="number" />
                  ) : (
                    <p className="text-sm font-medium text-slate-900">{row.caption_count}</p>
                  )}
                </FieldBlock>
              </div>

              <div className="flex justify-end gap-2">
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
                      {savingId === row.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
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
            </ExpandableRow>
          );
        })}
      </ManagementTableState>
    </AdminManagementLayout>
  );
}
