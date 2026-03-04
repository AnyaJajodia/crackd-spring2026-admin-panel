"use client";

import * as React from "react";

import {
  AdminManagementLayout,
  BooleanBadge,
  FilterChipGroup,
  ManagementTableState,
} from "@/components/admin/AdminManagementLayout";
import { useDebouncedValue } from "@/components/admin/useDebouncedValue";
import { getProfilesPage } from "@/app/admin/profiles/actions";
import {
  type PaginatedResult,
  type ProfileManagementRow,
  type ProfilesFilterState,
} from "@/lib/admin/management-types";

type ProfilesManagementClientProps = {
  initialData: PaginatedResult<ProfileManagementRow>;
  initialFilters: ProfilesFilterState;
};

function formatCreated(value: string | null) {
  if (!value) return "--";

  return new Date(value).toLocaleDateString();
}

function truncateId(id: string) {
  return `${id.slice(0, 8)}...`;
}

export function ProfilesManagementClient({
  initialData,
  initialFilters,
}: ProfilesManagementClientProps) {
  const [filters, setFilters] = React.useState(initialFilters);
  const [searchInput, setSearchInput] = React.useState(initialFilters.search);
  const [data, setData] = React.useState(initialData);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(searchInput, 250);

  const loadRecords = React.useCallback(async (nextFilters: ProfilesFilterState) => {
    setLoading(true);
    setError(null);

    try {
      const nextData = await getProfilesPage(nextFilters);
      setData(nextData);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load profiles.");
    } finally {
      setLoading(false);
    }
  }, []);

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
    void loadRecords(filters);
  }, [filters, loadRecords]);

  const updateFilters = (updater: (current: ProfilesFilterState) => ProfilesFilterState) => {
    React.startTransition(() => setFilters((current) => updater(current)));
  };

  return (
    <AdminManagementLayout
      searchPlaceholder="Search name or email..."
      searchValue={searchInput}
      onSearchChange={setSearchInput}
      controls={
        <FilterChipGroup
          label="Role"
          value={filters.role}
          onChange={(value) => updateFilters((current) => ({ ...current, role: value, page: 1 }))}
          options={[
            { label: "All", value: "all" },
            { label: "Superadmins", value: "superadmins" },
            { label: "Matrix admins", value: "matrix_admins" },
            { label: "In study", value: "in_study" },
          ]}
        />
      }
      columnHeaders={
        <div className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,1.3fr)_auto_auto_auto] items-center gap-4 px-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          <span>ID</span>
          <span>Created</span>
          <span>First</span>
          <span>Last</span>
          <span>Email</span>
          <span>Superadmin</span>
          <span>In study</span>
          <span>Matrix</span>
        </div>
      }
      page={data.page}
      totalPages={data.totalPages}
      totalCount={data.totalCount}
      pageSize={filters.pageSize}
      onPrevPage={() => updateFilters((current) => ({ ...current, page: Math.max(1, current.page - 1) }))}
      onNextPage={() =>
        updateFilters((current) => ({ ...current, page: Math.min(data.totalPages, current.page + 1) }))
      }
      onPageSizeChange={(value) => updateFilters((current) => ({ ...current, pageSize: value, page: 1 }))}
    >
      <ManagementTableState
        loading={loading}
        error={error}
        isEmpty={data.rows.length === 0}
        emptyMessage="No profiles matched your current filters."
      >
        {data.rows.map((row) => {
          const firstName = row.first_name?.trim() ? row.first_name : "John";
          const lastName = row.last_name?.trim() ? row.last_name : "Doe";

          return (
            <div
              key={row.id}
              className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,1.3fr)_auto_auto_auto] items-center gap-4 rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-[0_12px_24px_rgba(15,23,42,0.06)]"
            >
              <span className="truncate text-sm font-medium text-slate-900" title={row.id}>
                {truncateId(row.id)}
              </span>
              <span className="truncate text-sm text-slate-700">
                {formatCreated(row.created_datetime_utc)}
              </span>
              <span className="truncate text-sm text-slate-900" title={firstName}>
                {firstName}
              </span>
              <span className="truncate text-sm text-slate-900" title={lastName}>
                {lastName}
              </span>
              <span className="truncate text-sm text-slate-900" title={row.email ?? "No email"}>
                {row.email ?? "No email"}
              </span>
              <BooleanBadge
                value={row.is_superadmin}
                trueLabel="Superadmin"
                falseLabel="Standard"
              />
              <BooleanBadge value={row.is_in_study} trueLabel="In Study" falseLabel="Out" />
              <BooleanBadge
                value={row.is_matrix_admin}
                trueLabel="Matrix Admin"
                falseLabel="Standard"
              />
            </div>
          );
        })}
      </ManagementTableState>
    </AdminManagementLayout>
  );
}
