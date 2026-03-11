"use client";

import {
  createAllowedSignupDomain,
  deleteAllowedSignupDomain,
  getAllowedSignupDomainsPage,
  updateAllowedSignupDomain,
} from "@/app/admin/allowed-signup-domains/actions";
import { FieldBlock, TextInput, formatAdminDate } from "@/components/admin/AdminManagementPrimitives";
import { SimpleCrudManagementClient } from "@/components/admin/SimpleCrudManagementClient";
import {
  type AllowedSignupDomainManagementRow,
  type AllowedSignupDomainMutationInput,
  type AllowedSignupDomainsFilterState,
  type PaginatedResult,
} from "@/lib/admin/management-types";

export function AllowedSignupDomainsManagementClient({
  initialData,
  initialFilters,
}: {
  initialData: PaginatedResult<AllowedSignupDomainManagementRow>;
  initialFilters: AllowedSignupDomainsFilterState;
}) {
  return (
    <SimpleCrudManagementClient<
      AllowedSignupDomainManagementRow,
      AllowedSignupDomainsFilterState,
      AllowedSignupDomainMutationInput
    >
      initialData={initialData}
      initialFilters={initialFilters}
      loadRecords={getAllowedSignupDomainsPage}
      createRecord={createAllowedSignupDomain}
      updateRecord={updateAllowedSignupDomain}
      deleteRecord={deleteAllowedSignupDomain}
      createEmptyDraft={() => ({ apex_domain: "" })}
      buildDraft={(row) => ({ id: row.id, apex_domain: row.apex_domain })}
      searchPlaceholder="Search apex domain..."
      emptyMessage="No allowed signup domains matched your current search."
      addLabel="Add domain"
      entityLabel="domain"
      columnHeaders={
        <div className="grid grid-cols-[minmax(0,1fr)_180px] items-center gap-4 px-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          <span>Apex Domain</span>
          <span>Created</span>
        </div>
      }
      renderRow={(row) => (
        <div className="grid grid-cols-[minmax(0,1fr)_180px] items-center gap-4">
          <p className="truncate text-sm font-medium text-slate-900">{row.apex_domain}</p>
          <p className="text-sm text-slate-500">{formatAdminDate(row.created_datetime_utc)}</p>
        </div>
      )}
      renderForm={(draft, setDraft) => (
        <FieldBlock label="Apex domain">
          <TextInput
            value={draft.apex_domain}
            onChange={(value) => setDraft((current) => ({ ...current, apex_domain: value }))}
          />
        </FieldBlock>
      )}
    />
  );
}
