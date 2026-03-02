import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function fetchAllFromTable<T>(
  table: string,
  select: string,
  pageSize = 1000
): Promise<T[]> {
  const admin = createSupabaseAdminClient();
  const rows: T[] = [];
  let from = 0;

  while (true) {
    const to = from + pageSize - 1;
    const { data, error } = await admin.from(table).select(select).range(from, to);
    if (error) {
      throw error;
    }
    const batch = (data ?? []) as T[];
    rows.push(...batch);
    if (batch.length < pageSize) {
      break;
    }
    from += pageSize;
  }

  return rows;
}
