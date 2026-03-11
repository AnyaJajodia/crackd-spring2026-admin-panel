import { WhitelistedEmailsManagementClient } from "@/components/admin/WhitelistedEmailsManagementClient";
import { type WhitelistedEmailsFilterState } from "@/lib/admin/management-types";

import { getWhitelistedEmailsPage } from "./actions";

const defaultFilters: WhitelistedEmailsFilterState = {
  page: 1,
  pageSize: 10,
  search: "",
};

export default async function WhitelistedEmailsPage() {
  const initialData = await getWhitelistedEmailsPage(defaultFilters);

  return (
    <div className="space-y-4">
      <h1 className="pl-5 font-display text-3xl font-semibold text-slate-900">Whitelisted Emails</h1>
      <WhitelistedEmailsManagementClient initialData={initialData} initialFilters={defaultFilters} />
    </div>
  );
}
