import { LlmModelsManagementClient } from "@/components/admin/LlmModelsManagementClient";
import { type LlmModelsFilterState } from "@/lib/admin/management-types";

import { getLlmModelsPage, getLlmProviderOptions } from "./actions";

const defaultFilters: LlmModelsFilterState = {
  page: 1,
  pageSize: 10,
  search: "",
};

export default async function LlmModelsPage() {
  const [initialData, providerOptions] = await Promise.all([
    getLlmModelsPage(defaultFilters),
    getLlmProviderOptions(),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="pl-5 font-display text-3xl font-semibold text-slate-900">LLM Models</h1>
      <LlmModelsManagementClient
        initialData={initialData}
        initialFilters={defaultFilters}
        providerOptions={providerOptions}
      />
    </div>
  );
}
