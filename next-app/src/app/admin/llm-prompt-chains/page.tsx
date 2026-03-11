import { LlmPromptChainsManagementClient } from "@/components/admin/LlmPromptChainsManagementClient";
import { type LlmPromptChainsFilterState } from "@/lib/admin/management-types";

import { getLlmPromptChainsPage } from "./actions";

const defaultFilters: LlmPromptChainsFilterState = {
  page: 1,
  pageSize: 10,
  search: "",
  responseStatus: "all",
};

export default async function LlmPromptChainsPage() {
  const initialData = await getLlmPromptChainsPage(defaultFilters);

  return (
    <div className="space-y-4">
      <h1 className="pl-5 font-display text-3xl font-semibold text-slate-900">LLM Prompt Chains</h1>
      <LlmPromptChainsManagementClient initialData={initialData} initialFilters={defaultFilters} />
    </div>
  );
}
