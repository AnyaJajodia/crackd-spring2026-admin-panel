"use client";

import * as React from "react";
import { SlidersHorizontal } from "lucide-react";

import { getHumorFlavorStepsPage } from "@/app/admin/humor-flavor-steps/actions";
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
import { FilterMultiSelectModal } from "@/components/admin/FilterMultiSelectModal";
import { Button } from "@/components/ui/button";
import { useAdminDataTable } from "@/components/admin/useAdminDataTable";
import {
  type HumorFlavorStepManagementRow,
  type HumorFlavorStepsFilterState,
  type LookupOption,
  type PaginatedResult,
} from "@/lib/admin/management-types";

export function HumorFlavorStepsManagementClient({
  initialData,
  initialFilters,
  flavorOptions,
  llmModelOptions,
}: {
  initialData: PaginatedResult<HumorFlavorStepManagementRow>;
  initialFilters: HumorFlavorStepsFilterState;
  flavorOptions: LookupOption[];
  llmModelOptions: LookupOption[];
}) {
  const [expandedId, setExpandedId] = React.useState<number | null>(null);
  const [isFlavorModalOpen, setIsFlavorModalOpen] = React.useState(false);
  const [isModelModalOpen, setIsModelModalOpen] = React.useState(false);
  const { filters, searchInput, setSearchInput, data, loading, error, updateFilters } =
    useAdminDataTable({
      initialData,
      initialFilters,
      loadRecords: getHumorFlavorStepsPage,
    });
  const selectedFlavorIds = React.useMemo(
    () => filters.humorFlavorIds.split(",").map((value) => value.trim()).filter(Boolean),
    [filters.humorFlavorIds]
  );
  const selectedModelIds = React.useMemo(
    () => filters.llmModelIds.split(",").map((value) => value.trim()).filter(Boolean),
    [filters.llmModelIds]
  );

  return (
    <>
      <AdminManagementLayout
        searchPlaceholder="Search step description or prompts..."
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        controls={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFlavorModalOpen(true)}
              className="rounded-full border-slate-300 bg-white text-slate-800 hover:bg-slate-100"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Flavors {selectedFlavorIds.length > 0 ? `(${selectedFlavorIds.length})` : ""}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsModelModalOpen(true)}
              className="rounded-full border-slate-300 bg-white text-slate-800 hover:bg-slate-100"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Models {selectedModelIds.length > 0 ? `(${selectedModelIds.length})` : ""}
            </Button>
            <FilterChipGroup
              label="Sort"
              value={filters.sort}
              onChange={(value) => updateFilters((current) => ({ ...current, sort: value, page: 1 }))}
              options={[
                { label: "Newest", value: "created_desc" },
                { label: "Order asc", value: "order_asc" },
                { label: "Order desc", value: "order_desc" },
              ]}
            />
          </>
        }
        columnHeaders={
          <div className="grid grid-cols-[110px_70px_minmax(0,1fr)_160px_140px_32px] items-center gap-4 px-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            <span>Flavor</span>
            <span>Order</span>
            <span>Description</span>
            <span>Model</span>
            <span>Step Type</span>
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
          emptyMessage="No humor flavor steps matched your filters."
        >
          {data.rows.map((row) => {
            const isOpen = expandedId === row.id;

            return (
              <ExpandableRow
                key={row.id}
                open={isOpen}
                onToggle={() => setExpandedId((current) => (current === row.id ? null : row.id))}
                header={
                  <div className="grid grid-cols-[110px_70px_minmax(0,1fr)_160px_140px_32px] items-center gap-4 px-4 py-4">
                    <span className="truncate text-sm font-medium text-slate-900">
                      {row.humor_flavor_slug || `Flavor #${row.humor_flavor_id}`}
                    </span>
                    <span className="text-sm text-slate-700">{row.order_by}</span>
                    <span className="truncate text-sm text-slate-600">{row.description || "No description."}</span>
                    <span className="truncate text-sm text-slate-600">
                      {row.llm_model_name || `Model #${row.llm_model_id}`}
                    </span>
                    <span className="truncate text-sm text-slate-600">
                      {row.humor_flavor_step_type_slug || `Type #${row.humor_flavor_step_type_id}`}
                    </span>
                    <ExpandChevron open={isOpen} className="justify-self-end" />
                  </div>
                }
              >
                <div className="grid gap-4 lg:grid-cols-2">
                  <FieldBlock label="Step metadata">
                    <div className="space-y-2">
                      <MetadataText label="Step ID:" value={row.id} />
                      <MetadataText label="Flavor:" value={row.humor_flavor_slug || row.humor_flavor_id} />
                      <MetadataText label="Order:" value={row.order_by} />
                      <MetadataText label="Model:" value={row.llm_model_name || row.llm_model_id} />
                      <MetadataText
                        label="Step type:"
                        value={row.humor_flavor_step_type_slug || row.humor_flavor_step_type_id}
                      />
                      <MetadataText label="Input type:" value={row.llm_input_type_slug || row.llm_input_type_id} />
                      <MetadataText label="Output type:" value={row.llm_output_type_slug || row.llm_output_type_id} />
                      <MetadataText label="Temperature:" value={row.llm_temperature ?? "Default"} />
                      <MetadataText label="Created:" value={formatAdminDate(row.created_datetime_utc)} />
                    </div>
                  </FieldBlock>
                  <FieldBlock label="Description">
                    <DetailText value={row.description} mutedFallback="No short description." preserveWhitespace />
                  </FieldBlock>
                  <FieldBlock label="System prompt" className="lg:col-span-2">
                    <DetailText value={row.llm_system_prompt} mutedFallback="No system prompt." preserveWhitespace />
                  </FieldBlock>
                  <FieldBlock label="User prompt" className="lg:col-span-2">
                    <DetailText value={row.llm_user_prompt} mutedFallback="No user prompt." preserveWhitespace />
                  </FieldBlock>
                </div>
              </ExpandableRow>
            );
          })}
        </ManagementTableState>
      </AdminManagementLayout>

      <FilterMultiSelectModal
        title="Filter Humor Flavors"
        open={isFlavorModalOpen}
        onClose={() => setIsFlavorModalOpen(false)}
        options={flavorOptions.map((option) => ({ value: option.value, label: option.label }))}
        selectedValues={selectedFlavorIds}
        onApply={(values) =>
          updateFilters((current) => ({ ...current, humorFlavorIds: values.join(","), page: 1 }))
        }
      />

      <FilterMultiSelectModal
        title="Filter Models"
        open={isModelModalOpen}
        onClose={() => setIsModelModalOpen(false)}
        options={llmModelOptions.map((option) => ({ value: option.value, label: option.label }))}
        selectedValues={selectedModelIds}
        onApply={(values) =>
          updateFilters((current) => ({ ...current, llmModelIds: values.join(","), page: 1 }))
        }
      />
    </>
  );
}
