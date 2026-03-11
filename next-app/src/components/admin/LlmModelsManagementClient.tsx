"use client";

import * as React from "react";

import {
  createLlmModel,
  deleteLlmModel,
  getLlmModelsPage,
  updateLlmModel,
} from "@/app/admin/llm-models/actions";
import { FieldBlock, SelectField, SegmentedControl, TextInput, formatAdminDate } from "@/components/admin/AdminManagementPrimitives";
import { SimpleCrudManagementClient } from "@/components/admin/SimpleCrudManagementClient";
import {
  type LlmModelManagementRow,
  type LlmModelMutationInput,
  type LlmModelsFilterState,
  type LookupOption,
  type PaginatedResult,
} from "@/lib/admin/management-types";

export function LlmModelsManagementClient({
  initialData,
  initialFilters,
  providerOptions,
}: {
  initialData: PaginatedResult<LlmModelManagementRow>;
  initialFilters: LlmModelsFilterState;
  providerOptions: LookupOption[];
}) {
  return (
    <SimpleCrudManagementClient<
      LlmModelManagementRow,
      LlmModelsFilterState,
      LlmModelMutationInput
    >
      initialData={initialData}
      initialFilters={initialFilters}
      loadRecords={getLlmModelsPage}
      createRecord={createLlmModel}
      updateRecord={updateLlmModel}
      deleteRecord={deleteLlmModel}
      createEmptyDraft={() => ({
        name: "",
        llm_provider_id: providerOptions[0] ? Number(providerOptions[0].value) : 0,
        provider_model_id: "",
        is_temperature_supported: false,
      })}
      buildDraft={(row) => ({
        id: row.id,
        name: row.name,
        llm_provider_id: row.llm_provider_id,
        provider_model_id: row.provider_model_id,
        is_temperature_supported: row.is_temperature_supported,
      })}
      searchPlaceholder="Search model name or provider model id..."
      emptyMessage="No LLM models matched your current search."
      addLabel="Add model"
      entityLabel="model"
      columnHeaders={
        <div className="grid grid-cols-[minmax(0,1fr)_180px_180px] items-center gap-4 px-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          <span>Model</span>
          <span>Provider</span>
          <span>Created</span>
        </div>
      }
      renderRow={(row) => (
        <div className="grid grid-cols-[minmax(0,1fr)_180px_180px] items-center gap-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-900">{row.name}</p>
            <p className="truncate text-sm text-slate-500">{row.provider_model_id}</p>
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm text-slate-700">{row.llm_provider_name || `Provider #${row.llm_provider_id}`}</p>
            <p className="text-xs text-slate-500">
              Temperature: {row.is_temperature_supported ? "Supported" : "Fixed/default"}
            </p>
          </div>
          <p className="text-sm text-slate-500">{formatAdminDate(row.created_datetime_utc)}</p>
        </div>
      )}
      renderForm={(draft, setDraft) => (
        <div className="space-y-5">
          <FieldBlock label="Name">
            <TextInput value={draft.name} onChange={(value) => setDraft((current) => ({ ...current, name: value }))} />
          </FieldBlock>
          <FieldBlock label="Provider">
            <SelectField
              value={String(draft.llm_provider_id)}
              onChange={(value) =>
                setDraft((current) => ({ ...current, llm_provider_id: Number(value) }))
              }
              options={providerOptions.map((option) => ({ value: option.value, label: option.label }))}
            />
          </FieldBlock>
          <FieldBlock label="Provider model id">
            <TextInput
              value={draft.provider_model_id}
              onChange={(value) => setDraft((current) => ({ ...current, provider_model_id: value }))}
            />
          </FieldBlock>
          <SegmentedControl
            label="Temperature support"
            value={draft.is_temperature_supported ? "true" : "false"}
            onChange={(value) =>
              setDraft((current) => ({ ...current, is_temperature_supported: value === "true" }))
            }
            options={[
              { label: "Supported", value: "true" },
              { label: "Not supported", value: "false" },
            ]}
          />
        </div>
      )}
    />
  );
}
