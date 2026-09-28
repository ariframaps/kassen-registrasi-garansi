# Customer Schema Changes

## Goal

Align the `customer` schema with the client's Excel import requirements: custom customer IDs, a dedicated customer category lookup table, and optional contact details.

## Files Modified

### New: `src/db/schemas/customer_category.schema.ts`
- Added `customer_category` table:
  - `id` — text PK, default `crypto.randomUUID()`
  - `name` — varchar(255), `NOT NULL UNIQUE`
  - `createdAt` / `updatedAt` / `deletedAt` — via shared `timestamps` helper
- Added `customerCategoryRelations` (`many(customer)`)
- Added Zod schemas/types: `customerCategorySchema`, `customerCategoryInsertSchema`, `customerCategoryUpdateSchema` and their inferred types.

### Modified: `src/db/schemas/customer.schema.ts`
- Added `customId` — `varchar("custom_id", { length: 100 })`, `NOT NULL UNIQUE` (stores the customer ID from the client's Excel import).
- Added `categoryId` — `text("category_id")`, nullable FK → `customer_category.id`, `ON DELETE SET NULL`.
- Changed `email` — from `NOT NULL UNIQUE` to nullable `UNIQUE` (Postgres allows multiple NULLs in a unique column, so uniqueness is preserved for rows that do have an email).
- `phone` was already nullable — no change needed there.
- Added `category: one(customerCategory, ...)` to `customersRelations`.

### Modified: `src/db/schema.ts`
- Added `export * from "./schemas/customer_category.schema";` so the new table/relations/types are part of the global schema barrel.

## Migration

Generate the migration from the updated schema, then apply it:

```bash
npx drizzle-kit generate
npx drizzle-kit push
```

(`npx drizzle-kit generate` writes SQL into `src/db/migrations`; `npx drizzle-kit push` applies the current schema directly to `DATABASE_URL`. Use `db:migrate` — `tsx src/db/migrate.ts` — instead of `push` if this project runs migrations via files in a deployed environment.)

**Before running against a database with existing customer rows:** `custom_id` is `NOT NULL UNIQUE` with no default, so drizzle-kit will prompt for a strategy (default value / manual backfill) for existing rows — decide on a backfill value (e.g. a temporary generated code) before pushing to a populated database.

## Out of Scope / Follow-up Needed

Making `email` nullable and adding a required `customId` breaks type-checking in several consumers that assumed the old shape. `npx tsc --noEmit` surfaces these (not fixed as part of this task, since it was scoped to the schema layer):

- `src/lib/adapters/customer.adapter.ts` — maps `email: string | null` into a field typed `string`.
- `src/services/customer.service.ts` — customer creation doesn't yet supply `customId`; a mapped field assumes non-null `email`.
- `src/services/dealer-customer.service.ts` — same non-null `email` assumption.
- `src/services/dealer-purchase.service.ts` — `DealerPurchaseResponse.customerProfile.email` typed as non-null `string`.
- `src/db/seeds/seed-customers.ts` — insert calls don't pass `customId` yet.
- `src/app/(protected)/dashboard/customers/page.tsx` and `.../purchases/page.tsx` — render `c.email` / `g.customer.email` without a null check.

These will need: (1) a `customId` value supplied wherever customers are created/seeded (including any Excel-import flow), (2) null-safe handling of `email` in UI/services/types, and (3) decisions on where `categoryId` gets set (e.g. category picker in the customer form, or default assignment on import).
