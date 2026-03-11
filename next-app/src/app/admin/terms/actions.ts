"use server";

import {
  type LookupOption,
  type PaginatedResult,
  type TermManagementRow,
  type TermMutationInput,
  type TermsFilterState,
} from "@/lib/admin/management-types";
import { requireSuperadmin } from "@/lib/auth/requireSuperadmin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const TERM_SELECT =
  "id,created_datetime_utc,modified_datetime_utc,term,definition,example,priority,term_type_id";

function applyTermFilters(queryBuilder: any, filters: TermsFilterState) {
  const search = filters.search.trim();
  if (!search) {
    return queryBuilder;
  }

  const pattern = `%${search}%`;
  return queryBuilder.or(`term.ilike.${pattern},definition.ilike.${pattern},example.ilike.${pattern}`);
}

export async function getTermTypeOptions(): Promise<LookupOption[]> {
  await requireSuperadmin();

  const admin = createSupabaseAdminClient();
  const result = await admin.from("term_types").select("id,name").order("name", { ascending: true });

  if (result.error) {
    throw new Error(result.error.message);
  }

  return (result.data ?? []).map((row) => ({
    value: String(row.id),
    label: row.name as string,
  }));
}

export async function getTermsPage(filters: TermsFilterState): Promise<PaginatedResult<TermManagementRow>> {
  await requireSuperadmin();

  const admin = createSupabaseAdminClient();
  const pageSize = Math.max(1, Math.min(50, filters.pageSize || 10));
  const countResult = await applyTermFilters(
    admin.from("terms").select("id", { count: "exact", head: true }),
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
  const dataResult = await applyTermFilters(
    admin
      .from("terms")
      .select(TERM_SELECT)
      .order("priority", { ascending: false, nullsFirst: false })
      .order("created_datetime_utc", { ascending: false, nullsFirst: false })
      .range(from, to),
    filters
  );

  if (dataResult.error) {
    throw new Error(dataResult.error.message);
  }

  const rows = (dataResult.data ?? []) as Omit<TermManagementRow, "term_type_name">[];
  const typeIds = Array.from(
    new Set(rows.map((row) => row.term_type_id).filter((value): value is number => value != null))
  );
  const typeResult =
    typeIds.length > 0
      ? await admin.from("term_types").select("id,name").in("id", typeIds)
      : { data: [], error: null };

  if (typeResult.error) {
    throw new Error(typeResult.error.message);
  }

  const typeMap = new Map<number, string | null>(
    (typeResult.data ?? []).map((row) => [row.id as number, (row.name as string | null) ?? null])
  );

  return {
    page,
    pageSize,
    totalCount,
    totalPages,
    rows: rows.map((row) => ({
      ...row,
      term_type_name: row.term_type_id != null ? typeMap.get(row.term_type_id) ?? null : null,
    })),
  };
}

export async function createTerm(payload: TermMutationInput): Promise<TermManagementRow> {
  await requireSuperadmin();
  const admin = createSupabaseAdminClient();
  const result = await admin
    .from("terms")
    .insert({
      term: payload.term,
      definition: payload.definition,
      example: payload.example,
      priority: payload.priority,
      term_type_id: payload.term_type_id,
    })
    .select(TERM_SELECT)
    .single<Omit<TermManagementRow, "term_type_name">>();

  if (result.error) {
    throw new Error(result.error.message);
  }

  return {
    ...result.data,
    term_type_name: null,
  };
}

export async function updateTerm(payload: TermMutationInput): Promise<TermManagementRow> {
  await requireSuperadmin();
  if (!payload.id) {
    throw new Error("Missing term id.");
  }

  const admin = createSupabaseAdminClient();
  const result = await admin
    .from("terms")
    .update({
      term: payload.term,
      definition: payload.definition,
      example: payload.example,
      priority: payload.priority,
      term_type_id: payload.term_type_id,
      modified_datetime_utc: new Date().toISOString(),
    })
    .eq("id", payload.id)
    .select(TERM_SELECT)
    .single<Omit<TermManagementRow, "term_type_name">>();

  if (result.error) {
    throw new Error(result.error.message);
  }

  const typeName =
    payload.term_type_id == null
      ? null
      : (
          await admin
            .from("term_types")
            .select("name")
            .eq("id", payload.term_type_id)
            .single()
        ).data?.name ?? null;

  return {
    ...result.data,
    term_type_name: typeName as string | null,
  };
}

export async function deleteTerm(id: number): Promise<{ id: number }> {
  await requireSuperadmin();
  const admin = createSupabaseAdminClient();
  const result = await admin.from("terms").delete().eq("id", id);

  if (result.error) {
    throw new Error(result.error.message);
  }

  return { id };
}
