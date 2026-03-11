"use client";

import * as React from "react";
import { SlidersHorizontal } from "lucide-react";

import { getLlmResponsesPage } from "@/app/admin/llm-responses/actions";
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
  formatAdminDate,
} from "@/components/admin/AdminManagementPrimitives";
import { FilterMultiSelectModal } from "@/components/admin/FilterMultiSelectModal";
import { Button } from "@/components/ui/button";
import { useAdminDataTable } from "@/components/admin/useAdminDataTable";
import {
  type LlmResponseManagementRow,
  type LlmResponsesFilterState,
  type LookupOption,
  type PaginatedResult,
} from "@/lib/admin/management-types";

export function LlmResponsesManagementClient({
  initialData,
  initialFilters,
  llmModelOptions,
  humorFlavorOptions,
}: {
  initialData: PaginatedResult<LlmResponseManagementRow>;
  initialFilters: LlmResponsesFilterState;
  llmModelOptions: LookupOption[];
  humorFlavorOptions: LookupOption[];
}) {
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [isModelModalOpen, setIsModelModalOpen] = React.useState(false);
  const [isFlavorModalOpen, setIsFlavorModalOpen] = React.useState(false);
  const { filters, searchInput, setSearchInput, data, loading, error, updateFilters } =
    useAdminDataTable({
      initialData,
      initialFilters,
      loadRecords: getLlmResponsesPage,
    });
  const selectedModelIds = React.useMemo(
    () => filters.llmModelIds.split(",").map((value) => value.trim()).filter(Boolean),
    [filters.llmModelIds]
  );
  const selectedFlavorIds = React.useMemo(
    () => filters.humorFlavorIds.split(",").map((value) => value.trim()).filter(Boolean),
    [filters.humorFlavorIds]
  );

  return (
    <>
      <AdminManagementLayout
        searchPlaceholder="Search prompts, responses, or caption request ids..."
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        controls={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsModelModalOpen(true)}
              className="rounded-full border-slate-300 bg-white text-slate-800 hover:bg-slate-100"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Models {selectedModelIds.length > 0 ? `(${selectedModelIds.length})` : ""}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFlavorModalOpen(true)}
              className="rounded-full border-slate-300 bg-white text-slate-800 hover:bg-slate-100"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Flavors {selectedFlavorIds.length > 0 ? `(${selectedFlavorIds.length})` : ""}
            </Button>
          </>
        }
        columnHeaders={
          <div className="grid grid-cols-[150px_120px_140px_90px_minmax(0,1fr)_32px] items-center gap-4 px-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            <span>Model</span>
            <span>Request</span>
            <span>Flavor</span>
            <span>Seconds</span>
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
          emptyMessage="No LLM responses matched your current filters."
        >
          {data.rows.map((row) => {
            const isOpen = expandedId === row.id;

            return (
              <ExpandableRow
                key={row.id}
                open={isOpen}
                onToggle={() => setExpandedId((current) => (current === row.id ? null : row.id))}
                header={
                  <div className="grid grid-cols-[150px_120px_140px_90px_minmax(0,1fr)_32px] items-center gap-4 px-4 py-4">
                    <span className="truncate text-sm font-medium text-slate-900">
                      {row.llm_model_name || row.llm_model_id}
                    </span>
                    <span className="text-sm text-slate-700">#{row.caption_request_id}</span>
                    <span className="truncate text-sm text-slate-600">
                      {row.humor_flavor_slug || row.humor_flavor_id}
                    </span>
                    <span className="text-sm text-slate-700">{row.processing_time_seconds}s</span>
                    <span className="truncate text-sm text-slate-600">{row.profile_email || row.profile_id}</span>
                    <ExpandChevron open={isOpen} className="justify-self-end" />
                  </div>
                }
              >
                <div className="grid gap-4 lg:grid-cols-2">
                  <FieldBlock label="Response metadata">
                    <div className="space-y-2">
                      <MetadataText label="Response ID:" value={row.id} />
                      <MetadataText label="Created:" value={formatAdminDate(row.created_datetime_utc)} />
                      <MetadataText label="Request ID:" value={row.caption_request_id} />
                      <MetadataText label="Prompt chain:" value={row.llm_prompt_chain_id ?? "None"} />
                      <MetadataText label="Model:" value={row.llm_model_name || row.llm_model_id} />
                      <MetadataText label="Profile:" value={row.profile_email || row.profile_id} />
                      <MetadataText label="Flavor:" value={row.humor_flavor_slug || row.humor_flavor_id} />
                      <MetadataText
                        label="Step:"
                        value={row.humor_flavor_step_order ?? row.humor_flavor_step_id ?? "None"}
                      />
                      <MetadataText label="Temperature:" value={row.llm_temperature ?? "Default"} />
                    </div>
                  </FieldBlock>
                  <FieldBlock label="Step context">
                    <DetailText
                      value={row.humor_flavor_step_description}
                      mutedFallback="No step description."
                      preserveWhitespace
                    />
                  </FieldBlock>
                  <FieldBlock label="System prompt" className="lg:col-span-2">
                    <DetailText value={row.llm_system_prompt} mutedFallback="No system prompt." preserveWhitespace />
                  </FieldBlock>
                  <FieldBlock label="User prompt" className="lg:col-span-2">
                    <DetailText value={row.llm_user_prompt} mutedFallback="No user prompt." preserveWhitespace />
                  </FieldBlock>
                  <FieldBlock label="Model response" className="lg:col-span-2">
                    <DetailText
                      value={row.llm_model_response}
                      mutedFallback="No response body."
                      preserveWhitespace
                    />
                  </FieldBlock>
                </div>
              </ExpandableRow>
            );
          })}
        </ManagementTableState>
      </AdminManagementLayout>

      <FilterMultiSelectModal
        title="Filter LLM Models"
        open={isModelModalOpen}
        onClose={() => setIsModelModalOpen(false)}
        options={llmModelOptions.map((option) => ({ value: option.value, label: option.label }))}
        selectedValues={selectedModelIds}
        onApply={(values) =>
          updateFilters((current) => ({ ...current, llmModelIds: values.join(","), page: 1 }))
        }
      />

      <FilterMultiSelectModal
        title="Filter Humor Flavors"
        open={isFlavorModalOpen}
        onClose={() => setIsFlavorModalOpen(false)}
        options={humorFlavorOptions.map((option) => ({ value: option.value, label: option.label }))}
        selectedValues={selectedFlavorIds}
        onApply={(values) =>
          updateFilters((current) => ({ ...current, humorFlavorIds: values.join(","), page: 1 }))
        }
      />
    </>
  );
}
