"use client";

import { createLlmProvider, deleteLlmProvider, getLlmProvidersPage, updateLlmProvider } from "@/app/admin/llm-providers/actions";
import { FieldBlock, TextInput, formatAdminDate } from "@/components/admin/AdminManagementPrimitives";
import { SimpleCrudManagementClient } from "@/components/admin/SimpleCrudManagementClient";
import {
  type LlmProviderManagementRow,
  type LlmProviderMutationInput,
  type LlmProvidersFilterState,
  type PaginatedResult,
} from "@/lib/admin/management-types";

export function LlmProvidersManagementClient({
  initialData,
  initialFilters,
}: {
  initialData: PaginatedResult<LlmProviderManagementRow>;
  initialFilters: LlmProvidersFilterState;
}) {
  return (
    <SimpleCrudManagementClient<
      LlmProviderManagementRow,
      LlmProvidersFilterState,
      LlmProviderMutationInput
    >
      initialData={initialData}
      initialFilters={initialFilters}
      loadRecords={getLlmProvidersPage}
      createRecord={createLlmProvider}
      updateRecord={updateLlmProvider}
      deleteRecord={deleteLlmProvider}
      createEmptyDraft={() => ({ name: "" })}
      buildDraft={(row) => ({ id: row.id, name: row.name })}
      searchPlaceholder="Search provider name..."
      emptyMessage="No LLM providers matched your current search."
      addLabel="Add provider"
      entityLabel="provider"
      columnHeaders={
        <div className="grid grid-cols-[minmax(0,1fr)_180px] items-center gap-4 px-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          <span>Name</span>
          <span>Created</span>
        </div>
      }
      renderRow={(row) => (
        <div className="grid grid-cols-[minmax(0,1fr)_180px] items-center gap-4">
          <p className="truncate text-sm font-medium text-slate-900">{row.name}</p>
          <p className="text-sm text-slate-500">{formatAdminDate(row.created_datetime_utc)}</p>
        </div>
      )}
      renderForm={(draft, setDraft) => (
        <FieldBlock label="Provider name">
          <TextInput value={draft.name} onChange={(value) => setDraft((current) => ({ ...current, name: value }))} />
        </FieldBlock>
      )}
    />
  );
}
