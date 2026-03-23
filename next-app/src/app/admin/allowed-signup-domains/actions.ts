"use server";

import {
  type AllowedSignupDomainManagementRow,
  type AllowedSignupDomainMutationInput,
  type AllowedSignupDomainsFilterState,
  type PaginatedResult,
} from "@/lib/admin/management-types";
import { requireSuperadmin } from "@/lib/auth/requireSuperadmin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function applyAllowedDomainFilters(queryBuilder: any, filters: AllowedSignupDomainsFilterState) {
  const search = filters.search.trim();
  return search ? queryBuilder.ilike("apex_domain", `%${search}%`) : queryBuilder;
}

export async function getAllowedSignupDomainsPage(
  filters: AllowedSignupDomainsFilterState
): Promise<PaginatedResult<AllowedSignupDomainManagementRow>> {
  await requireSuperadmin();

  const admin = createSupabaseAdminClient();
  const pageSize = Math.max(1, Math.min(50, filters.pageSize || 10));
  const countResult = await applyAllowedDomainFilters(
    admin.from("allowed_signup_domains").select("id", { count: "exact", head: true }),
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
  const dataResult = await applyAllowedDomainFilters(
    admin
      .from("allowed_signup_domains")
      .select("id,created_datetime_utc,apex_domain")
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
    rows: (dataResult.data ?? []) as AllowedSignupDomainManagementRow[],
  };
}

export async function createAllowedSignupDomain(
  payload: AllowedSignupDomainMutationInput
): Promise<AllowedSignupDomainManagementRow> {
  const { profile } = await requireSuperadmin();
  const admin = createSupabaseAdminClient();
  const result = await admin
    .from("allowed_signup_domains")
    .insert({ apex_domain: payload.apex_domain, created_by_user_id: profile.id, modified_by_user_id: profile.id })
    .select("id,created_datetime_utc,apex_domain")
    .single<AllowedSignupDomainManagementRow>();

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.data;
}

export async function updateAllowedSignupDomain(
  payload: AllowedSignupDomainMutationInput
): Promise<AllowedSignupDomainManagementRow> {
  const { profile } = await requireSuperadmin();
  if (!payload.id) {
    throw new Error("Missing domain id.");
  }

  const admin = createSupabaseAdminClient();
  const result = await admin
    .from("allowed_signup_domains")
    .update({ apex_domain: payload.apex_domain, modified_datetime_utc: new Date().toISOString(), modified_by_user_id: profile.id })
    .eq("id", payload.id)
    .select("id,created_datetime_utc,apex_domain")
    .single<AllowedSignupDomainManagementRow>();

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.data;
}

export async function deleteAllowedSignupDomain(id: number): Promise<{ id: number }> {
  await requireSuperadmin();
  const admin = createSupabaseAdminClient();
  const result = await admin.from("allowed_signup_domains").delete().eq("id", id);

  if (result.error) {
    throw new Error(result.error.message);
  }

  return { id };
}
