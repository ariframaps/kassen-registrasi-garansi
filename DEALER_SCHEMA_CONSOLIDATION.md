# Dealer → Customer Schema Consolidation

## Summary

The standalone `dealer` table has been dropped. Dealers are now represented as
rows in `customer`, distinguished by their `categoryId` (e.g. a "Dealer"
`customer_category`) rather than by a separate table. Dashboard access for a
dealer is granted by linking their `user.id` via the new, nullable
`customer.userId` column.

This change is **schema-only**. It updates the Drizzle schema files and
generates the corresponding migration. It does **not** touch application code
(API routes, services, pages) that still reference the old `dealer` table —
see "Follow-up work required" below. The app will not build/run correctly
until that follow-up pass is done.

## Schema changes

### `customer` (`src/db/schemas/customer.schema.ts`)
- Added `userId: text("user_id").references(() => user.id).unique()` —
  nullable. Set when a dealer/customer is granted dashboard login access.
- Added relations: `user: one(user, ...)`, `products: many(product)`,
  `waitingList: many(waitingList)` (mirrors what `dealer` used to expose).

### `dealer` (`src/db/schemas/dealer.schema.ts`)
- **Deleted.** `dealers` table, `dealerStatusEnum`, `dealersRelations`, and
  all associated Zod schemas/types are removed.
- Removed from `src/db/schema.ts` barrel export.

### `product` (`src/db/schemas/product.schema.ts`)
- `dealerId` (FK → `dealer.id`) renamed/re-pointed to
  `customerId: text("customer_id").references(() => customer.id, { onDelete: "set null" })`.
- Index and relation updated accordingly (`customer: one(customer, ...)`).

### `purchase` (`src/db/schemas/purchase.schema.ts`)
- Removed `dealerId` column, index, and relation entirely. `purchase` already
  has a required `customerId`; since dealers now *are* customers, the
  separate dealer FK was redundant. `purchaseSourceEnum` (`direct_sales` /
  `dealer`) is kept as-is — it still records *how* the purchase originated,
  independent of the party FK.

### `waiting_list` (`src/db/schemas/waiting_list.schema.ts`)
- `dealerId` (FK → `dealer.id`) renamed/re-pointed to
  `customerId: text("customer_id").references(() => customer.id, { onDelete: "set null" })`.
- Index and relation updated accordingly.

### `delivery_order` (`src/db/schemas/delivery_order.schema.ts`)
- Removed `destinationDealerId` column and its relation entirely.
  `destinationCustomerId` (FK → `customer.id`) now covers both cases; the
  `destinationType` enum (`dealer` / `customer`) is kept as the business
  classification of *which kind* of party the delivery order was addressed
  to, even though both now resolve through the same `customer` table.

### Untouched by design
`purchaseSourceEnum`, `requesterTypeEnum` (`waiting_list`), `userRoleEnum`
default (`auth-schema.ts`), and the `audit_log` entity-type enum still contain
a `"dealer"` value. These are business/role classifications, not table
references — they don't point at the dropped table and were left alone.

## Migration

