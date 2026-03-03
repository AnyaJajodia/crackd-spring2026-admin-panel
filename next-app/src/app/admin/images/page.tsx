import { ImagesManagementClient } from "@/components/admin/ImagesManagementClient";
import { type ImagesFilterState } from "@/lib/admin/management-types";

import { getImagesPage } from "./actions";

const defaultFilters: ImagesFilterState = {
  page: 1,
  pageSize: 10,
  search: "",
  visibility: "all",
  commonUse: "all",
};

export default async function ImagesPage() {
  const initialData = await getImagesPage(defaultFilters);

  return (
    <div className="space-y-4">
      <h1 className="pl-5 font-display text-3xl font-semibold text-slate-900">Images</h1>
      <ImagesManagementClient initialData={initialData} initialFilters={defaultFilters} />
    </div>
  );
}
