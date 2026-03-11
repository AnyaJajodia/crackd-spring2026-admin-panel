"use server";

import {
  type CaptionExampleManagementRow,
  type CaptionExampleMutationInput,
  type CaptionExamplesFilterState,
  type PaginatedResult,
} from "@/lib/admin/management-types";
import { requireSuperadmin } from "@/lib/auth/requireSuperadmin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const CAPTION_EXAMPLE_SELECT =
  "id,created_datetime_utc,modified_datetime_utc,image_description,caption,explanation,priority,image_id";

function applyCaptionExampleFilters(queryBuilder: any, filters: CaptionExamplesFilterState) {
  const search = filters.search.trim();
  if (!search) {
    return queryBuilder;
  }

  const pattern = `%${search}%`;
  return queryBuilder.or(
    `image_description.ilike.${pattern},caption.ilike.${pattern},explanation.ilike.${pattern}`
  );
}

export async function getCaptionExamplesPage(
  filters: CaptionExamplesFilterState
): Promise<PaginatedResult<CaptionExampleManagementRow>> {
  await requireSuperadmin();

  const admin = createSupabaseAdminClient();
  const pageSize = Math.max(1, Math.min(50, filters.pageSize || 10));
  const countResult = await applyCaptionExampleFilters(
    admin.from("caption_examples").select("id", { count: "exact", head: true }),
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
  const dataResult = await applyCaptionExampleFilters(
    admin
      .from("caption_examples")
      .select(CAPTION_EXAMPLE_SELECT)
      .order("priority", { ascending: false, nullsFirst: false })
      .order("created_datetime_utc", { ascending: false, nullsFirst: false })
      .range(from, to),
    filters
  );

  if (dataResult.error) {
    throw new Error(dataResult.error.message);
  }

  const rows = (dataResult.data ?? []) as Omit<CaptionExampleManagementRow, "image_url">[];
  const imageIds = Array.from(new Set(rows.map((row) => row.image_id).filter(Boolean))) as string[];
  const imageResult =
    imageIds.length > 0
      ? await admin.from("images").select("id,url").in("id", imageIds)
      : { data: [], error: null };

  if (imageResult.error) {
    throw new Error(imageResult.error.message);
  }

  const imageMap = new Map<string, string | null>(
    (imageResult.data ?? []).map((row) => [row.id as string, (row.url as string | null) ?? null])
  );

  return {
    page,
    pageSize,
    totalCount,
    totalPages,
    rows: rows.map((row) => ({
      ...row,
      image_url: row.image_id ? imageMap.get(row.image_id) ?? null : null,
    })),
  };
}

export async function createCaptionExample(
  payload: CaptionExampleMutationInput
): Promise<CaptionExampleManagementRow> {
  await requireSuperadmin();
  const admin = createSupabaseAdminClient();
  const result = await admin
    .from("caption_examples")
    .insert({
      image_description: payload.image_description,
      caption: payload.caption,
      explanation: payload.explanation,
      priority: payload.priority,
      image_id: payload.image_id,
    })
    .select(CAPTION_EXAMPLE_SELECT)
    .single<Omit<CaptionExampleManagementRow, "image_url">>();

  if (result.error) {
    throw new Error(result.error.message);
  }

  return {
    ...result.data,
    image_url: null,
  };
}

export async function updateCaptionExample(
  payload: CaptionExampleMutationInput
): Promise<CaptionExampleManagementRow> {
  await requireSuperadmin();
  if (!payload.id) {
    throw new Error("Missing caption example id.");
  }

  const admin = createSupabaseAdminClient();
  const result = await admin
    .from("caption_examples")
    .update({
      image_description: payload.image_description,
      caption: payload.caption,
      explanation: payload.explanation,
      priority: payload.priority,
      image_id: payload.image_id,
      modified_datetime_utc: new Date().toISOString(),
    })
    .eq("id", payload.id)
    .select(CAPTION_EXAMPLE_SELECT)
    .single<Omit<CaptionExampleManagementRow, "image_url">>();

  if (result.error) {
    throw new Error(result.error.message);
  }

  const imageUrl =
    payload.image_id == null
      ? null
      : (
          await admin.from("images").select("url").eq("id", payload.image_id).single()
        ).data?.url ?? null;

  return {
    ...result.data,
    image_url: imageUrl as string | null,
  };
}

export async function deleteCaptionExample(id: number): Promise<{ id: number }> {
  await requireSuperadmin();
  const admin = createSupabaseAdminClient();
  const result = await admin.from("caption_examples").delete().eq("id", id);

  if (result.error) {
    throw new Error(result.error.message);
  }

  return { id };
}
