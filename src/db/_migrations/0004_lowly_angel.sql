ALTER TABLE "product" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "product" ALTER COLUMN "status" SET DEFAULT 'uploaded_by_sales'::text;--> statement-breakpoint
DROP TYPE "public"."product_status";--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('uploaded_by_sales', 'assigned_to_dealer', 'warranty_active', 'warranty_expired');--> statement-breakpoint
ALTER TABLE "product" ALTER COLUMN "status" SET DEFAULT 'uploaded_by_sales'::"public"."product_status";--> statement-breakpoint
ALTER TABLE "product" ALTER COLUMN "status" SET DATA TYPE "public"."product_status" USING "status"::"public"."product_status";--> statement-breakpoint
ALTER TABLE "dealer" ALTER COLUMN "id" SET DEFAULT '84d0df32-6b8e-44d8-970a-b73d5dc2491b';--> statement-breakpoint
ALTER TABLE "customer" ALTER COLUMN "id" SET DEFAULT '7717efb5-a941-4aee-9246-4389314516c0';--> statement-breakpoint
ALTER TABLE "product_category" ALTER COLUMN "id" SET DEFAULT 'eb4e3ee4-eae6-403c-bcb9-d3f947424514';--> statement-breakpoint
ALTER TABLE "product_type" ALTER COLUMN "id" SET DEFAULT '490e82b5-88f9-47a4-9d81-5c61e338a291';--> statement-breakpoint
ALTER TABLE "item_code_mapping" ALTER COLUMN "id" SET DEFAULT 'a5651bb4-2138-4766-9de8-0c8fdb4ebfe3';--> statement-breakpoint
ALTER TABLE "delivery_order" ALTER COLUMN "id" SET DEFAULT '2376f258-da25-4688-9591-fab9be9ed0e6';--> statement-breakpoint
ALTER TABLE "product" ALTER COLUMN "id" SET DEFAULT '5e0cc5fd-ae7c-441d-b2e3-80c7d479f407';--> statement-breakpoint
ALTER TABLE "purchase" ALTER COLUMN "id" SET DEFAULT '3d23fa0d-4218-4205-8062-18edd98076d6';--> statement-breakpoint
ALTER TABLE "purchase_item" ALTER COLUMN "id" SET DEFAULT '7bbc4345-461f-4925-a29b-68eacfcce7fa';--> statement-breakpoint
ALTER TABLE "invoice" ALTER COLUMN "id" SET DEFAULT '058dc9a6-fc10-4580-9fec-c467c42c8397';--> statement-breakpoint
ALTER TABLE "warranty_condition" ALTER COLUMN "id" SET DEFAULT '59934a68-2320-404f-a7a6-241603ce8552';--> statement-breakpoint
ALTER TABLE "waiting_list" ALTER COLUMN "id" SET DEFAULT '4408526a-508d-4d61-98fa-e76b9413e73b';--> statement-breakpoint
ALTER TABLE "notification" ALTER COLUMN "id" SET DEFAULT 'cd2a9161-fe4f-4bfd-85e2-0830c727b7e3';--> statement-breakpoint
ALTER TABLE "audit_log" ALTER COLUMN "id" SET DEFAULT '78c1dd94-eb39-4d1a-bd7d-4cfb7f6f4f82';