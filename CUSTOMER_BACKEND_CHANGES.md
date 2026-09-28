  # Customer Backend Changes

  Follow-up to `_CUSTOMER_SCHEMA_CHANGES.md`: fixes the TypeScript breakage from the `customId`/nullable-`email` schema refactor, adds Customer Category CRUD, and adds bulk Excel import for customers.

  ## Part 1: Type & Schema Fixes

  - `src/types/index.ts` — `Customer.email` is now `string | null` to match the DB column.
  - `src/lib/adapters/customer.adapter.ts` — now compiles against nullable `email` (no logic change needed once the type was corrected).
  - `src/services/customer.service.ts`:
    - `createCustomerSchema` now requires `customId` (trimmed, 1–100 chars) and accepts optional `categoryId`. `email` is optional/nullable (empty string / omitted → `null`) instead of falling back to a synthetic `@system.local` address.
    - `create()` checks for a duplicate `customId` (409 Conflict) and only checks for a duplicate `email` when one is provided.
    - `updateCustomerSchema` mirrors the same nullable-email handling and accepts optional `categoryId` (only overwritten when explicitly present in the payload).
    - Added `generateAutoCustomId()` — produces an `AUTO-XXXXXXXX` code for flows that create a customer implicitly (no user-supplied `customId`).
    - Added `importFromExcel()` (see Part 3).
  - `src/services/dealer-customer.service.ts`, `src/services/dealer-purchase.service.ts` — response types updated to `email: string | null`.
  - `src/services/accurate.service.ts` — the two implicit customer-creation paths (Accurate import auto-create) now use `generateAutoCustomId()` and no longer synthesize a fake email; `email` is `null` when not supplied.
  - `src/app/api/v1/dealers/current/warranty-registrations/route.ts` — auto-created customer (when no existing customer matches the submitted email) now sets `customId: generateAutoCustomId()`.
  - `src/db/seeds/seed-customers.ts` — every seed row now sets `customId` (reusing the existing `cust_00N` value) so seeding still runs against the new required column.
  - `src/app/(protected)/dashboard/customers/page.tsx`, `src/app/(protected)/dashboard/purchases/page.tsx` — null-safe handling for `email` in search filters and the edit-customer form.

  `npx tsc --noEmit` passes with zero errors.

  ## Part 2: Customer Category Backend

  - `src/services/customer-category.service.ts` (new) — `getAll`, `add`, `update`, `delete`, mirroring the existing `product-category.service.ts` conventions (Zod DTOs, `HttpError`, audit logging on the `PURCHASE` audit category since there's no dedicated `CUSTOMER` enum value yet).
  - `src/app/api/v1/customer-categories/route.ts` (new) — `GET` (list) / `POST` (create), `admin`/`sales` only.
  - `src/app/api/v1/customer-categories/[id]/route.ts` (new) — `PUT` (rename) / `DELETE`, `admin`/`sales` only. Deleting a category is safe because `customer.categoryId` is `ON DELETE SET NULL`.
  - `src/lib/api/api-client.ts` — new `customerCategoryApi.{getAll,add,update,delete}`.

  ## Part 3: Bulk Customer Excel Import

  - `src/services/customer.service.ts#importFromExcel(buffer, audit)` — parses the workbook with `xlsx` (first sheet, header-based objects), matches columns case-insensitively:
    - `ID Pelanggan` / `Kode` → `customId`
    - `Nama` / `Nama Pelanggan` → `name`
    - `Kategori` → looked up by name (case-sensitive exact match) and auto-created if missing, then linked via `categoryId`; results are cached per import run to avoid duplicate category rows
    - `Email`, `No HP` / `Telepon`, `Alamat` → optional fields
    - Rows missing `customId` or `name` are recorded as an error and skipped, not thrown, so one bad row doesn't fail the whole import
    - Existing `customId` → row updates the existing customer; new `customId` → row inserts a new customer (upsert-by-customId, not skip)
    - Any unexpected per-row failure (e.g. duplicate email) is caught and recorded in `errors` instead of aborting the import
    - Returns `{ totalRows, created, updated, skipped, errors: [{ row, message }] }` and writes a single `CUSTOMER_IMPORTED` audit log entry with the summary counts
  - `src/app/api/v1/customers/import/route.ts` (new) — `POST`, `multipart/form-data` with a `file` field, validates the `.xlsx`/`.xls`/`.csv` extension, `admin`/`sales` only.
  - `src/lib/api/api-client.ts` — new `customerApi.import(file)`.

  ## Out of Scope / Follow-up

  - **Migration backfill:** `src/db/migrations/0008_chubby_mach_iv.sql` adds `customer.custom_id` as `NOT NULL` with no default. If this migration runs against a database that already has customer rows, it will fail until those rows are backfilled with a `custom_id` value (e.g. via `generateAutoCustomId()`-style codes) before the migration is applied. This was already flagged in `_CUSTOMER_SCHEMA_CHANGES.md` and is unchanged here.
  - **UI:** no frontend work was done for Customer Categories or Excel import (add-customer form, category picker/management screens, import dialog). Only the API client methods needed to build that UI were added. The existing "Add Customer" flow (`customerApi.add`) has no caller in the UI today — it now requires `customId`, so a UI update will need to add that field once a create-customer form exists.
