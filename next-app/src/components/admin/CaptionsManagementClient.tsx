"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";

import {
  AdminManagementLayout,
  BooleanBadge,
  FilterChipGroup,
  ManagementTableState,
  ThumbnailSquare,
} from "@/components/admin/AdminManagementLayout";
import { useDebouncedValue } from "@/components/admin/useDebouncedValue";
import { getCaptionsPage } from "@/app/admin/captions/actions";
import {
  type CaptionManagementRow,
  type CaptionsFilterState,
  type PaginatedResult,
} from "@/lib/admin/management-types";
import { cn } from "@/lib/utils";

type CaptionsManagementClientProps = {
  initialData: PaginatedResult<CaptionManagementRow>;
  initialFilters: CaptionsFilterState;
};

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <p className="mb-2 text-[11px] uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="break-all text-sm text-slate-800">{value}</p>
    </div>
  );
}

export function CaptionsManagementClient({
  initialData,
  initialFilters,
}: CaptionsManagementClientProps) {
  const reduceMotion = useReducedMotion();
  const [filters, setFilters] = React.useState(initialFilters);
  const [searchInput, setSearchInput] = React.useState(initialFilters.search);
  const [data, setData] = React.useState(initialData);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(searchInput, 250);

  const loadRecords = React.useCallback(async (nextFilters: CaptionsFilterState) => {
    setLoading(true);
    setError(null);

    try {
      const nextData = await getCaptionsPage(nextFilters);
      setData(nextData);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load captions.");
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

  const updateFilters = (updater: (current: CaptionsFilterState) => CaptionsFilterState) => {
    React.startTransition(() => setFilters((current) => updater(current)));
  };

  return (
    <AdminManagementLayout
      searchPlaceholder="Search caption text..."
      searchValue={searchInput}
      onSearchChange={setSearchInput}
      controls={
        <>
          <FilterChipGroup
            label="Visibility"
            value={filters.visibility}
            onChange={(value) => updateFilters((current) => ({ ...current, visibility: value, page: 1 }))}
            options={[
              { label: "All", value: "all" },
              { label: "Public", value: "public" },
              { label: "Private", value: "private" },
            ]}
          />
          <FilterChipGroup
            label="Featured"
            value={filters.featured}
            onChange={(value) => updateFilters((current) => ({ ...current, featured: value, page: 1 }))}
            options={[
              { label: "All", value: "all" },
              { label: "Featured", value: "featured" },
              { label: "Not featured", value: "not_featured" },
            ]}
          />
          <FilterChipGroup
            label="Sort"
            value={filters.sort}
            onChange={(value) => updateFilters((current) => ({ ...current, sort: value, page: 1 }))}
            options={[
              { label: "Newest", value: "newest" },
              { label: "Likes", value: "likes" },
            ]}
          />
        </>
      }
      columnHeaders={
        <div className="grid grid-cols-[72px_minmax(0,1fr)_auto_auto_auto_32px] items-center gap-4 px-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          <span>Image</span>
          <span>Caption</span>
          <span>Featured</span>
          <span>Visibility</span>
          <span>Likes</span>
          <span className="text-right">Open</span>
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
        emptyMessage="No captions matched your current filters."
      >
        {data.rows.map((row) => {
          const isExpanded = expandedId === row.id;

          return (
            <div
              key={row.id}
              className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_12px_24px_rgba(15,23,42,0.06)]"
            >
              <button
                type="button"
                onClick={() =>
                  setExpandedId((current) => (current === row.id ? null : row.id))
                }
                className="grid w-full grid-cols-[72px_minmax(0,1fr)_auto_auto_auto_32px] items-center gap-4 px-4 py-3 text-left transition hover:bg-slate-50"
              >
                <div className="flex h-14 w-[72px] items-center">
                  <ThumbnailSquare
                    src={row.image_url}
                    alt={row.content ?? "Caption image"}
                    className="h-16 w-16"
                  />
                </div>
                <p className="overflow-hidden text-sm font-medium text-slate-900 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                  {row.content ?? "No caption text."}
                </p>
                <div className="justify-self-start">
                  <BooleanBadge value={row.is_featured} trueLabel="Featured" falseLabel="Not featured" />
                </div>
                <div className="justify-self-start">
                  <BooleanBadge value={row.is_public} trueLabel="Public" falseLabel="Private" />
                </div>
                <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-sm font-medium text-red-700">
                  {row.like_count ?? 0}
                </span>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 shrink-0 justify-self-end text-slate-500 transition",
                    isExpanded && "rotate-180"
                  )}
                />
              </button>

              <AnimatePresence initial={false}>
                {isExpanded ? (
                  <motion.div
                    initial={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                    animate={reduceMotion ? { opacity: 1 } : { height: "auto", opacity: 1 }}
                    exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                    transition={{ duration: reduceMotion ? 0.12 : 0.24 }}
                    className="overflow-hidden border-t border-slate-200"
                  >
                    <div className="grid gap-4 px-5 py-5 lg:grid-cols-2 xl:grid-cols-3">
                      <InfoCard label="Caption ID" value={row.id} />
                      <InfoCard label="Image ID" value={row.image_id ?? "--"} />
                      <InfoCard
                        label="Humor Flavor"
                        value={row.humor_flavor_slug ?? "Unknown flavor"}
                      />
                      <InfoCard
                        label="Featured"
                        value={row.is_featured ? "Featured" : "Not featured"}
                      />
                      <InfoCard label="Like Count" value={String(row.like_count ?? 0)} />
                      <InfoCard
                        label="LLM Prompt Chain"
                        value={row.llm_prompt_chain_label ?? "No prompt chain"}
                      />
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          );
        })}
      </ManagementTableState>
    </AdminManagementLayout>
  );
}
