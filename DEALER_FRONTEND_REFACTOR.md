# Dealer → Customer Frontend & Seed Refactor

Follow-up to `DEALER_SCHEMA_CONSOLIDATION.md` and `DEALER_BACKEND_REFACTOR.md`:
updates the remaining frontend pages/components, the API client, and the seed
scripts so the whole app compiles and builds against the `customer` table now
that the standalone `dealer` table is dropped.

## Scope

Everything the backend-refactor doc listed as "explicitly out of scope for
this pass":

- `src/lib/api/api-client.ts` — imported the now-removed `DealerSchema` type.
- Pages/components expecting the old `dealer`/`dealerId` shape on product and
  purchase API responses: `dashboard/dealers`, `dashboard/products`,
  `dashboard/purchases`, `dashboard/upload`, `support/products`,
  `components/ui/reassign-modal.tsx`.
- `src/db/seeds/**` — `seed-dealers.ts` and everything that FKs to it.

## Frontend changes

- **`api-client.ts`** — `dealerApi.getAll/add/update/toggleStatus` now type
  their responses as `Dealer` (`@/types`) instead of the removed
  `DealerSchema` (`@/db/schema`). This matches what `dealerService` actually
  returns (see `dealer.service.ts`'s `toDealer()` mapper) — a hand-shaped
  `Dealer`, not a raw `customer` row.
- **`dashboard/dealers/page.tsx`, `dashboard/upload/page.tsx`** — same
  `DealerSchema` → `Dealer` swap. Also fixed `d.createdAt` → `d.created_at`
  since `Dealer` uses a snake_case ISO string, not a `Date`.
- **`dashboard/products/page.tsx`, `support/products/page.tsx`,
  `reassign-modal.tsx`** — `product.dealerId` → `product.customerId`,
  `product.dealer` → `product.customer` (the Drizzle relation on `product`
  was renamed in the schema; the dealer-holding-stock semantics are
  unchanged, only the column/relation name changed).
- **`dashboard/purchases/page.tsx`** — `purchase` rows no longer have a
  `dealerId` column at all (dropped with no replacement — see the backend
  doc's correction). The nested `PurchaseWithNestedSchema` instead carries a
  reconstructed `dealer: Customer | null` object (via
  `resolveDealersByRegisteredBy`). All `g.dealerId` reads became
  `g.dealer?.id`.

## Seed script changes

- **`seed-dealers.ts`** — rewritten to insert directly into `customer`
  (`userId`, `customId` = the dealer's fixed seed id, no `status` column —
  status is derived from the linked `user.status`, already set correctly in
  `seed-users.ts`). `DEALER_IDS` keeps the same values; they now identify
  `customer` rows instead of `dealer` rows, so every dependent seed file
  continues to resolve.
- **`seed-delivery-orders.ts`** — `destinationDealerId` / `destinationCustomerId`
  pair collapsed into the single `destinationCustomerId` column per the
  schema change (both dealer- and customer-bound rows now just set this one
  field).
- **`seed-products.ts`** — `dealerId` insert key renamed to `customerId`
  (kept the local variable named `dealerId` — it's just a JS name describing
  "the dealer holding this stock", not a DB column).
- **`seed-purchases.ts`** — `purchase.dealerId` is gone with no replacement
  column. For the 15 dealer-sourced seed purchases, `registeredBy` is now set
  to the corresponding dealer's own `user.id` (mirroring the real dealer
  self-service flow: `customer.userId = purchase.registeredBy`), instead of
  a random sales/admin id. This keeps dealer attribution reconstructable via
  `resolveDealersByRegisteredBy` for seeded data, matching production
  behavior. Direct-sales purchases are unaffected.
- **`seed-waiting-list.ts`** — `dealerId` insert key renamed to `customerId`
  (straight 1:1 rename per the schema).

## Verified

- `npx tsc --noEmit` — zero errors across the entire project.
- `npm run build` — compiles and generates all routes successfully.

Pre-existing `npm run lint` warnings/errors (unused vars, `react-hooks/*`
rules on `setState`-in-`useEffect` patterns across many unrelated dashboard
pages) were not introduced by this pass and are out of scope.
