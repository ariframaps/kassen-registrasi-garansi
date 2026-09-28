ALTER TABLE "product" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "product" ALTER COLUMN "status" SET DEFAULT 'none'::text;--> statement-breakpoint
DROP TYPE "public"."product_status";--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('none', 'warranty_active', 'warranty_expired');--> statement-breakpoint
ALTER TABLE "product" ALTER COLUMN "status" SET DEFAULT 'none'::"public"."product_status";--> statement-breakpoint
ALTER TABLE "product" ALTER COLUMN "status" SET DATA TYPE "public"."product_status" USING "status"::"public"."product_status";--> statement-breakpoint
ALTER TABLE "dealer" ALTER COLUMN "id" SET DEFAULT 'c2bd4c73-983d-478f-9f79-7290075bbfbf';--> statement-breakpoint
ALTER TABLE "customer" ALTER COLUMN "id" SET DEFAULT 'b1d4de02-1713-4394-84e0-3dc2bfaabdf5';--> statement-breakpoint
ALTER TABLE "product_category" ALTER COLUMN "id" SET DEFAULT '0cbc0592-cd24-41ad-b7b5-c0f994973606';--> statement-breakpoint
ALTER TABLE "product_type" ALTER COLUMN "id" SET DEFAULT '6afe743c-d72e-4cbc-9da5-4c7889af937a';--> statement-breakpoint
ALTER TABLE "item_code_mapping" ALTER COLUMN "id" SET DEFAULT 'f8cfd12c-e31f-430b-91f4-7d4da869dfc9';--> statement-breakpoint
ALTER TABLE "delivery_order" ALTER COLUMN "id" SET DEFAULT 'cbd0a94b-057f-4c86-91be-bd86d708a893';--> statement-breakpoint
ALTER TABLE "product" ALTER COLUMN "id" SET DEFAULT 'dfa2119b-f200-40eb-b702-be9a94028159';--> statement-breakpoint
ALTER TABLE "purchase" ALTER COLUMN "id" SET DEFAULT '96de58dc-374c-4e98-bcc8-276530107aa4';--> statement-breakpoint
ALTER TABLE "purchase_item" ALTER COLUMN "id" SET DEFAULT '29be34af-9d81-4c07-88fb-0d0bdc24439a';--> statement-breakpoint
ALTER TABLE "invoice" ALTER COLUMN "id" SET DEFAULT 'b1a2f8bc-8a6a-4bab-86d2-562157366a7c';--> statement-breakpoint
ALTER TABLE "warranty_condition" ALTER COLUMN "id" SET DEFAULT 'cc02e167-975c-48c5-9e72-d325f1e3280c';--> statement-breakpoint
ALTER TABLE "waiting_list" ALTER COLUMN "id" SET DEFAULT '79f227a8-3b62-471f-b3f5-779e49f51212';--> statement-breakpoint
ALTER TABLE "notification" ALTER COLUMN "id" SET DEFAULT '754ee64d-0b02-4bdc-8c59-1a4b9ab81db7';--> statement-breakpoint
ALTER TABLE "audit_log" ALTER COLUMN "id" SET DEFAULT 'c57d4e79-1656-4902-9e2b-dc0130a92f68';