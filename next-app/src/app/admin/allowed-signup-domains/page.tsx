import { AllowedSignupDomainsManagementClient } from "@/components/admin/AllowedSignupDomainsManagementClient";
import { type AllowedSignupDomainsFilterState } from "@/lib/admin/management-types";

import { getAllowedSignupDomainsPage } from "./actions";

const defaultFilters: AllowedSignupDomainsFilterState = {
  page: 1,
  pageSize: 10,
  search: "",
};

export default async function AllowedSignupDomainsPage() {
  const initialData = await getAllowedSignupDomainsPage(defaultFilters);

  return (
    <div className="space-y-4">
      <h1 className="pl-5 font-display text-3xl font-semibold text-slate-900">Allowed Signup Domains</h1>
      <AllowedSignupDomainsManagementClient initialData={initialData} initialFilters={defaultFilters} />
    </div>
  );
}
