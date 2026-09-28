# Dealer → Customer Backend Refactor

Follow-up to `DEALER_SCHEMA_CONSOLIDATION.md`: updates backend services, API
routes, and auth-adjacent helpers so the app runs against the `customer`
table now that the standalone `dealer` table is dropped.

## Core convention

A **dealer** is a `customer` row with `userId` set (a customer that has been
granted a dashboard login). This is used consistently wherever the old code
did `db.query.dealers.findFirst(...)`:

```ts
db.query.customer.findFirst({ where: eq(customer.userId, someUserId) })
```

Admin listing/validation queries that used to look up `dealers.name` now use
`and(eq(customer.name, name), isNotNull(customer.userId))`.

`customer` has no `status` column, so a dealer's active/inactive state is now
derived entirely from the linked `user.status` (previously `dealers.status`
was a separate column kept in sync with `user.status` via 4 different call
sites in `user.service.ts` — that sync code is now deleted as dead code).

## Important correction to the schema-consolidation doc

`DEALER_SCHEMA_CONSOLIDATION.md` states `purchase.dealerId` was "redundant"
with `purchase.customerId` because dealers are now customers. **This isn't
accurate for how the app actually used these columns**: `purchase.customerId`
was always the *end customer* who bought the product; `purchase.dealerId`
(when set) recorded a *different* party — the dealer who facilitated the
sale. They were never the same row. That FK is genuinely gone now with no
replacement column.

Two different code paths populated it, with different implications:

1. **Dealer self-service** (`/api/v1/dealers/current/warranty-registrations`):
   the dealer registers a purchase for one of their end customers.
   `registeredBy` is already the dealer's own `user.id`, so the dealer's
   identity is still fully recoverable: `customer.userId = purchase.registeredBy`.
   This refactor uses that join everywhere dealer attribution is needed
   (`dealer-purchase.service.ts`, `dealer-customer.service.ts`,
   `customer.service.ts`, `purchase.service.ts`).
2. **Admin/sales manual upload** (`accurate.service.ts`'s `submitAccurateFile`,
   via the upload page's purchase form): an admin can *optionally* tag which
   dealer facilitated an end-customer's purchase (`purchaseData.dealerId`).
   Here `registeredBy` is the admin/sales user, not the dealer, so the dealer
   identity is **not** recoverable via that join — the column that stored it
   is simply gone. As a best-effort, non-lossy fallback, this refactor now
   prepends a human-readable note ("Dijual melalui dealer: {name}") to
   `purchase.notes` when this field is provided, so the information isn't
   silently discarded. It is no longer structured/queryable. If this needs to
   be a first-class filterable field again, it requires a new migration
   (e.g. reintroducing a nullable `purchase.dealer_customer_id` FK) — out of
   scope for this app-code-only pass.

## Service-by-service changes

- **`dealer.service.ts`** — rewritten to CRUD `customer` (+ `user`) instead of
  `dealers`. Returns the existing `Dealer` shape from `src/types/index.ts`.
  `customId` for dealers is auto-generated via `generateAutoCustomId()`
  (`customer.service.ts`), matching the same convention used for
  auto-created end customers.
- **`dealer-customer.service.ts`, `dealer-purchase.service.ts`** — dealer
  lookup via `customer.userId`; purchases now filtered by
  `purchase.registeredBy = userId` instead of `purchase.dealerId = dealer.id`
  (see correction above). External response shape (`dealerId` field) is
  unchanged.
- **`dealer-product.service.ts`** — straight swap: `product.dealerId` →
  `product.customerId` (this one *is* a 1:1 rename per the schema — a
  product's `customerId` while unsold represents the dealer holding the
  stock).
- **`customer.service.ts`** — added `resolveDealersByRegisteredBy()`, a
  batched helper (single extra query, no N+1) that reconstructs "which
  dealer processed this purchase" via `registeredBy → customer.userId` for
  `getPurchaseHistory` and `getCustomerDetail`. Only resolves for
  dealer-self-registered purchases (see limitation above).
- **`purchase.service.ts`** — same batched dealer-reconstruction applied to
  `getAllWithNested` and `updatePurchase`, so the admin purchase list keeps
  showing a `dealer` object where derivable.
- **`product.service.ts`, `warranty.service.ts`** — relation key `dealer` →
  `customer` (the Drizzle relation itself was renamed in the schema).
- **`waiting-list.service.ts`, `notification.service.ts`** — internal
  `db.query.dealers` / `waitingList.dealerId` swapped for
  `db.query.customer` / `waitingList.customerId`. Function parameter names
  (e.g. `dealerId` in `createDealerRequestNotification`) were intentionally
  **kept as-is** — they're just JS parameter names, not DB columns, and
  renaming them would have forced changes in every caller for no benefit.
- **`user.service.ts`** — dealer creation now inserts a `customer` row
  (with `userId` + auto `customId`) instead of a `dealers` row. All the
  `dealers.status` sync blocks in `update`/`delete`/`toggleStatus` were
  deleted (no longer meaningful — `user.status` is the only status now).
  The `changeEmail` dealer-email sync now updates `customer.email`.
- **`accurate.service.ts`** — `dealers` → `customer`; `destinationDealerId`
  removed (schema dropped it), `destinationCustomerId` now covers both
  dealer and customer destinations; `product.dealerId` → `product.customerId`;
  `purchase.dealerId` removed with the notes-based fallback described above.

## Auth / login-redirect

`src/lib/auth.ts`, `src/lib/get-login-redirect.ts`, and
`src/lib/api/auth.middleware.ts` were checked and required **no changes** —
role-based auth/redirect logic (`role === "dealer"` on `user.role`) never
queried the `dealer` table.

## API routes updated

`src/app/api/v1/dealers/validate`, `dealers/current/notifications`,
`dealers/current/request-products`, `dealers/current/waiting-lists`,
`dealers/current/warranty-registrations` — these directly queried
`db.query.dealers` and were updated to query `customer`. The other
`dealers/**`, `customers/[id]`, and `waiting-lists/**` routes only call into
the services above and needed no direct changes.

## Verified

`npx tsc --noEmit` — zero errors in every service, API route, and auth
helper touched by this refactor. Remaining errors are all in files
explicitly out of scope for this pass (confirmed to be pre-existing
consequences of the schema drop, not introduced here):

- **Pages/components** (`src/app/(protected)/dashboard/**`,
  `support/products/page.tsx`, `components/ui/reassign-modal.tsx`) — expect
  the old `dealer`/`dealerId` shape from product/purchase API responses.
- **`src/lib/api/api-client.ts`, `src/lib/adapters/customer.adapter.ts`** —
  frontend data layer, imports the now-removed `DealerSchema` type.
- **`src/db/seeds/**`** — `seed-dealers.ts` and everything that FKs to it
  still reference the dropped table/columns.

These match the doc's own "Follow-up work required" list (Pages, UI,
Seeds/mocks) and were intentionally left for a separate frontend/seeds pass.
