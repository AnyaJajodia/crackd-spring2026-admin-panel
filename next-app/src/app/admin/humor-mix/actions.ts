"use server";

import {
  type HumorMixFilterState,
  type HumorMixManagementRow,
  type HumorMixUpdateInput,
  type PaginatedResult,
} from "@/lib/admin/management-types";
import { requireSuperadmin } from "@/lib/auth/requireSuperadmin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function getHumorMixPage(
  filters: HumorMixFilterState
): Promise<PaginatedResult<HumorMixManagementRow>> {
  await requireSuperadmin();

  const admin = createSupabaseAdminClient();
  const pageSize = Math.max(1, Math.min(50, filters.pageSize || 10));
  const dataResult = await admin
    .from("humor_flavor_mix")
    .select("id,created_datetime_utc,humor_flavor_id,caption_count")
    .order("created_datetime_utc", { ascending: false, nullsFirst: false });

  if (dataResult.error) {
    throw new Error(dataResult.error.message);
  }

  const baseRows = (dataResult.data ?? []) as Omit<
    HumorMixManagementRow,
    "humor_flavor_slug" | "humor_flavor_description"
  >[];
  const flavorIds = Array.from(new Set(baseRows.map((row) => row.humor_flavor_id)));
  const flavorResult =
    flavorIds.length > 0
      ? await admin.from("humor_flavors").select("id,slug,description").in("id", flavorIds)
      : { data: [], error: null };

  if (flavorResult.error) {
    throw new Error(flavorResult.error.message);
  }

  const flavorMap = new Map<number, { slug: string | null; description: string | null }>(
    (flavorResult.data ?? []).map((row) => [
      row.id as number,
      {
        slug: (row.slug as string | null) ?? null,
        description: (row.description as string | null) ?? null,
      },
    ])
  );

  const filteredRows = baseRows
    .map((row) => ({
      ...row,
      humor_flavor_slug: flavorMap.get(row.humor_flavor_id)?.slug ?? null,
      humor_flavor_description: flavorMap.get(row.humor_flavor_id)?.description ?? null,
    }))
    .filter((row) => {
      const search = filters.search.trim().toLowerCase();
      if (!search) return true;
      return (
        row.humor_flavor_slug?.toLowerCase().includes(search) ||
        row.humor_flavor_description?.toLowerCase().includes(search) ||
        String(row.caption_count).includes(search)
      );
    });

  const filteredTotalCount = filteredRows.length;
  const filteredTotalPages = Math.max(1, Math.ceil(filteredTotalCount / pageSize));
  const filteredPage = Math.min(Math.max(1, filters.page || 1), filteredTotalPages);
  const start = (filteredPage - 1) * pageSize;
  const end = start + pageSize;

  return {
    page: filteredPage,
    pageSize,
    totalCount: filteredTotalCount,
    totalPages: filteredTotalPages,
    rows: filteredRows.slice(start, end),
  };
}

export async function updateHumorMixRow(
  payload: HumorMixUpdateInput
): Promise<HumorMixManagementRow> {
  const { profile } = await requireSuperadmin();

  const admin = createSupabaseAdminClient();
  const result = await admin
    .from("humor_flavor_mix")
    .update({ caption_count: payload.caption_count, modified_datetime_utc: new Date().toISOString(), modified_by_user_id: profile.id })
    .eq("id", payload.id)
    .select("id,created_datetime_utc,humor_flavor_id,caption_count")
    .single<Omit<HumorMixManagementRow, "humor_flavor_slug" | "humor_flavor_description">>();

  if (result.error) {
    throw new Error(result.error.message);
  }

  const flavorResult = await admin
    .from("humor_flavors")
    .select("id,slug,description")
    .eq("id", result.data.humor_flavor_id)
    .single();

  if (flavorResult.error) {
    throw new Error(flavorResult.error.message);
  }

  return {
    ...result.data,
    humor_flavor_slug: (flavorResult.data.slug as string | null) ?? null,
    humor_flavor_description: (flavorResult.data.description as string | null) ?? null,
  };
}
