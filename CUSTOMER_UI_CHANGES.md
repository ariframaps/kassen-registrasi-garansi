# Customer UI Changes

Implements the frontend for Customer CRUD, Customer Category management, and bulk Excel import on top of the backend work in `CUSTOMER_BACKEND_CHANGES.md`.

## Modified

- `src/app/(protected)/dashboard/customers/page.tsx` — full rewrite:
  - **Category management** — a card at the top of the page lists customer categories as chips (name + customer count), each with inline edit/delete. "Tambah Kategori" opens `CategoryModal` (add/edit, name only). Deleting a category is safe (`customer.categoryId` is `ON DELETE SET NULL`) and the confirm dialog says so; on success the local customer list is patched so any customers pointing at the deleted category immediately show "—" instead of a stale badge.
  - **Customer table** — now shows `customId`, a category `Badge`, and null-safe `email`/`phone` (`—` when absent). Search matches name/customId/email/phone; a category `Select` filters the table. Row click still navigates to the customer detail page; a new actions column (edit/delete icons) stops propagation so it doesn't trigger navigation.
  - **Create / Edit Customer** — `CustomerModal` with `customId` (required, locked/disabled once a customer exists — the update API doesn't accept changing it), `name` (required), `categoryId` (`Select`, optional — "Tanpa kategori"), and optional `email`/`phone`/`address`.
  - **Delete Customer** — `ConfirmModal` warns that customers with purchase history can't be deleted (see backend note below).
  - **Bulk Excel Import** — "Import Excel" opens `ImportModal`: a drag-and-drop zone (client-side extension check for `.xlsx`/`.xls`/`.csv`), an "Import" action with a loading state, then an inline summary (total/created/updated/skipped stat tiles + a scrollable per-row error list) instead of closing the modal immediately, so the user can review failures before dismissing. Closing the modal triggers a re-fetch of both customers and categories (import can auto-create categories).

## New (backend, minimal — required for the "Delete Customer" UI to work)

The existing backend work only shipped `GET`/`POST /customers` and `PUT /customers/[id]`; there was no delete endpoint, so the UI's delete action had nothing to call. Added the missing piece, mirroring the existing `customer-category` delete pattern:

- `src/services/customer.service.ts` — `delete(id, audit)`: 404s if the customer doesn't exist, 409s ("Customer memiliki riwayat pembelian dan tidak dapat dihapus") if the customer has any purchase rows (the `purchase.customerId` FK has no cascade/set-null behavior, so this guard avoids surfacing a raw DB constraint error), otherwise deletes and writes a `CUSTOMER_DELETED` audit log entry.
- `src/app/api/v1/customers/[id]/route.ts` — added `DELETE`, `admin`/`sales` only, same error-handling shape as the existing `GET`/`PUT` handlers in this file.
- `src/lib/api/api-client.ts` — added `customerApi.delete(id)`.

## Verification

- `npx tsc --noEmit` — clean.
- `npx next build` — succeeds, `/dashboard/customers` and the customer API routes compile.
- `npx eslint` on the touched files — no new issues; the `react-hooks/set-state-in-effect` errors on the modals' `useLayoutEffect` reset pattern are pre-existing in this codebase (same pattern already flagged in `src/app/(protected)/dashboard/product-types/page.tsx`), not introduced by this change.
- Not done: interactive browser click-through. `DATABASE_URL` in `.env` points at a hosted Supabase Postgres instance, not a local DB, and the seeded admin credentials (`admin@company.com` / `Password123!`) don't exist there (`sign-in` returns "User not found"). Running the seed scripts against that database wasn't done since it isn't clearly a disposable dev DB. If you can share working credentials (or confirm it's safe to seed), I can drive the actual UI in a browser next.

## Out of Scope

- `src/app/(protected)/dashboard/customers/[id]/page.tsx` still uses the old `customerAdapter`/`CustomerDetail` mock-style types (unrelated pre-existing code, untouched here, and still compiles).
