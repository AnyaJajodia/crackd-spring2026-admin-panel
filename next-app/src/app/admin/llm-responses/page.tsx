import { LlmResponsesManagementClient } from "@/components/admin/LlmResponsesManagementClient";
import { type LlmResponsesFilterState } from "@/lib/admin/management-types";

import { getLlmResponseFilterOptions, getLlmResponsesPage } from "./actions";

const defaultFilters: LlmResponsesFilterState = {
  page: 1,
  pageSize: 10,
  search: "",
  llmModelIds: "",
  humorFlavorIds: "",
};

export default async function LlmResponsesPage() {
  const [initialData, options] = await Promise.all([
    getLlmResponsesPage(defaultFilters),
    getLlmResponseFilterOptions(),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="pl-5 font-display text-3xl font-semibold text-slate-900">LLM Responses</h1>
      <LlmResponsesManagementClient
        initialData={initialData}
        initialFilters={defaultFilters}
        llmModelOptions={options.llmModels}
        humorFlavorOptions={options.humorFlavors}
      />
    </div>
  );
}
