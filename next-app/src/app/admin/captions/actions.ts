"use server";

import {
  type CaptionManagementRow,
  type CaptionsFilterState,
  type CaptionUpdateInput,
  type PaginatedResult,
} from "@/lib/admin/management-types";
import { requireSuperadmin } from "@/lib/auth/requireSuperadmin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const CAPTION_SELECT =
  "id,created_datetime_utc,modified_datetime_utc,content,is_public,profile_id,image_id,humor_flavor_id,is_featured,caption_request_id,like_count,llm_prompt_chain_id";

function applyCaptionFilters(queryBuilder: any, filters: CaptionsFilterState) {
  let query = queryBuilder;
  const search = filters.search.trim();

  if (filters.visibility === "public") {
    query = query.eq("is_public", true);
  } else if (filters.visibility === "private") {
    query = query.eq("is_public", false);
  }

  if (filters.featured === "featured") {
    query = query.eq("is_featured", true);
  } else if (filters.featured === "not_featured") {
    query = query.eq("is_featured", false);
  }

  if (search) {
    query = query.ilike("content", `%${search}%`);
  }

  return query;
}

export async function getCaptionsPage(
  filters: CaptionsFilterState
): Promise<PaginatedResult<CaptionManagementRow>> {
  await requireSuperadmin();

  const admin = createSupabaseAdminClient();
  const pageSize = Math.max(1, Math.min(50, filters.pageSize || 10));
  const countResult = await applyCaptionFilters(
    admin.from("captions").select("id", { count: "exact", head: true }),
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

  let dataQuery = applyCaptionFilters(
    admin.from("captions").select(CAPTION_SELECT).range(from, to),
    filters
  );

  if (filters.sort === "likes") {
    dataQuery = dataQuery
      .order("like_count", { ascending: false, nullsFirst: false })
      .order("created_datetime_utc", { ascending: false, nullsFirst: false });
  } else {
    dataQuery = dataQuery.order("created_datetime_utc", { ascending: false, nullsFirst: false });
  }

  const dataResult = await dataQuery;

  if (dataResult.error) {
    throw new Error(dataResult.error.message);
  }

  const rows = (dataResult.data ?? []) as Omit<
    CaptionManagementRow,
    "image_url" | "humor_flavor_slug" | "llm_prompt_chain_label"
  >[];
  const imageIds = Array.from(new Set(rows.map((row) => row.image_id).filter(Boolean))) as string[];
  const humorFlavorIds = Array.from(
    new Set(rows.map((row) => row.humor_flavor_id).filter((value): value is number => value != null))
  );
  const imageUrlMap = new Map<string, string | null>();
  const humorFlavorMap = new Map<number, string | null>();

  if (imageIds.length > 0) {
    const imageResult = await admin.from("images").select("id,url").in("id", imageIds);
    if (imageResult.error) {
      throw new Error(imageResult.error.message);
    }

    (imageResult.data ?? []).forEach((image) => {
      imageUrlMap.set(image.id as string, (image.url as string | null) ?? null);
    });
  }

  if (humorFlavorIds.length > 0) {
    const flavorResult = await admin
      .from("humor_flavors")
      .select("id,slug")
      .in("id", humorFlavorIds);

    if (flavorResult.error) {
      throw new Error(flavorResult.error.message);
    }

    (flavorResult.data ?? []).forEach((flavor) => {
      humorFlavorMap.set(flavor.id as number, (flavor.slug as string | null) ?? null);
    });
  }

  return {
    page,
    pageSize,
    totalCount,
    totalPages,
    rows: rows.map((row) => ({
      ...row,
      image_url: row.image_id ? imageUrlMap.get(row.image_id) ?? null : null,
      humor_flavor_slug:
        row.humor_flavor_id != null ? humorFlavorMap.get(row.humor_flavor_id) ?? null : null,
      llm_prompt_chain_label:
        row.llm_prompt_chain_id != null ? `Prompt Chain #${row.llm_prompt_chain_id}` : null,
    })),
  };
}

export async function updateCaptionRow(
  payload: CaptionUpdateInput
): Promise<Pick<CaptionManagementRow, "id" | "is_public" | "is_featured">> {
  const { profile } = await requireSuperadmin();

  const admin = createSupabaseAdminClient();
  const result = await admin
    .from("captions")
    .update({
      is_public: payload.is_public,
      is_featured: payload.is_featured,
      modified_datetime_utc: new Date().toISOString(),
      modified_by_user_id: profile.id,
    })
    .eq("id", payload.id)
    .select("id,is_public,is_featured")
    .single<Pick<CaptionManagementRow, "id" | "is_public" | "is_featured">>();

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.data;
}
