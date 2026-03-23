"use server";

import {
  type PaginatedResult,
  type ProfileManagementRow,
  type ProfilesFilterState,
  type ProfileUpdateInput,
} from "@/lib/admin/management-types";
import { requireSuperadmin } from "@/lib/auth/requireSuperadmin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const PROFILE_SELECT =
  "id,created_datetime_utc,modified_datetime_utc,first_name,last_name,email,is_superadmin,is_in_study,is_matrix_admin";

function applyProfileFilters(queryBuilder: any, filters: ProfilesFilterState) {
  let query = queryBuilder;
  const search = filters.search.trim();

  if (filters.role === "superadmins") {
    query = query.eq("is_superadmin", true);
  } else if (filters.role === "matrix_admins") {
    query = query.eq("is_matrix_admin", true);
  } else if (filters.role === "in_study") {
    query = query.eq("is_in_study", true);
  }

  if (search) {
    const pattern = `%${search}%`;
    query = query.or(`email.ilike.${pattern},first_name.ilike.${pattern},last_name.ilike.${pattern}`);
  }

  return query;
}

export async function getProfilesPage(
  filters: ProfilesFilterState
): Promise<PaginatedResult<ProfileManagementRow>> {
  await requireSuperadmin();

  const admin = createSupabaseAdminClient();
  const pageSize = Math.max(1, Math.min(50, filters.pageSize || 10));
  const countResult = await applyProfileFilters(
    admin.from("profiles").select("id", { count: "exact", head: true }),
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
  const dataResult = await applyProfileFilters(
    admin
      .from("profiles")
      .select(PROFILE_SELECT)
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
    rows: (dataResult.data ?? []) as ProfileManagementRow[],
  };
}

export async function updateProfileRow(payload: ProfileUpdateInput): Promise<ProfileManagementRow> {
  const { profile } = await requireSuperadmin();

  const admin = createSupabaseAdminClient();

  if (Object.keys(payload.changes).length === 0) {
    const readResult = await admin
      .from("profiles")
      .select(PROFILE_SELECT)
      .eq("id", payload.id)
      .single<ProfileManagementRow>();

    if (readResult.error) {
      throw new Error(readResult.error.message);
    }

    return readResult.data;
  }

  const result = await admin
    .from("profiles")
    .update({ ...payload.changes, modified_datetime_utc: new Date().toISOString(), modified_by_user_id: profile.id })
    .eq("id", payload.id)
    .select(PROFILE_SELECT)
    .single<ProfileManagementRow>();

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.data;
}
