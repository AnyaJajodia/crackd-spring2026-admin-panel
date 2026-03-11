"use server";

import {
  type LlmModelManagementRow,
  type LlmModelMutationInput,
  type LlmModelsFilterState,
  type LookupOption,
  type PaginatedResult,
} from "@/lib/admin/management-types";
import { requireSuperadmin } from "@/lib/auth/requireSuperadmin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const LLM_MODEL_SELECT =
  "id,created_datetime_utc,name,llm_provider_id,provider_model_id,is_temperature_supported";

function applyLlmModelFilters(queryBuilder: any, filters: LlmModelsFilterState) {
  const search = filters.search.trim();
  if (!search) {
    return queryBuilder;
  }

  const pattern = `%${search}%`;
  return queryBuilder.or(`name.ilike.${pattern},provider_model_id.ilike.${pattern}`);
}

export async function getLlmProviderOptions(): Promise<LookupOption[]> {
  await requireSuperadmin();
  const admin = createSupabaseAdminClient();
  const result = await admin.from("llm_providers").select("id,name").order("name", { ascending: true });

  if (result.error) {
    throw new Error(result.error.message);
  }

  return (result.data ?? []).map((row) => ({
    value: String(row.id),
    label: row.name as string,
  }));
}

export async function getLlmModelsPage(
  filters: LlmModelsFilterState
): Promise<PaginatedResult<LlmModelManagementRow>> {
  await requireSuperadmin();

  const admin = createSupabaseAdminClient();
  const pageSize = Math.max(1, Math.min(50, filters.pageSize || 10));
  const countResult = await applyLlmModelFilters(
    admin.from("llm_models").select("id", { count: "exact", head: true }),
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
  const dataResult = await applyLlmModelFilters(
    admin
      .from("llm_models")
      .select(LLM_MODEL_SELECT)
      .order("created_datetime_utc", { ascending: false, nullsFirst: false })
      .range(from, to),
    filters
  );

  if (dataResult.error) {
    throw new Error(dataResult.error.message);
  }

  const rows = (dataResult.data ?? []) as Omit<LlmModelManagementRow, "llm_provider_name">[];
  const providerIds = Array.from(new Set(rows.map((row) => row.llm_provider_id)));
  const providerResult =
    providerIds.length > 0
      ? await admin.from("llm_providers").select("id,name").in("id", providerIds)
      : { data: [], error: null };

  if (providerResult.error) {
    throw new Error(providerResult.error.message);
  }

  const providerMap = new Map<number, string | null>(
    (providerResult.data ?? []).map((row) => [row.id as number, (row.name as string | null) ?? null])
  );

  return {
    page,
    pageSize,
    totalCount,
    totalPages,
    rows: rows.map((row) => ({
      ...row,
      llm_provider_name: providerMap.get(row.llm_provider_id) ?? null,
    })),
  };
}

export async function createLlmModel(payload: LlmModelMutationInput): Promise<LlmModelManagementRow> {
  await requireSuperadmin();
  const admin = createSupabaseAdminClient();
  const result = await admin
    .from("llm_models")
    .insert({
      name: payload.name,
      llm_provider_id: payload.llm_provider_id,
      provider_model_id: payload.provider_model_id,
      is_temperature_supported: payload.is_temperature_supported,
    })
    .select(LLM_MODEL_SELECT)
    .single<Omit<LlmModelManagementRow, "llm_provider_name">>();

  if (result.error) {
    throw new Error(result.error.message);
  }

  return {
    ...result.data,
    llm_provider_name: null,
  };
}

export async function updateLlmModel(payload: LlmModelMutationInput): Promise<LlmModelManagementRow> {
  await requireSuperadmin();
  if (!payload.id) {
    throw new Error("Missing LLM model id.");
  }

  const admin = createSupabaseAdminClient();
  const result = await admin
    .from("llm_models")
    .update({
      name: payload.name,
      llm_provider_id: payload.llm_provider_id,
      provider_model_id: payload.provider_model_id,
      is_temperature_supported: payload.is_temperature_supported,
    })
    .eq("id", payload.id)
    .select(LLM_MODEL_SELECT)
    .single<Omit<LlmModelManagementRow, "llm_provider_name">>();

  if (result.error) {
    throw new Error(result.error.message);
  }

  const providerName =
    (
      await admin.from("llm_providers").select("name").eq("id", payload.llm_provider_id).single()
    ).data?.name ?? null;

  return {
    ...result.data,
    llm_provider_name: providerName as string | null,
  };
}

export async function deleteLlmModel(id: number): Promise<{ id: number }> {
  await requireSuperadmin();
  const admin = createSupabaseAdminClient();
  const result = await admin.from("llm_models").delete().eq("id", id);

  if (result.error) {
    throw new Error(result.error.message);
  }

  return { id };
}
