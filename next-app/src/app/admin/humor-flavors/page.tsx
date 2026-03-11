import { HumorFlavorsManagementClient } from "@/components/admin/HumorFlavorsManagementClient";
import { type HumorFlavorsFilterState } from "@/lib/admin/management-types";

import { getHumorFlavorsPage } from "./actions";

const defaultFilters: HumorFlavorsFilterState = {
  page: 1,
  pageSize: 10,
  search: "",
  stepStatus: "all",
  sort: "newest",
};

export default async function HumorFlavorsPage() {
  const initialData = await getHumorFlavorsPage(defaultFilters);

  return (
    <div className="space-y-4">
      <h1 className="pl-5 font-display text-3xl font-semibold text-slate-900">Humor Flavors</h1>
      <HumorFlavorsManagementClient initialData={initialData} initialFilters={defaultFilters} />
    </div>
  );
}
