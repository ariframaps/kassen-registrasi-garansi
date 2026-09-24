ALTER TABLE "dealer" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "dealer" CASCADE;--> statement-breakpoint
ALTER TABLE "delivery_order" DROP CONSTRAINT "delivery_order_destination_dealer_id_dealer_id_fk";
--> statement-breakpoint
ALTER TABLE "product" DROP CONSTRAINT "product_dealer_id_dealer_id_fk";
--> statement-breakpoint
ALTER TABLE "purchase" DROP CONSTRAINT "purchase_dealer_id_dealer_id_fk";
--> statement-breakpoint
ALTER TABLE "waiting_list" DROP CONSTRAINT "waiting_list_dealer_id_dealer_id_fk";
--> statement-breakpoint
DROP INDEX "product_dealer_id_index";--> statement-breakpoint
DROP INDEX "purchase_dealer_id_index";--> statement-breakpoint
DROP INDEX "waiting_list_dealer_id_index";--> statement-breakpoint
ALTER TABLE "customer" ALTER COLUMN "id" SET DEFAULT '51911719-b4dc-4f1f-a8cb-64a9462a626e';--> statement-breakpoint
ALTER TABLE "customer_category" ALTER COLUMN "id" SET DEFAULT '82bf1ba7-56f7-476d-90c7-5636d9cb748a';--> statement-breakpoint
ALTER TABLE "product_category" ALTER COLUMN "id" SET DEFAULT '3dd2ade3-ebe5-4431-a523-619428702cac';--> statement-breakpoint
ALTER TABLE "product_type" ALTER COLUMN "id" SET DEFAULT '31916039-ca8b-4aa8-ac9c-df99a60e7b7e';--> statement-breakpoint
ALTER TABLE "item_code_mapping" ALTER COLUMN "id" SET DEFAULT '5a2426dc-2df1-4b96-afce-79b0040a6ff5';--> statement-breakpoint
ALTER TABLE "delivery_order" ALTER COLUMN "id" SET DEFAULT '7578c62f-1c63-466f-917e-141dc97c9a80';--> statement-breakpoint
ALTER TABLE "product" ALTER COLUMN "id" SET DEFAULT 'fd5d5df1-0e27-4988-8d4f-a8000240a1f4';--> statement-breakpoint
ALTER TABLE "purchase" ALTER COLUMN "id" SET DEFAULT 'ba8e8096-b4f0-4406-a193-9863c58680d0';--> statement-breakpoint
ALTER TABLE "purchase_item" ALTER COLUMN "id" SET DEFAULT 'f5e51533-b034-422d-95b8-20d26e6ec8f5';--> statement-breakpoint
ALTER TABLE "invoice" ALTER COLUMN "id" SET DEFAULT 'c5c955a5-a965-4bbf-956b-7c095d708795';--> statement-breakpoint
ALTER TABLE "waiting_list" ALTER COLUMN "id" SET DEFAULT '6dba1561-0110-462b-9051-3efd2ff07654';--> statement-breakpoint
ALTER TABLE "notification" ALTER COLUMN "id" SET DEFAULT '78d221cb-91b7-477c-945f-5ef949fe0e95';--> statement-breakpoint
ALTER TABLE "customer" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "customer_id" text;--> statement-breakpoint
ALTER TABLE "waiting_list" ADD COLUMN "customer_id" text;--> statement-breakpoint
ALTER TABLE "customer" ADD CONSTRAINT "customer_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waiting_list" ADD CONSTRAINT "waiting_list_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "product_customer_id_index" ON "product" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "waiting_list_customer_id_index" ON "waiting_list" USING btree ("customer_id");--> statement-breakpoint
ALTER TABLE "delivery_order" DROP COLUMN "destination_dealer_id";--> statement-breakpoint
ALTER TABLE "product" DROP COLUMN "dealer_id";--> statement-breakpoint
ALTER TABLE "purchase" DROP COLUMN "dealer_id";--> statement-breakpoint
ALTER TABLE "waiting_list" DROP COLUMN "dealer_id";--> statement-breakpoint
ALTER TABLE "customer" ADD CONSTRAINT "customer_user_id_unique" UNIQUE("user_id");--> statement-breakpoint
DROP TYPE "public"."dealer_status";