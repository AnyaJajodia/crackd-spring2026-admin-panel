import { CaptionRequestsManagementClient } from "@/components/admin/CaptionRequestsManagementClient";
import { type CaptionRequestsFilterState } from "@/lib/admin/management-types";

import { getCaptionRequestsPage } from "./actions";

const defaultFilters: CaptionRequestsFilterState = {
  page: 1,
  pageSize: 10,
  search: "",
  activity: "all",
};

export default async function CaptionRequestsPage() {
  const initialData = await getCaptionRequestsPage(defaultFilters);

  return (
    <div className="space-y-4">
      <h1 className="pl-5 font-display text-3xl font-semibold text-slate-900">Caption Requests</h1>
      <CaptionRequestsManagementClient initialData={initialData} initialFilters={defaultFilters} />
    </div>
  );
}
