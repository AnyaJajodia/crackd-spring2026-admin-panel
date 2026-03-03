"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Loader2, Pencil, Save, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  AdminManagementLayout,
  BooleanBadge,
  FilterChipGroup,
  ManagementTableState,
} from "@/components/admin/AdminManagementLayout";
import { useDebouncedValue } from "@/components/admin/useDebouncedValue";
import { Button } from "@/components/ui/button";
import { getProfilesPage, updateProfileRow } from "@/app/admin/profiles/actions";
import {
  type PaginatedResult,
  type ProfileManagementRow,
  type ProfilesFilterState,
  type ProfileUpdateChanges,
} from "@/lib/admin/management-types";

type ProfilesManagementClientProps = {
  initialData: PaginatedResult<ProfileManagementRow>;
  initialFilters: ProfilesFilterState;
};

type ProfileDraft = {
  first_name: string;
  last_name: string;
  is_superadmin: boolean;
  is_in_study: boolean;
  is_matrix_admin: boolean;
};

type DirtyFields = Partial<Record<keyof ProfileDraft, boolean>>;

function createDraft(row: ProfileManagementRow): ProfileDraft {
  return {
    first_name: row.first_name ?? "John",
    last_name: row.last_name ?? "Doe",
    is_superadmin: Boolean(row.is_superadmin),
    is_in_study: Boolean(row.is_in_study),
    is_matrix_admin: Boolean(row.is_matrix_admin),
  };
}

function BooleanSelect(props: {
  value: boolean;
  trueLabel: string;
  falseLabel: string;
  onChange: (value: boolean) => void;
}) {
  const { value, trueLabel, falseLabel, onChange } = props;

  return (
    <select
      value={value ? "true" : "false"}
      onChange={(event) => onChange(event.target.value === "true")}
      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-400"
    >
      <option value="true">{trueLabel}</option>
      <option value="false">{falseLabel}</option>
    </select>
  );
}

