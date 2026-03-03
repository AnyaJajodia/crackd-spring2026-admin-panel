import { ProfilesManagementClient } from "@/components/admin/ProfilesManagementClient";
import { type ProfilesFilterState } from "@/lib/admin/management-types";

import { getProfilesPage } from "./actions";

const defaultFilters: ProfilesFilterState = {
  page: 1,
  pageSize: 10,
  search: "",
  role: "all",
};

export default async function ProfilesPage() {
  const initialData = await getProfilesPage(defaultFilters);

  return (
    <div className="space-y-4">
      <h1 className="pl-5 font-display text-3xl font-semibold text-slate-900">Profiles</h1>
      <ProfilesManagementClient initialData={initialData} initialFilters={defaultFilters} />
    </div>
  );
}
