"use client";

import * as React from "react";

import { getLlmPromptChainsPage } from "@/app/admin/llm-prompt-chains/actions";
import {
  AdminManagementLayout,
  FilterChipGroup,
  ManagementTableState,
  ThumbnailSquare,
} from "@/components/admin/AdminManagementLayout";
import {
  ExpandChevron,
  ExpandableRow,
  FieldBlock,
  MetadataText,
  formatAdminDate,
} from "@/components/admin/AdminManagementPrimitives";
import { useAdminDataTable } from "@/components/admin/useAdminDataTable";
import {
  type LlmPromptChainManagementRow,
  type LlmPromptChainsFilterState,
  type PaginatedResult,
} from "@/lib/admin/management-types";

export function LlmPromptChainsManagementClient({
  initialData,
  initialFilters,
}: {
  initialData: PaginatedResult<LlmPromptChainManagementRow>;
  initialFilters: LlmPromptChainsFilterState;
}) {
  const [expandedId, setExpandedId] = React.useState<number | null>(null);
  const { filters, searchInput, setSearchInput, data, loading, error, updateFilters } =
    useAdminDataTable({
      initialData,
      initialFilters,
      loadRecords: getLlmPromptChainsPage,
    });

  return (
    <AdminManagementLayout
      searchPlaceholder="Search by caption request id..."
      searchValue={searchInput}
      onSearchChange={setSearchInput}
      controls={
        <FilterChipGroup
          label="Responses"
          value={filters.responseStatus}
          onChange={(value) => updateFilters((current) => ({ ...current, responseStatus: value, page: 1 }))}
          options={[
            { label: "All", value: "all" },
            { label: "Has responses", value: "has_responses" },
            { label: "No responses", value: "no_responses" },
          ]}
        />
      }
      columnHeaders={
        <div className="grid grid-cols-[72px_120px_140px_minmax(0,1fr)_32px] items-center gap-4 px-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          <span>Image</span>
          <span>Chain</span>
          <span>Request</span>
          <span>Profile</span>
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
        emptyMessage="No prompt chains matched your search."
      >
        {data.rows.map((row) => {
          const isOpen = expandedId === row.id;

          return (
            <ExpandableRow
              key={row.id}
              open={isOpen}
              onToggle={() => setExpandedId((current) => (current === row.id ? null : row.id))}
              header={
                <div className="grid grid-cols-[72px_120px_140px_minmax(0,1fr)_32px] items-center gap-4 px-4 py-4">
                  <ThumbnailSquare src={row.image_url} alt={String(row.id)} className="h-16 w-16" />
                  <span className="text-sm font-medium text-slate-900">#{row.id}</span>
                  <span className="text-sm text-slate-700">#{row.caption_request_id}</span>
                  <span className="truncate text-sm text-slate-600">{row.profile_email || "Unknown profile"}</span>
                  <ExpandChevron open={isOpen} className="justify-self-end" />
                </div>
              }
            >
              <div className="grid gap-4 lg:grid-cols-2">
                <FieldBlock label="Prompt chain">
                  <div className="space-y-2">
                    <MetadataText label="Chain ID:" value={row.id} />
                    <MetadataText label="Created:" value={formatAdminDate(row.created_datetime_utc)} />
                    <MetadataText label="Caption request:" value={row.caption_request_id} />
                    <MetadataText label="Responses:" value={row.response_count} />
                    <MetadataText label="Profile:" value={row.profile_email || "Unknown"} />
                  </div>
                </FieldBlock>
                <FieldBlock label="Linked image">
                  <div className="flex items-center gap-4">
                    <ThumbnailSquare src={row.image_url} alt={String(row.id)} className="h-20 w-20" />
                    <p className="text-sm text-slate-600">Audit grouping for prompt/response runs tied to this request.</p>
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
