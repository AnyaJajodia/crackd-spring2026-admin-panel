import { LlmProvidersManagementClient } from "@/components/admin/LlmProvidersManagementClient";
import { type LlmProvidersFilterState } from "@/lib/admin/management-types";

import { getLlmProvidersPage } from "./actions";

const defaultFilters: LlmProvidersFilterState = {
  page: 1,
  pageSize: 10,
  search: "",
};

export default async function LlmProvidersPage() {
  const initialData = await getLlmProvidersPage(defaultFilters);

  return (
    <div className="space-y-4">
      <h1 className="pl-5 font-display text-3xl font-semibold text-slate-900">LLM Providers</h1>
      <LlmProvidersManagementClient initialData={initialData} initialFilters={defaultFilters} />
    </div>
  );
}
