# Excel DO Upload — Dealer/Customer Consolidation Refactor

## Goal

Align the Excel Delivery Order upload feature
(`src/app/(protected)/dashboard/upload/page.tsx`) with the consolidated
`customer` schema (see `DEALER_SCHEMA_CONSOLIDATION.md`): a dealer is not a
separate entity anymore, it is a `customer` row whose category identifies it
as a dealer. Excel parsing/file-conversion logic was **not touched** —
`src/lib/parser-accurate.ts`, `validateAccurateFile`, and the file-hash /
duplicate-detection logic in `src/services/accurate.service.ts` are
byte-for-byte the same as before.

## How "is this a dealer" is decided

There is no boolean flag on `customer_category` for this. The rule, applied
identically on the client (`isDealerCategory` in `upload/page.tsx`) and the
server (`isDealerCategory` in `accurate.service.ts`), is:

```
category.name.trim().toLowerCase() === "dealer"
```

**This means an admin must create a `customer_category` row literally named
"Dealer"** (via the existing customer-categories CRUD) for the dealer
inventory path to trigger. Until that category exists, every upload
destination is treated as an end customer (a `purchase` is created instead
of a direct inventory assignment). This is a deliberate, simple convention
chosen because `customer_category` is a free-form admin-managed lookup table
with no reserved/system rows — flag this to the client if a different rule
(e.g. a dedicated `isDealer` boolean column) is preferred.

## Frontend changes (`upload/page.tsx`)

### Removed
- `FuzzyDealerModal`, `NewDealerModal`, `FuzzyCustomerModal`, `NewCustomerModal`
  — replaced by two shared components (see below).
- `PendingDealerCreation` type, `pendingDealerCreation` queue-item field,
  `dealerApi` usage, `Dealer` type import — the upload page now only talks
  to `customerApi` / `customerCategoryApi`. (`dealerApi` itself is untouched
  and still used by `dashboard/dealers`, `dealer/*`, `products`, `purchases`.)

### Added
- **`CustomerSearchModal`** — one search/select modal used for both the
  "Dealer" and "End Customer" destination buttons. It fetches
  `customerApi.getAll()` and filters the candidate list by
  `isDealerCategory(...) === (mode === "dealer")`, so the two entry points
  stay behaviorally consistent with the category rule above. `onSelect`
  returns the full `CustomerSchema` (id + categoryId), not just a name.
- **`CustomerCreationModal`** — the single consolidated "Customer/Dealer
  Creation" form requested, replacing the old split Dealer/Customer forms.
  Fields: `customId` (required), `name` (required), `categoryId` (required
  `Select`, populated from `customerCategoryApi.getAll()`), `phone`,
  `address`, `email` (all optional). Shows an informational note when the
  chosen category resolves to "Dealer".

### `QueueFile` shape
- `pendingDealerCreation` + old `pendingCustomerCreation` (name/email/phone
  only) → single `pendingCustomerCreation: { customId, name, categoryId,
  phone?, address?, email? }`.
- New `selectedCustomerId?: string` — set when an *existing* customer/dealer
  was picked from `CustomerSearchModal` (previously only the display name was
  kept, and the backend re-resolved the entity by a fragile `name` lookup).
- `destType` is still `"dealer" | "customer"`, but it is no longer a raw
  user toggle — it's re-derived from the resolved customer's actual category
  every time a selection or creation happens (`handleCustomerSelect`,
  `handleCustomerCreationSave`), so the UI (purchase-form gating, submit
  button state, badges) can never disagree with what the backend will do.
- The "Dealer" / "End Customer" buttons are kept as-is for UX continuity —
  they only pick which candidate list `CustomerSearchModal` shows and which
  default category `CustomerCreationModal` pre-selects.

### Removed dead props
`QueueItem`'s `onFuzzyConfirm` / `onNewDealer` props were accepted but never
read inside the component (pre-existing dead code) — dropped along with
their now-removed call sites.

## API client (`src/lib/api/api-client.ts`)

`uploadApi.uploadAccurateFile(file, destType, destLabel, pendingDealerCreation?, pendingCustomerCreation?, pendingItemCodes?, purchaseData?)`
→
`uploadApi.uploadAccurateFile(file, selectedCustomerId?, pendingCustomerCreation?, pendingItemCodes?, purchaseData?)`

`destType`/`destLabel` are gone from the payload — the server now resolves
the destination entity directly by id (or creates it) and determines
dealer-vs-customer itself from its category, instead of trusting a
client-chosen label that was looked up by `name`.

## Backend

### `src/app/api/v1/upload/route.ts`
- `pendingDealerCreationSchema` removed; `pendingCustomerCreationSchema` now
  requires `customId`/`name`/`categoryId` (matches the consolidated form).
- `destType` / `destLabel` fields removed from `uploadSchema`; replaced by
  optional `selectedCustomerId`, with a `.refine()` requiring either
  `selectedCustomerId` or `pendingCustomerCreation`.

### `src/services/accurate.service.ts`
- `UploadSubmitOptions`: `destType`, `destLabel`, `pendingDealerCreation`
  removed; `selectedCustomerId` + consolidated `pendingCustomerCreation`
  added.
- Resolution logic rewritten: creates the customer row from
  `pendingCustomerCreation` (with its real `customId`/`categoryId`/`address`)
  **or** loads `selectedCustomerId` directly by primary key — no more
  `eq(customer.name, destLabel)` lookups, which were ambiguous for
  duplicate/legacy names.
- `destType`/`dealerId` are now computed once, from the resolved customer's
  `category.name` via `isDealerCategory`, and everything downstream (DO
  `destinationType`, `product.customerId` assignment, the dealer
  product-match notification, and the `purchase`/`purchaseItem`/`invoice`
  creation for non-dealer sales) is unchanged in behavior — only its input
  (`isDealer`/`customerId`) is now category-derived instead of a
  client-supplied enum.

### Behavior intentionally dropped
The old dealer-creation path also created a `user` row (`role: "dealer"`)
and linked it via `customer.userId`, auto-granting the new dealer a
dashboard login. The consolidated creation form has no such field (and email
is optional there, whereas login creation needed one) — granting dashboard
access to a customer/dealer is out of scope for this upload flow now and
should happen through a separate flow (Users management /
`customer.userId`), consistent with how `DEALER_SCHEMA_CONSOLIDATION.md`
already describes that link as a distinct concern from being "a dealer".

## Verification

- `npx tsc --noEmit` — passes with zero errors.
- `npm run build` — builds cleanly (Next.js 16 / Turbopack).
