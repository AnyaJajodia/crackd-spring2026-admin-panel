import { HumorFlavorStepsManagementClient } from "@/components/admin/HumorFlavorStepsManagementClient";
import { type HumorFlavorStepsFilterState } from "@/lib/admin/management-types";

import { getHumorFlavorOptions, getHumorFlavorStepsPage, getLlmModelOptions } from "./actions";

const defaultFilters: HumorFlavorStepsFilterState = {
  page: 1,
  pageSize: 10,
  search: "",
  humorFlavorIds: "",
  llmModelIds: "",
  sort: "created_desc",
};

export default async function HumorFlavorStepsPage() {
  const [initialData, flavorOptions, llmModelOptions] = await Promise.all([
    getHumorFlavorStepsPage(defaultFilters),
    getHumorFlavorOptions(),
    getLlmModelOptions(),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="pl-5 font-display text-3xl font-semibold text-slate-900">Humor Flavor Steps</h1>
      <HumorFlavorStepsManagementClient
        initialData={initialData}
        initialFilters={defaultFilters}
        flavorOptions={flavorOptions}
        llmModelOptions={llmModelOptions}
      />
    </div>
  );
}
