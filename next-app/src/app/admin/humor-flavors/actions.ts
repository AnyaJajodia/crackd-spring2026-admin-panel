"use server";

import {
  type HumorFlavorManagementRow,
  type HumorFlavorsFilterState,
  type PaginatedResult,
} from "@/lib/admin/management-types";
import { requireSuperadmin } from "@/lib/auth/requireSuperadmin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function applyHumorFlavorFilters(queryBuilder: any, filters: HumorFlavorsFilterState) {
  const search = filters.search.trim();

  if (!search) {
    return queryBuilder;
  }

  const pattern = `%${search}%`;
  return queryBuilder.or(`slug.ilike.${pattern},description.ilike.${pattern}`);
}

export async function getHumorFlavorsPage(
  filters: HumorFlavorsFilterState
): Promise<PaginatedResult<HumorFlavorManagementRow>> {
  await requireSuperadmin();

  const admin = createSupabaseAdminClient();
  const pageSize = Math.max(1, Math.min(50, filters.pageSize || 10));
  const dataResult = await applyHumorFlavorFilters(
    admin
      .from("humor_flavors")
      .select("id,created_datetime_utc,description,slug")
      .order("created_datetime_utc", {
        ascending: filters.sort === "oldest",
        nullsFirst: filters.sort === "oldest",
      }),
    filters
  );

  if (dataResult.error) {
    throw new Error(dataResult.error.message);
  }

  const rows = (dataResult.data ?? []) as Omit<HumorFlavorManagementRow, "step_count">[];
  const flavorIds = rows.map((row) => row.id);
  const stepCountMap = new Map<number, number>();

  if (flavorIds.length > 0) {
    const stepResult = await admin
      .from("humor_flavor_steps")
      .select("humor_flavor_id")
      .in("humor_flavor_id", flavorIds);

    if (stepResult.error) {
      throw new Error(stepResult.error.message);
    }

    for (const row of stepResult.data ?? []) {
      const flavorId = row.humor_flavor_id as number | null;
      if (flavorId == null) continue;
      stepCountMap.set(flavorId, (stepCountMap.get(flavorId) ?? 0) + 1);
    }
  }

  const filteredRows = rows
    .map((row) => ({
      ...row,
      step_count: stepCountMap.get(row.id) ?? 0,
    }))
    .filter((row) => {
      if (filters.stepStatus === "has_steps") {
        return row.step_count > 0;
      }

      if (filters.stepStatus === "no_steps") {
        return row.step_count === 0;
      }

      return true;
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
