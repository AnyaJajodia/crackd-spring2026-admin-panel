"use client";

import * as React from "react";

import { getHumorFlavorsPage } from "@/app/admin/humor-flavors/actions";
import {
  AdminManagementLayout,
  FilterChipGroup,
  ManagementTableState,
} from "@/components/admin/AdminManagementLayout";
import {
  DetailText,
  ExpandChevron,
  ExpandableRow,
  FieldBlock,
  MetadataText,
  formatAdminDate,
} from "@/components/admin/AdminManagementPrimitives";
import { useAdminDataTable } from "@/components/admin/useAdminDataTable";
import {
  type HumorFlavorManagementRow,
  type HumorFlavorsFilterState,
  type PaginatedResult,
} from "@/lib/admin/management-types";

export function HumorFlavorsManagementClient({
  initialData,
  initialFilters,
}: {
  initialData: PaginatedResult<HumorFlavorManagementRow>;
  initialFilters: HumorFlavorsFilterState;
}) {
  const [expandedId, setExpandedId] = React.useState<number | null>(null);
  const { filters, searchInput, setSearchInput, data, loading, error, updateFilters } =
    useAdminDataTable({
      initialData,
      initialFilters,
      loadRecords: getHumorFlavorsPage,
    });

  return (
    <AdminManagementLayout
      searchPlaceholder="Search humor flavor slug or description..."
      searchValue={searchInput}
      onSearchChange={setSearchInput}
      controls={
        <>
          <FilterChipGroup
            label="Steps"
            value={filters.stepStatus}
            onChange={(value) => updateFilters((current) => ({ ...current, stepStatus: value, page: 1 }))}
            options={[
              { label: "All", value: "all" },
              { label: "Has steps", value: "has_steps" },
              { label: "No steps", value: "no_steps" },
            ]}
          />
          <FilterChipGroup
            label="Created"
            value={filters.sort}
            onChange={(value) => updateFilters((current) => ({ ...current, sort: value, page: 1 }))}
            options={[
              { label: "Newest", value: "newest" },
              { label: "Oldest", value: "oldest" },
            ]}
          />
        </>
      }
      columnHeaders={
        <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1.6fr)_120px_180px_32px] items-center gap-4 px-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          <span>Slug</span>
          <span>Description</span>
          <span>Steps</span>
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
        emptyMessage="No humor flavors matched your search."
      >
        {data.rows.map((row) => {
          const isOpen = expandedId === row.id;

          return (
            <ExpandableRow
              key={row.id}
              open={isOpen}
              onToggle={() => setExpandedId((current) => (current === row.id ? null : row.id))}
              header={
                <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1.6fr)_120px_180px_32px] items-center gap-4 px-4 py-4">
                  <span className="truncate text-sm font-medium text-slate-900">{row.slug}</span>
                  <span className="truncate text-sm text-slate-600">{row.description || "No description."}</span>
                  <span className="text-sm text-slate-700">{row.step_count}</span>
                  <span className="text-sm text-slate-500">{formatAdminDate(row.created_datetime_utc)}</span>
                  <ExpandChevron open={isOpen} className="justify-self-end" />
                </div>
              }
            >
              <div className="grid gap-4 lg:grid-cols-2">
                <FieldBlock label="Description">
                  <DetailText value={row.description} mutedFallback="No description." preserveWhitespace />
                </FieldBlock>
                <FieldBlock label="Configuration">
                  <div className="space-y-2">
                    <MetadataText label="Flavor ID:" value={row.id} />
                    <MetadataText label="Slug:" value={row.slug} />
                    <MetadataText label="Created:" value={formatAdminDate(row.created_datetime_utc)} />
                    <MetadataText label="Related steps:" value={row.step_count} />
                  </div>
                </FieldBlock>
              </div>
            </ExpandableRow>
          );
        })}
      </ManagementTableState>
    </AdminManagementLayout>
  );
}
