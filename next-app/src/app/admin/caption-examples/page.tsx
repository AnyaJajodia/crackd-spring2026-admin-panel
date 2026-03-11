import { CaptionExamplesManagementClient } from "@/components/admin/CaptionExamplesManagementClient";
import { type CaptionExamplesFilterState } from "@/lib/admin/management-types";

import { getCaptionExamplesPage } from "./actions";

const defaultFilters: CaptionExamplesFilterState = {
  page: 1,
  pageSize: 10,
  search: "",
};

export default async function CaptionExamplesPage() {
  const initialData = await getCaptionExamplesPage(defaultFilters);

  return (
    <div className="space-y-4">
      <h1 className="pl-5 font-display text-3xl font-semibold text-slate-900">Caption Examples</h1>
      <CaptionExamplesManagementClient initialData={initialData} initialFilters={defaultFilters} />
    </div>
  );
}