Generated via `npx drizzle-kit generate` (interactively, since drizzle-kit
prompts to disambiguate "column renamed" vs. "column created" for
`dealer_id → customer_id" in `product` and `waiting_list`; **"create column"**
was chosen in both cases — see "Data backfill" below for why a straight
rename was not appropriate):

```
src/db/migrations/0009_brown_reavers.sql
src/db/migrations/meta/0009_snapshot.json
src/db/migrations/meta/_journal.json  (updated)
```

The migration:
1. Drops FK constraints and indexes referencing `dealer`.
2. Drops the `dealer` table (`CASCADE`) and the `dealer_status` enum type.
3. Adds `customer.user_id` (+ unique constraint + FK to `user.id`).
4. Adds `product.customer_id` and `waiting_list.customer_id` (+ FK + index).
5. Drops `delivery_order.destination_dealer_id`, `product.dealer_id`,
   `purchase.dealer_id`, `waiting_list.dealer_id`.

To apply:

```bash
# Review the generated SQL first:
cat src/db/migrations/0009_brown_reavers.sql

# Apply via the app's migration runner:
npm run db:migrate

# — or, for a dev DB without a migration history you care about —
npx drizzle-kit push
```

### Data backfill (do this **before** running the migration on a real DB)

Dropping `dealer` is `CASCADE` and permanently deletes all existing dealer
rows and any `dealer_id` values pointing at them. Because `customer_id` was
generated as a **new** column (not a rename), no data is auto-migrated. If
the current database has real dealer records, run a backfill in the same
transaction/release as this migration:

```sql
-- 1. Copy every dealer into customer, preserving the dealer's original id
--    so existing dealer_id FKs elsewhere still resolve after repointing.
INSERT INTO customer (id, custom_id, user_id, name, email, phone, address, created_at, updated_at)
SELECT id, id, user_id, name, email, phone, address, created_at, updated_at
FROM dealer;

-- 2. Backfill customer_id from the old dealer_id on each table, BEFORE
--    the old dealer_id columns are dropped.
UPDATE product      SET customer_id = dealer_id WHERE dealer_id IS NOT NULL;
UPDATE waiting_list  SET customer_id = dealer_id WHERE dealer_id IS NOT NULL;
UPDATE delivery_order SET destination_customer_id = destination_dealer_id WHERE destination_dealer_id IS NOT NULL;
-- purchase.dealer_id had no equivalent target column (dropped outright) —
-- purchase.customer_id should already be populated for these rows.
```

Run these `INSERT`/`UPDATE` statements **before** the generated migration's
`DROP TABLE "dealer" CASCADE` and `DROP COLUMN ..._dealer_id` statements, or
split the generated migration into two migrations with the backfill script
run in between.

## Follow-up work required (not done in this change)

Dropping the `dealers` export breaks every file that imports it from
`@/db/schema` or queries `db.query.dealers` / `.dealerId`. ~75 files
reference `dealer` across the app. Notably:

- **API routes**: `src/app/api/v1/dealers/**` (whole route tree keyed on
  dealer identity), `src/app/api/v1/customers/[id]/route.ts`,
  `src/app/api/v1/product-types/route.ts`, `src/app/api/v1/waiting-lists/**`.
- **Pages**: `src/app/(protected)/dealer/**` (dealer's own dashboard),
  `src/app/(protected)/dashboard/dealers/page.tsx`,
  `src/app/(protected)/dashboard/{customers,products,purchases,upload,users,waiting-list}/page.tsx`.
- **Services**: `dealer.service.ts`, `dealer-customer.service.ts`,
  `dealer-product.service.ts`, `dealer-purchase.service.ts`, plus
  `customer.service.ts`, `product.service.ts`, `purchase.service.ts`,
  `waiting-list.service.ts`, `warranty.service.ts`, `user.service.ts`,
  `notification.service.ts`, `accurate.service.ts` — all query `dealers` or
  `dealerId` directly.
- **Auth/session**: `src/lib/auth.ts`, `src/lib/get-login-redirect.ts` decide
  routing based on a user having a `dealer` profile.
- **Seeds/mocks**: `src/db/seeds/seed-dealers.ts` and every seed that FKs to
  it (`seed-products.ts`, `seed-purchases.ts`, `seed-waiting-list.ts`,
  `seed-delivery-orders.ts`), `src/db/seed.ts`, `src/db/_seed.ts`,
  `src/mock/mock-data.ts`, `src/mock/mock-users.ts`.
- **UI**: `src/components/dealer/request-product-form.tsx`,
  `src/components/layout/sidebar.tsx`, `src/components/ui/reassign-modal.tsx`.
- **Types**: `src/types/index.ts`.

Recommended next step: a dedicated follow-up pass that repoints all of the
above from `dealers`/`dealerId` to `customer`/`customerId` (filtering dealer
customers by `categoryId` and/or `userId IS NOT NULL` where the old code
relied on the table boundary), then deletes `seed-dealers.ts` and the
`dealer.service.ts` family in favor of extending the existing customer
services.
