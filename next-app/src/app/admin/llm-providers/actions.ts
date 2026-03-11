"use server";

import {
  type LlmProviderManagementRow,
  type LlmProviderMutationInput,
  type LlmProvidersFilterState,
  type PaginatedResult,
} from "@/lib/admin/management-types";
import { requireSuperadmin } from "@/lib/auth/requireSuperadmin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function applyLlmProviderFilters(queryBuilder: any, filters: LlmProvidersFilterState) {
  const search = filters.search.trim();
  return search ? queryBuilder.ilike("name", `%${search}%`) : queryBuilder;
}

export async function getLlmProvidersPage(
  filters: LlmProvidersFilterState
): Promise<PaginatedResult<LlmProviderManagementRow>> {
  await requireSuperadmin();

  const admin = createSupabaseAdminClient();
  const pageSize = Math.max(1, Math.min(50, filters.pageSize || 10));
  const countResult = await applyLlmProviderFilters(
    admin.from("llm_providers").select("id", { count: "exact", head: true }),
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
  const dataResult = await applyLlmProviderFilters(
    admin
      .from("llm_providers")
      .select("id,created_datetime_utc,name")
      .order("created_datetime_utc", { ascending: false, nullsFirst: false })
      .range(from, to),
    filters
  );

  if (dataResult.error) {
    throw new Error(dataResult.error.message);
  }

  return {
    page,
    pageSize,
    totalCount,
    totalPages,
    rows: (dataResult.data ?? []) as LlmProviderManagementRow[],
  };
}

export async function createLlmProvider(
  payload: LlmProviderMutationInput
): Promise<LlmProviderManagementRow> {
  await requireSuperadmin();
  const admin = createSupabaseAdminClient();
  const result = await admin
    .from("llm_providers")
    .insert({ name: payload.name })
    .select("id,created_datetime_utc,name")
    .single<LlmProviderManagementRow>();

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.data;
}

export async function updateLlmProvider(
  payload: LlmProviderMutationInput
): Promise<LlmProviderManagementRow> {
  await requireSuperadmin();
  if (!payload.id) {
    throw new Error("Missing LLM provider id.");
  }

  const admin = createSupabaseAdminClient();
  const result = await admin
    .from("llm_providers")
    .update({ name: payload.name })
    .eq("id", payload.id)
    .select("id,created_datetime_utc,name")
    .single<LlmProviderManagementRow>();

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.data;
}

export async function deleteLlmProvider(id: number): Promise<{ id: number }> {
  await requireSuperadmin();
  const admin = createSupabaseAdminClient();
  const result = await admin.from("llm_providers").delete().eq("id", id);

  if (result.error) {
    throw new Error(result.error.message);
  }

  return { id };
}
