"use server";

import {
  type LlmResponseManagementRow,
  type LlmResponsesFilterState,
  type LookupOption,
  type PaginatedResult,
} from "@/lib/admin/management-types";
import { requireSuperadmin } from "@/lib/auth/requireSuperadmin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const LLM_RESPONSE_SELECT =
  "id,created_datetime_utc,llm_model_response,processing_time_seconds,llm_model_id,profile_id,caption_request_id,llm_system_prompt,llm_user_prompt,llm_temperature,humor_flavor_id,llm_prompt_chain_id,humor_flavor_step_id";

function applyLlmResponseFilters(queryBuilder: any, filters: LlmResponsesFilterState) {
  let query = queryBuilder;
  const llmModelIds = filters.llmModelIds
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .map(Number)
    .filter((value) => Number.isFinite(value));
  const humorFlavorIds = filters.humorFlavorIds
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .map(Number)
    .filter((value) => Number.isFinite(value));

  if (llmModelIds.length > 0) {
    query = query.in("llm_model_id", llmModelIds);
  }

  if (humorFlavorIds.length > 0) {
    query = query.in("humor_flavor_id", humorFlavorIds);
  }

  return query;
}

export async function getLlmResponseFilterOptions(): Promise<{
  llmModels: LookupOption[];
  humorFlavors: LookupOption[];
}> {
  await requireSuperadmin();
  const admin = createSupabaseAdminClient();
  const [models, flavors] = await Promise.all([
    admin.from("llm_models").select("id,name").order("name", { ascending: true }),
    admin.from("humor_flavors").select("id,slug").order("slug", { ascending: true }),
  ]);

  if (models.error) {
    throw new Error(models.error.message);
  }
  if (flavors.error) {
    throw new Error(flavors.error.message);
  }

  return {
    llmModels: (models.data ?? []).map((row) => ({
      value: String(row.id),
      label: row.name as string,
    })),
    humorFlavors: (flavors.data ?? []).map((row) => ({
      value: String(row.id),
      label: row.slug as string,
    })),
  };
}

export async function getLlmResponsesPage(
  filters: LlmResponsesFilterState
): Promise<PaginatedResult<LlmResponseManagementRow>> {
  await requireSuperadmin();

  const admin = createSupabaseAdminClient();
  const pageSize = Math.max(1, Math.min(50, filters.pageSize || 10));
  const dataResult = await applyLlmResponseFilters(
    admin
      .from("llm_model_responses")
      .select(LLM_RESPONSE_SELECT)
      .order("created_datetime_utc", { ascending: false, nullsFirst: false }),
    filters
  );

  if (dataResult.error) {
    throw new Error(dataResult.error.message);
  }

  const rows = (dataResult.data ?? []) as Omit<
    LlmResponseManagementRow,
    "llm_model_name" | "profile_email" | "humor_flavor_slug" | "humor_flavor_step_order" | "humor_flavor_step_description"
  >[];
  const modelIds = Array.from(new Set(rows.map((row) => row.llm_model_id)));
  const profileIds = Array.from(new Set(rows.map((row) => row.profile_id)));
  const flavorIds = Array.from(new Set(rows.map((row) => row.humor_flavor_id)));
  const stepIds = Array.from(
    new Set(rows.map((row) => row.humor_flavor_step_id).filter((value): value is number => value != null))
  );

  const [models, profiles, flavors, steps] = await Promise.all([
    modelIds.length > 0
      ? admin.from("llm_models").select("id,name").in("id", modelIds)
      : Promise.resolve({ data: [], error: null }),
    profileIds.length > 0
      ? admin.from("profiles").select("id,email").in("id", profileIds)
      : Promise.resolve({ data: [], error: null }),
    flavorIds.length > 0
      ? admin.from("humor_flavors").select("id,slug").in("id", flavorIds)
      : Promise.resolve({ data: [], error: null }),
    stepIds.length > 0
      ? admin.from("humor_flavor_steps").select("id,order_by,description").in("id", stepIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  for (const result of [models, profiles, flavors, steps]) {
    if (result.error) {
      throw new Error(result.error.message);
    }
  }

  const modelMap = new Map<number, string | null>(
    (models.data ?? []).map((row) => [row.id as number, (row.name as string | null) ?? null])
  );
  const profileMap = new Map<string, string | null>(
    (profiles.data ?? []).map((row) => [row.id as string, (row.email as string | null) ?? null])
  );
  const flavorMap = new Map<number, string | null>(
    (flavors.data ?? []).map((row) => [row.id as number, (row.slug as string | null) ?? null])
  );
  const stepMap = new Map<number, { order_by: number | null; description: string | null }>(
    (steps.data ?? []).map((row) => [
      row.id as number,
      {
        order_by: (row.order_by as number | null) ?? null,
        description: (row.description as string | null) ?? null,
      },
    ])
  );

  const search = filters.search.trim().toLowerCase();
  const filteredRows = rows
    .map((row) => ({
      ...row,
      llm_model_name: modelMap.get(row.llm_model_id) ?? null,
      profile_email: profileMap.get(row.profile_id) ?? null,
      humor_flavor_slug: flavorMap.get(row.humor_flavor_id) ?? null,
      humor_flavor_step_order:
        row.humor_flavor_step_id != null ? stepMap.get(row.humor_flavor_step_id)?.order_by ?? null : null,
      humor_flavor_step_description:
        row.humor_flavor_step_id != null ? stepMap.get(row.humor_flavor_step_id)?.description ?? null : null,
    }))
    .filter((row) => {
      if (!search) return true;

      return [
        row.llm_model_name,
        row.profile_email,
        row.humor_flavor_slug,
        String(row.caption_request_id),
        row.llm_system_prompt,
        row.llm_user_prompt,
        row.llm_model_response,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search));
    });

  const totalCount = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const page = Math.min(Math.max(1, filters.page || 1), totalPages);
  const from = (page - 1) * pageSize;
  const to = from + pageSize;

  return {
    page,
    pageSize,
    totalCount,
    totalPages,
    rows: filteredRows.slice(from, to),
  };
}
