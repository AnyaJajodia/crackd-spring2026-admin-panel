"use server";

import {
  type CaptionRequestManagementRow,
  type CaptionRequestsFilterState,
  type PaginatedResult,
} from "@/lib/admin/management-types";
import { requireSuperadmin } from "@/lib/auth/requireSuperadmin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const CAPTION_REQUEST_SELECT = "id,created_datetime_utc,profile_id,image_id";

export async function getCaptionRequestsPage(
  filters: CaptionRequestsFilterState
): Promise<PaginatedResult<CaptionRequestManagementRow>> {
  await requireSuperadmin();

  const admin = createSupabaseAdminClient();
  const pageSize = Math.max(1, Math.min(50, filters.pageSize || 10));
  const dataResult = await admin
    .from("caption_requests")
    .select(CAPTION_REQUEST_SELECT)
    .order("created_datetime_utc", { ascending: false, nullsFirst: false });

  if (dataResult.error) {
    throw new Error(dataResult.error.message);
  }

  const rows = (dataResult.data ?? []) as Omit<
    CaptionRequestManagementRow,
    "profile_email" | "profile_name" | "image_url" | "image_description" | "prompt_chain_count" | "response_count"
  >[];
  const [profiles, images, promptChains, responses] = await Promise.all([
    admin.from("profiles").select("id,email,first_name,last_name"),
    admin.from("images").select("id,url,image_description"),
    admin.from("llm_prompt_chains").select("id,caption_request_id"),
    admin.from("llm_model_responses").select("id,caption_request_id"),
  ]);

  for (const result of [profiles, images, promptChains, responses]) {
    if (result.error) {
      throw new Error(result.error.message);
    }
  }

  const profileMap = new Map<string, { email: string | null; name: string | null }>(
    (profiles.data ?? []).map((row) => [
      row.id as string,
      {
        email: (row.email as string | null) ?? null,
        name: [row.first_name, row.last_name].filter(Boolean).join(" ") || null,
      },
    ])
  );
  const imageMap = new Map<string, { url: string | null; description: string | null }>(
    (images.data ?? []).map((row) => [
      row.id as string,
      {
        url: (row.url as string | null) ?? null,
        description: (row.image_description as string | null) ?? null,
      },
    ])
  );
  const promptChainCountMap = new Map<number, number>();
  const responseCountMap = new Map<number, number>();

  for (const row of promptChains.data ?? []) {
    const requestId = row.caption_request_id as number | null;
    if (requestId == null) continue;
    promptChainCountMap.set(requestId, (promptChainCountMap.get(requestId) ?? 0) + 1);
  }

  for (const row of responses.data ?? []) {
    const requestId = row.caption_request_id as number | null;
    if (requestId == null) continue;
    responseCountMap.set(requestId, (responseCountMap.get(requestId) ?? 0) + 1);
  }

  const search = filters.search.trim().toLowerCase();
  const filteredRows = rows
    .map((row) => ({
      ...row,
      profile_email: profileMap.get(row.profile_id)?.email ?? null,
      profile_name: profileMap.get(row.profile_id)?.name ?? null,
      image_url: imageMap.get(row.image_id)?.url ?? null,
      image_description: imageMap.get(row.image_id)?.description ?? null,
      prompt_chain_count: promptChainCountMap.get(row.id) ?? 0,
      response_count: responseCountMap.get(row.id) ?? 0,
    }))
    .filter((row) => {
      if (!search) return true;

      return [
        String(row.id),
        row.profile_id,
        row.profile_email,
        row.profile_name,
        row.image_id,
        row.image_description,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search));
    })
    .filter((row) => {
      if (filters.activity === "has_prompt_chains") {
        return row.prompt_chain_count > 0;
      }

      if (filters.activity === "has_responses") {
        return row.response_count > 0;
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
