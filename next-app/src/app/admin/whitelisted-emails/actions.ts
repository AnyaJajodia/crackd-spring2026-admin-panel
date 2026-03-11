"use server";

import {
  type PaginatedResult,
  type WhitelistedEmailManagementRow,
  type WhitelistedEmailMutationInput,
  type WhitelistedEmailsFilterState,
} from "@/lib/admin/management-types";
import { requireSuperadmin } from "@/lib/auth/requireSuperadmin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function applyWhitelistedEmailFilters(queryBuilder: any, filters: WhitelistedEmailsFilterState) {
  const search = filters.search.trim();
  return search ? queryBuilder.ilike("email_address", `%${search}%`) : queryBuilder;
}

export async function getWhitelistedEmailsPage(
  filters: WhitelistedEmailsFilterState
): Promise<PaginatedResult<WhitelistedEmailManagementRow>> {
  await requireSuperadmin();

  const admin = createSupabaseAdminClient();
  const pageSize = Math.max(1, Math.min(50, filters.pageSize || 10));
  const countResult = await applyWhitelistedEmailFilters(
    admin.from("whitelist_email_addresses").select("id", { count: "exact", head: true }),
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
  const dataResult = await applyWhitelistedEmailFilters(
    admin
      .from("whitelist_email_addresses")
      .select("id,created_datetime_utc,modified_datetime_utc,email_address")
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
    rows: (dataResult.data ?? []) as WhitelistedEmailManagementRow[],
  };
}

export async function createWhitelistedEmail(
  payload: WhitelistedEmailMutationInput
): Promise<WhitelistedEmailManagementRow> {
  await requireSuperadmin();
  const admin = createSupabaseAdminClient();
  const result = await admin
    .from("whitelist_email_addresses")
    .insert({ email_address: payload.email_address })
    .select("id,created_datetime_utc,modified_datetime_utc,email_address")
    .single<WhitelistedEmailManagementRow>();

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.data;
}

export async function updateWhitelistedEmail(
  payload: WhitelistedEmailMutationInput
): Promise<WhitelistedEmailManagementRow> {
  await requireSuperadmin();
  if (!payload.id) {
    throw new Error("Missing whitelisted email id.");
  }

  const admin = createSupabaseAdminClient();
  const result = await admin
    .from("whitelist_email_addresses")
    .update({
      email_address: payload.email_address,
      modified_datetime_utc: new Date().toISOString(),
    })
    .eq("id", payload.id)
    .select("id,created_datetime_utc,modified_datetime_utc,email_address")
    .single<WhitelistedEmailManagementRow>();

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.data;
}

export async function deleteWhitelistedEmail(id: number): Promise<{ id: number }> {
  await requireSuperadmin();
  const admin = createSupabaseAdminClient();
  const result = await admin.from("whitelist_email_addresses").delete().eq("id", id);

  if (result.error) {
    throw new Error(result.error.message);
  }

  return { id };
}
