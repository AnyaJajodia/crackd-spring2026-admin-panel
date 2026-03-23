"use server";

import {
  type ImageManagementRow,
  type ImagesFilterState,
  type ImageUpdateInput,
  type PaginatedResult,
} from "@/lib/admin/management-types";
import { requireSuperadmin } from "@/lib/auth/requireSuperadmin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const IMAGE_SELECT =
  "id,created_datetime_utc,modified_datetime_utc,url,is_common_use,profile_id,additional_context,is_public,image_description,celebrity_recognition";

function applyImageFilters(queryBuilder: any, filters: ImagesFilterState) {
  let query = queryBuilder;
  const search = filters.search.trim();

  if (filters.visibility === "public") {
    query = query.eq("is_public", true);
  } else if (filters.visibility === "private") {
    query = query.eq("is_public", false);
  }

  if (filters.commonUse === "common") {
    query = query.eq("is_common_use", true);
  } else if (filters.commonUse === "not_common") {
    query = query.eq("is_common_use", false);
  }

  if (search) {
    const pattern = `%${search}%`;
    query = query.or(
      `url.ilike.${pattern},image_description.ilike.${pattern},additional_context.ilike.${pattern},celebrity_recognition.ilike.${pattern}`
    );
  }

  return query;
}

export async function getImagesPage(
  filters: ImagesFilterState
): Promise<PaginatedResult<ImageManagementRow>> {
  await requireSuperadmin();

  const admin = createSupabaseAdminClient();
  const pageSize = Math.max(1, Math.min(50, filters.pageSize || 10));
  const countResult = await applyImageFilters(
    admin.from("images").select("id", { count: "exact", head: true }),
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
  const dataResult = await applyImageFilters(
    admin
      .from("images")
      .select(IMAGE_SELECT)
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
    rows: (dataResult.data ?? []) as ImageManagementRow[],
  };
}

export async function updateImageRow(payload: ImageUpdateInput): Promise<ImageManagementRow> {
  const { profile } = await requireSuperadmin();

  const admin = createSupabaseAdminClient();
  const result = await admin
    .from("images")
    .update({
      is_common_use: payload.is_common_use,
      is_public: payload.is_public,
      additional_context: payload.additional_context || null,
      image_description: payload.image_description || null,
      modified_datetime_utc: new Date().toISOString(),
      modified_by_user_id: profile.id,
    })
    .eq("id", payload.id)
    .select(IMAGE_SELECT)
    .single<ImageManagementRow>();

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.data;
}

export async function deleteImageRow(id: string): Promise<{ id: string }> {
  await requireSuperadmin();

  const admin = createSupabaseAdminClient();
  const result = await admin.from("images").delete().eq("id", id);

  if (result.error) {
    throw new Error(result.error.message);
  }

  return { id };
}
