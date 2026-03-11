"use client";

import {
  createWhitelistedEmail,
  deleteWhitelistedEmail,
  getWhitelistedEmailsPage,
  updateWhitelistedEmail,
} from "@/app/admin/whitelisted-emails/actions";
import { FieldBlock, TextInput, formatAdminDate } from "@/components/admin/AdminManagementPrimitives";
import { SimpleCrudManagementClient } from "@/components/admin/SimpleCrudManagementClient";
import {
  type PaginatedResult,
  type WhitelistedEmailManagementRow,
  type WhitelistedEmailMutationInput,
  type WhitelistedEmailsFilterState,
} from "@/lib/admin/management-types";

export function WhitelistedEmailsManagementClient({
  initialData,
  initialFilters,
}: {
  initialData: PaginatedResult<WhitelistedEmailManagementRow>;
  initialFilters: WhitelistedEmailsFilterState;
}) {
  return (
    <SimpleCrudManagementClient<
      WhitelistedEmailManagementRow,
      WhitelistedEmailsFilterState,
      WhitelistedEmailMutationInput
    >
      initialData={initialData}
      initialFilters={initialFilters}
      loadRecords={getWhitelistedEmailsPage}
      createRecord={createWhitelistedEmail}
      updateRecord={updateWhitelistedEmail}
      deleteRecord={deleteWhitelistedEmail}
      createEmptyDraft={() => ({ email_address: "" })}
      buildDraft={(row) => ({ id: row.id, email_address: row.email_address })}
      searchPlaceholder="Search email address..."
      emptyMessage="No whitelisted emails matched your current search."
      addLabel="Add email"
      entityLabel="whitelisted email"
      columnHeaders={
        <div className="grid grid-cols-[minmax(0,1fr)_180px_180px] items-center gap-4 px-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          <span>Email Address</span>
          <span>Created</span>
          <span>Modified</span>
        </div>
      }
      renderRow={(row) => (
        <div className="grid grid-cols-[minmax(0,1fr)_180px_180px] items-center gap-4">
          <p className="truncate text-sm font-medium text-slate-900">{row.email_address}</p>
          <p className="text-sm text-slate-500">{formatAdminDate(row.created_datetime_utc)}</p>
          <p className="text-sm text-slate-500">{formatAdminDate(row.modified_datetime_utc)}</p>
        </div>
      )}
      renderForm={(draft, setDraft) => (
        <FieldBlock label="Email address">
          <TextInput
            value={draft.email_address}
            onChange={(value) => setDraft((current) => ({ ...current, email_address: value }))}
          />
        </FieldBlock>
      )}
    />
  );
}
