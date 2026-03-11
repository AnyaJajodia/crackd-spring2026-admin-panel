import { HumorMixManagementClient } from "@/components/admin/HumorMixManagementClient";
import { type HumorMixFilterState } from "@/lib/admin/management-types";

import { getHumorMixPage } from "./actions";

const defaultFilters: HumorMixFilterState = {
  page: 1,
  pageSize: 10,
  search: "",
};

export default async function HumorMixPage() {
  const initialData = await getHumorMixPage(defaultFilters);

  return (
    <div className="space-y-4">
      <h1 className="pl-5 font-display text-3xl font-semibold text-slate-900">Humor Mix</h1>
      <HumorMixManagementClient initialData={initialData} initialFilters={defaultFilters} />
    </div>
  );
}
