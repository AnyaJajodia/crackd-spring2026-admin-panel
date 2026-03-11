"use client";

import * as React from "react";

import { getCaptionRequestsPage } from "@/app/admin/caption-requests/actions";
import {
  AdminManagementLayout,
  FilterChipGroup,
  ManagementTableState,
  ThumbnailSquare,
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
  type CaptionRequestManagementRow,
  type CaptionRequestsFilterState,
  type PaginatedResult,
} from "@/lib/admin/management-types";

export function CaptionRequestsManagementClient({
  initialData,
  initialFilters,
}: {
  initialData: PaginatedResult<CaptionRequestManagementRow>;
  initialFilters: CaptionRequestsFilterState;
}) {
  const [expandedId, setExpandedId] = React.useState<number | null>(null);
  const { filters, searchInput, setSearchInput, data, loading, error, updateFilters } =
    useAdminDataTable({
      initialData,
      initialFilters,
      loadRecords: getCaptionRequestsPage,
    });

  return (
    <AdminManagementLayout
      searchPlaceholder="Search request, profile, image, or related IDs..."
      searchValue={searchInput}
      onSearchChange={setSearchInput}
      controls={
        <FilterChipGroup
          label="Activity"
          value={filters.activity}
          onChange={(value) => updateFilters((current) => ({ ...current, activity: value, page: 1 }))}
          options={[
            { label: "All", value: "all" },
            { label: "Prompt chains", value: "has_prompt_chains" },
            { label: "Responses", value: "has_responses" },
          ]}
        />
      }
      columnHeaders={
        <div className="grid grid-cols-[72px_120px_minmax(0,1fr)_120px_120px_32px] items-center gap-4 px-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          <span>Image</span>
          <span>Request</span>
          <span>Profile</span>
          <span>Prompt Chains</span>
          <span>Responses</span>
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
        emptyMessage="No caption requests matched your search."
      >
        {data.rows.map((row) => {
          const isOpen = expandedId === row.id;

          return (
            <ExpandableRow
              key={row.id}
              open={isOpen}
              onToggle={() => setExpandedId((current) => (current === row.id ? null : row.id))}
              header={
                <div className="grid grid-cols-[72px_120px_minmax(0,1fr)_120px_120px_32px] items-center gap-4 px-4 py-4">
                  <ThumbnailSquare src={row.image_url} alt={String(row.id)} className="h-16 w-16" />
                  <span className="text-sm font-medium text-slate-900">#{row.id}</span>
                  <span className="truncate text-sm text-slate-600">
                    {row.profile_email || row.profile_name || row.profile_id}
                  </span>
                  <span className="text-sm text-slate-700">{row.prompt_chain_count}</span>
                  <span className="text-sm text-slate-700">{row.response_count}</span>
                  <ExpandChevron open={isOpen} className="justify-self-end" />
                </div>
              }
            >
              <div className="grid gap-4 lg:grid-cols-2">
                <FieldBlock label="Request metadata">
                  <div className="space-y-2">
                    <MetadataText label="Request ID:" value={row.id} />
                    <MetadataText label="Created:" value={formatAdminDate(row.created_datetime_utc)} />
                    <MetadataText label="Profile ID:" value={row.profile_id} />
                    <MetadataText label="Profile:" value={row.profile_email || row.profile_name || "Unknown"} />
                    <MetadataText label="Image ID:" value={row.image_id} />
                    <MetadataText label="Prompt chains:" value={row.prompt_chain_count} />
                    <MetadataText label="Model responses:" value={row.response_count} />
                  </div>
                </FieldBlock>
                <FieldBlock label="Image summary">
                  <div className="flex items-start gap-4">
                    <ThumbnailSquare src={row.image_url} alt={String(row.id)} className="h-20 w-20" />
                    <DetailText value={row.image_description} mutedFallback="No image description." preserveWhitespace />
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
