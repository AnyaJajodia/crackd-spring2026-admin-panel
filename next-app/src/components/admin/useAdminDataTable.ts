"use client";

import * as React from "react";

import { useDebouncedValue } from "@/components/admin/useDebouncedValue";
import { type PaginatedResult, type PaginationQuery } from "@/lib/admin/management-types";

type UseAdminDataTableParams<TFilters extends PaginationQuery, TRow> = {
  initialData: PaginatedResult<TRow>;
  initialFilters: TFilters;
  loadRecords: (filters: TFilters) => Promise<PaginatedResult<TRow>>;
};

export function useAdminDataTable<TFilters extends PaginationQuery, TRow>({
  initialData,
  initialFilters,
  loadRecords,
}: UseAdminDataTableParams<TFilters, TRow>) {
  const [filters, setFilters] = React.useState(initialFilters);
  const [searchInput, setSearchInput] = React.useState(initialFilters.search);
  const [data, setData] = React.useState(initialData);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(searchInput, 250);

  React.useEffect(() => {
    setData(initialData);
  }, [initialData]);

  React.useEffect(() => {
    setFilters((current) =>
      current.search === debouncedSearch
        ? current
        : {
            ...current,
            search: debouncedSearch,
            page: 1,
          }
    );
  }, [debouncedSearch]);

  React.useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError(null);

      try {
        const nextData = await loadRecords(filters);
        if (!cancelled) {
          setData(nextData);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load records.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [filters, loadRecords]);

  const updateFilters = React.useCallback((updater: (current: TFilters) => TFilters) => {
    React.startTransition(() => setFilters((current) => updater(current)));
  }, []);

  return {
    filters,
    searchInput,
    setSearchInput,
    data,
    setData,
    loading,
    error,
    updateFilters,
  };
}
