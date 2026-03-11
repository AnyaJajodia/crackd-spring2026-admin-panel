"use server";

import {
  type LlmPromptChainManagementRow,
  type LlmPromptChainsFilterState,
  type PaginatedResult,
} from "@/lib/admin/management-types";
import { requireSuperadmin } from "@/lib/auth/requireSuperadmin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function getLlmPromptChainsPage(
  filters: LlmPromptChainsFilterState
): Promise<PaginatedResult<LlmPromptChainManagementRow>> {
  await requireSuperadmin();

  const admin = createSupabaseAdminClient();
  const pageSize = Math.max(1, Math.min(50, filters.pageSize || 10));
  const dataResult = await admin
    .from("llm_prompt_chains")
    .select("id,created_datetime_utc,caption_request_id")
    .order("created_datetime_utc", { ascending: false, nullsFirst: false });

  if (dataResult.error) {
    throw new Error(dataResult.error.message);
  }

  const baseRows = (dataResult.data ?? []) as Omit<
    LlmPromptChainManagementRow,
    "response_count" | "profile_email" | "image_url"
  >[];
  const search = filters.search.trim().toLowerCase();
  const rows = search ? baseRows.filter((row) => String(row.caption_request_id).includes(search)) : baseRows;

  const [requests, responses] = await Promise.all([
    admin.from("caption_requests").select("id,profile_id,image_id"),
    admin.from("llm_model_responses").select("id,llm_prompt_chain_id"),
  ]);

  if (requests.error) {
    throw new Error(requests.error.message);
  }
  if (responses.error) {
    throw new Error(responses.error.message);
  }

  const [profiles, images] = await Promise.all([
    admin.from("profiles").select("id,email"),
    admin.from("images").select("id,url"),
  ]);

  if (profiles.error) {
    throw new Error(profiles.error.message);
  }
  if (images.error) {
    throw new Error(images.error.message);
  }

  const requestMap = new Map<string, { profile_id: string | null; image_id: string | null }>(
    (requests.data ?? []).map((row) => [
      String(row.id),
      {
        profile_id: (row.profile_id as string | null) ?? null,
        image_id: (row.image_id as string | null) ?? null,
      },
    ])
  );
  const profileMap = new Map<string, string | null>(
    (profiles.data ?? []).map((row) => [row.id as string, (row.email as string | null) ?? null])
  );
  const imageMap = new Map<string, string | null>(
    (images.data ?? []).map((row) => [row.id as string, (row.url as string | null) ?? null])
  );
  const responseCountMap = new Map<number, number>();

  for (const row of responses.data ?? []) {
    const chainId = row.llm_prompt_chain_id as number | null;
    if (chainId == null) continue;
    responseCountMap.set(chainId, (responseCountMap.get(chainId) ?? 0) + 1);
  }

  const filteredRows = rows
    .map((row) => {
      const request = requestMap.get(String(row.caption_request_id));
      return {
        ...row,
        response_count: responseCountMap.get(row.id) ?? 0,
        profile_email: request?.profile_id ? profileMap.get(request.profile_id) ?? null : null,
        image_url: request?.image_id ? imageMap.get(request.image_id) ?? null : null,
      };
    })
    .filter((row) => {
      if (!search) return true;

      return [String(row.id), String(row.caption_request_id), row.profile_email]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search));
    })
    .filter((row) => {
      if (filters.responseStatus === "has_responses") {
        return row.response_count > 0;
      }

      if (filters.responseStatus === "no_responses") {
        return row.response_count === 0;
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
