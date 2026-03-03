import { CaptionsManagementClient } from "@/components/admin/CaptionsManagementClient";
import { type CaptionsFilterState } from "@/lib/admin/management-types";
import { requireSuperadmin } from "@/lib/auth/requireSuperadmin";

import { getCaptionsPage } from "./actions";

const defaultFilters: CaptionsFilterState = {
  page: 1,
  pageSize: 10,
  search: "",
  visibility: "all",
  featured: "all",
  sort: "newest",
};

export default async function CaptionsPage() {
  await requireSuperadmin();
  const initialData = await getCaptionsPage(defaultFilters);

  return (
    <div className="space-y-4">
      <h1 className="pl-5 font-display text-3xl font-semibold text-slate-900">Captions</h1>
      <CaptionsManagementClient initialData={initialData} initialFilters={defaultFilters} />
    </div>
  );
}