export function ProfilesManagementClient({
  initialData,
  initialFilters,
}: ProfilesManagementClientProps) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [filters, setFilters] = React.useState(initialFilters);
  const [searchInput, setSearchInput] = React.useState(initialFilters.search);
  const [data, setData] = React.useState(initialData);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<ProfileDraft | null>(null);
  const [dirty, setDirty] = React.useState<DirtyFields>({});
  const [savingId, setSavingId] = React.useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(searchInput, 250);

  const loadRecords = React.useCallback(
    async (nextFilters: ProfilesFilterState) => {
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
    },
    []
  );

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

  const startEditing = (row: ProfileManagementRow) => {
    setEditingId(row.id);
    setDraft(createDraft(row));
    setDirty({});
  };

  const handleSave = async (row: ProfileManagementRow) => {
    if (!draft) return;

    const changes: ProfileUpdateChanges = {};
    if (dirty.first_name || row.first_name == null) changes.first_name = draft.first_name;
    if (dirty.last_name || row.last_name == null) changes.last_name = draft.last_name;
    if (dirty.is_superadmin) changes.is_superadmin = draft.is_superadmin;
    if (dirty.is_in_study) changes.is_in_study = draft.is_in_study;
    if (dirty.is_matrix_admin) changes.is_matrix_admin = draft.is_matrix_admin;

    const previousRows = data.rows;
    setSavingId(row.id);
    setData((current) => ({
      ...current,
      rows: current.rows.map((item) =>
        item.id === row.id
          ? {
              ...item,
              ...(dirty.first_name ? { first_name: draft.first_name || null } : {}),
              ...(dirty.last_name ? { last_name: draft.last_name || null } : {}),
              ...(dirty.is_superadmin ? { is_superadmin: draft.is_superadmin } : {}),
              ...(dirty.is_in_study ? { is_in_study: draft.is_in_study } : {}),
              ...(dirty.is_matrix_admin ? { is_matrix_admin: draft.is_matrix_admin } : {}),
            }
          : item
      ),
    }));

    try {
      const updated = await updateProfileRow({ id: row.id, changes });
      setData((current) => ({
        ...current,
        rows: current.rows.map((item) => (item.id === updated.id ? updated : item)),
      }));
      setEditingId(null);
      setDraft(null);
      setDirty({});
      toast.success("Saved");
      const refreshed = await getProfilesPage(filters);
      setData(refreshed);
      router.refresh();
    } catch (saveError) {
      setData((current) => ({ ...current, rows: previousRows }));
      toast.error(saveError instanceof Error ? saveError.message : "Failed to save profile.");
    } finally {
      setSavingId(null);
    }
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
        <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,1.4fr)_auto_auto_auto_auto] items-center gap-4 px-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          <span>First</span>
          <span>Last</span>
          <span>Email</span>
          <span>Superadmin</span>
          <span>In study</span>
          <span>Matrix</span>
          <span className="text-right">Edit</span>
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
          const isEditing = editingId === row.id && draft;
          const displayFirstName = row.first_name ?? "John";
          const displayLastName = row.last_name ?? "Doe";

          return (
            <div
              key={row.id}
              className="rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-[0_12px_24px_rgba(15,23,42,0.06)]"
            >
              <AnimatePresence mode="wait" initial={false}>
                {isEditing ? (
                  <motion.div
                    key="editing"
                    initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                    animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                    exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                    transition={{ duration: reduceMotion ? 0.12 : 0.2 }}
                    className="grid gap-4"
                  >
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,1.6fr)]">
                      <InlineField label="First name">
                        <input
                          value={draft.first_name}
                          placeholder="John"
                          onChange={(event) => {
                            setDraft((current) => (current ? { ...current, first_name: event.target.value } : current));
                            setDirty((current) => ({ ...current, first_name: true }));
                          }}
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-400"
                        />
                      </InlineField>
                      <InlineField label="Last name">
                        <input
                          value={draft.last_name}
                          placeholder="Doe"
                          onChange={(event) => {
                            setDraft((current) => (current ? { ...current, last_name: event.target.value } : current));
                            setDirty((current) => ({ ...current, last_name: true }));
                          }}
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-400"
                        />
                      </InlineField>
                      <InlineField label="Email">
                        <div
                          className="truncate rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                          title={row.email ?? "No email"}
                        >
                          {row.email ?? "No email"}
                        </div>
                      </InlineField>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-3">
                      <InlineField label="Superadmin">
                        <BooleanSelect
                          value={draft.is_superadmin}
                          trueLabel="Superadmin"
                          falseLabel="Not superadmin"
                          onChange={(value) => {
                            setDraft((current) => (current ? { ...current, is_superadmin: value } : current));
                            setDirty((current) => ({ ...current, is_superadmin: true }));
                          }}
                        />
                      </InlineField>
                      <InlineField label="In study">
                        <BooleanSelect
                          value={draft.is_in_study}
                          trueLabel="In study"
                          falseLabel="Not in study"
                          onChange={(value) => {
                            setDraft((current) => (current ? { ...current, is_in_study: value } : current));
                            setDirty((current) => ({ ...current, is_in_study: true }));
                          }}
                        />
                      </InlineField>
                      <InlineField label="Matrix admin">
                        <BooleanSelect
                          value={draft.is_matrix_admin}
                          trueLabel="Matrix admin"
                          falseLabel="Not matrix admin"
                          onChange={(value) => {
                            setDraft((current) => (current ? { ...current, is_matrix_admin: value } : current));
                            setDirty((current) => ({ ...current, is_matrix_admin: true }));
                          }}
                        />
                      </InlineField>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingId(null);
                          setDraft(null);
                          setDirty({});
                        }}
                        className="rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => void handleSave(row)}
                        disabled={savingId === row.id}
                        className="rounded-full bg-red-500 text-white hover:bg-red-400"
                      >
                        {savingId === row.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        Confirm
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="viewing"
                    initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                    animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                    exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                    transition={{ duration: reduceMotion ? 0.12 : 0.2 }}
                    className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,1.4fr)_auto_auto_auto_auto] items-center gap-4"
                  >
                    <ReadOnlyCell label="First name" value={displayFirstName} />
                    <ReadOnlyCell label="Last name" value={displayLastName} />
                    <ReadOnlyCell label="Email" value={row.email ?? "No email"} />
                    <BadgeCell label="Superadmin">
                      <BooleanBadge value={row.is_superadmin} trueLabel="Superadmin" falseLabel="Standard" />
                    </BadgeCell>
                    <BadgeCell label="In study">
                      <BooleanBadge value={row.is_in_study} trueLabel="In study" falseLabel="Out" />
                    </BadgeCell>
                    <BadgeCell label="Matrix admin">
                      <BooleanBadge value={row.is_matrix_admin} trueLabel="Matrix" falseLabel="Standard" />
                    </BadgeCell>
                    <Button
                      size="sm"
                      onClick={() => startEditing(row)}
                      className="justify-self-end rounded-full bg-red-500 text-white hover:bg-red-400"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </ManagementTableState>
    </AdminManagementLayout>
  );
}

function InlineField(props: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[11px] uppercase tracking-[0.22em] text-slate-500">{props.label}</p>
      {props.children}
    </div>
  );
}

function ReadOnlyCell(props: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1 text-[11px] uppercase tracking-[0.22em] text-slate-500">{props.label}</p>
      <p className="truncate text-sm text-slate-900" title={props.value}>
        {props.value}
      </p>
    </div>
  );
}

function BadgeCell(props: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[11px] uppercase tracking-[0.22em] text-slate-500">{props.label}</p>
      {props.children}
    </div>
  );
}
