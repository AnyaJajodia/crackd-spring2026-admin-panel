import { TermsManagementClient } from "@/components/admin/TermsManagementClient";
import { type TermsFilterState } from "@/lib/admin/management-types";

import { getTermsPage, getTermTypeOptions } from "./actions";

const defaultFilters: TermsFilterState = {
  page: 1,
  pageSize: 10,
  search: "",
};

export default async function TermsPage() {
  const [initialData, termTypeOptions] = await Promise.all([
    getTermsPage(defaultFilters),
    getTermTypeOptions(),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="pl-5 font-display text-3xl font-semibold text-slate-900">Terms</h1>
      <TermsManagementClient
        initialData={initialData}
        initialFilters={defaultFilters}
        termTypeOptions={termTypeOptions}
      />
    </div>
  );
}
