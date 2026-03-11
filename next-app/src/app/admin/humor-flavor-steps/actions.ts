"use server";

import {
  type HumorFlavorStepManagementRow,
  type HumorFlavorStepsFilterState,
  type LookupOption,
  type PaginatedResult,
} from "@/lib/admin/management-types";
import { requireSuperadmin } from "@/lib/auth/requireSuperadmin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const STEP_SELECT =
  "id,created_datetime_utc,humor_flavor_id,llm_temperature,order_by,llm_input_type_id,llm_output_type_id,llm_model_id,humor_flavor_step_type_id,llm_system_prompt,llm_user_prompt,description";

function applyHumorFlavorStepFilters(queryBuilder: any, filters: HumorFlavorStepsFilterState) {
  let query = queryBuilder;
  const search = filters.search.trim();
  const humorFlavorIds = filters.humorFlavorIds
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .map(Number)
    .filter((value) => Number.isFinite(value));
  const llmModelIds = filters.llmModelIds
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .map(Number)
    .filter((value) => Number.isFinite(value));

  if (humorFlavorIds.length > 0) {
    query = query.in("humor_flavor_id", humorFlavorIds);
  }

  if (llmModelIds.length > 0) {
    query = query.in("llm_model_id", llmModelIds);
  }

  if (search) {
    const pattern = `%${search}%`;
    query = query.or(
      `description.ilike.${pattern},llm_system_prompt.ilike.${pattern},llm_user_prompt.ilike.${pattern}`
    );
  }

  return query;
}

export async function getHumorFlavorOptions(): Promise<LookupOption[]> {
  await requireSuperadmin();

  const admin = createSupabaseAdminClient();
  const result = await admin
    .from("humor_flavors")
    .select("id,slug")
    .order("slug", { ascending: true });

  if (result.error) {
    throw new Error(result.error.message);
  }

  return (result.data ?? []).map((row) => ({
    value: String(row.id),
    label: row.slug as string,
  }));
}

export async function getLlmModelOptions(): Promise<LookupOption[]> {
  await requireSuperadmin();

  const admin = createSupabaseAdminClient();
  const result = await admin.from("llm_models").select("id,name").order("name", { ascending: true });

  if (result.error) {
    throw new Error(result.error.message);
  }

  return (result.data ?? []).map((row) => ({
    value: String(row.id),
    label: row.name as string,
  }));
}

export async function getHumorFlavorStepsPage(
  filters: HumorFlavorStepsFilterState
): Promise<PaginatedResult<HumorFlavorStepManagementRow>> {
  await requireSuperadmin();

  const admin = createSupabaseAdminClient();
  const pageSize = Math.max(1, Math.min(50, filters.pageSize || 10));
  const countResult = await applyHumorFlavorStepFilters(
    admin.from("humor_flavor_steps").select("id", { count: "exact", head: true }),
    filters
  );

  if (countResult.error) {
    throw new Error(countResult.error.message);
  }

  const totalCount = countResult.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const page = Math.min(Math.max(1, filters.page || 1), totalPages);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const dataResult = await applyHumorFlavorStepFilters(
    admin
      .from("humor_flavor_steps")
      .select(STEP_SELECT)
      .order(
        filters.sort === "order_asc" || filters.sort === "order_desc" ? "order_by" : "created_datetime_utc",
        {
          ascending: filters.sort === "order_asc",
          nullsFirst: filters.sort === "order_asc",
        }
      )
      .order("created_datetime_utc", { ascending: false, nullsFirst: false })
      .range(from, to),
    filters
  );

  if (dataResult.error) {
    throw new Error(dataResult.error.message);
  }

  const rows = (dataResult.data ?? []) as Omit<
    HumorFlavorStepManagementRow,
    | "humor_flavor_slug"
    | "llm_input_type_slug"
    | "llm_output_type_slug"
    | "llm_model_name"
    | "humor_flavor_step_type_slug"
  >[];
  const flavorIds = Array.from(new Set(rows.map((row) => row.humor_flavor_id)));
  const modelIds = Array.from(new Set(rows.map((row) => row.llm_model_id)));
  const inputTypeIds = Array.from(new Set(rows.map((row) => row.llm_input_type_id)));
  const outputTypeIds = Array.from(new Set(rows.map((row) => row.llm_output_type_id)));
  const stepTypeIds = Array.from(new Set(rows.map((row) => row.humor_flavor_step_type_id)));

  const [flavors, models, inputTypes, outputTypes, stepTypes] = await Promise.all([
    flavorIds.length > 0
      ? admin.from("humor_flavors").select("id,slug").in("id", flavorIds)
      : Promise.resolve({ data: [], error: null }),
    modelIds.length > 0
      ? admin.from("llm_models").select("id,name").in("id", modelIds)
      : Promise.resolve({ data: [], error: null }),
    inputTypeIds.length > 0
      ? admin.from("llm_input_types").select("id,slug").in("id", inputTypeIds)
      : Promise.resolve({ data: [], error: null }),
    outputTypeIds.length > 0
      ? admin.from("llm_output_types").select("id,slug").in("id", outputTypeIds)
      : Promise.resolve({ data: [], error: null }),
    stepTypeIds.length > 0
      ? admin.from("humor_flavor_step_types").select("id,slug").in("id", stepTypeIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  for (const result of [flavors, models, inputTypes, outputTypes, stepTypes]) {
    if (result.error) {
      throw new Error(result.error.message);
    }
  }

  const flavorMap = new Map<number, string | null>(
    (flavors.data ?? []).map((row) => [row.id as number, (row.slug as string | null) ?? null])
  );
  const modelMap = new Map<number, string | null>(
    (models.data ?? []).map((row) => [row.id as number, (row.name as string | null) ?? null])
  );
  const inputTypeMap = new Map<number, string | null>(
    (inputTypes.data ?? []).map((row) => [row.id as number, (row.slug as string | null) ?? null])
  );
  const outputTypeMap = new Map<number, string | null>(
    (outputTypes.data ?? []).map((row) => [row.id as number, (row.slug as string | null) ?? null])
  );
  const stepTypeMap = new Map<number, string | null>(
    (stepTypes.data ?? []).map((row) => [row.id as number, (row.slug as string | null) ?? null])
  );

  return {
    page,
    pageSize,
    totalCount,
    totalPages,
    rows: rows.map((row) => ({
      ...row,
      humor_flavor_slug: flavorMap.get(row.humor_flavor_id) ?? null,
      llm_input_type_slug: inputTypeMap.get(row.llm_input_type_id) ?? null,
      llm_output_type_slug: outputTypeMap.get(row.llm_output_type_id) ?? null,
      llm_model_name: modelMap.get(row.llm_model_id) ?? null,
      humor_flavor_step_type_slug: stepTypeMap.get(row.humor_flavor_step_type_id) ?? null,
    })),
  };
}
