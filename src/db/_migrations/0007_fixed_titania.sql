ALTER TABLE "dealer" ALTER COLUMN "id" SET DEFAULT '5d0e928a-9d87-46d0-9682-f0713684c011';--> statement-breakpoint
ALTER TABLE "customer" ALTER COLUMN "id" SET DEFAULT '919b8801-cb7d-47ef-a3f9-66c8f8ac8176';--> statement-breakpoint
ALTER TABLE "product_category" ALTER COLUMN "id" SET DEFAULT '9501b6c6-386c-4139-b92b-b1e9a836e2e0';--> statement-breakpoint
ALTER TABLE "product_type" ALTER COLUMN "id" SET DEFAULT '8f5c9f7f-a6cb-4d1c-9c66-40e7b9115689';--> statement-breakpoint
ALTER TABLE "item_code_mapping" ALTER COLUMN "id" SET DEFAULT '28a2ee35-ef4b-4fec-b32e-dea28344b153';--> statement-breakpoint
ALTER TABLE "delivery_order" ALTER COLUMN "id" SET DEFAULT 'ce1db12b-3bc6-4ab1-b1b3-c9bb7b21cbab';--> statement-breakpoint
ALTER TABLE "product" ALTER COLUMN "id" SET DEFAULT 'f9673643-8f34-4bd5-89d7-469b8bfe525a';--> statement-breakpoint
ALTER TABLE "purchase" ALTER COLUMN "id" SET DEFAULT '10a72f4c-5a63-41d9-b728-68985c9475dd';--> statement-breakpoint
ALTER TABLE "purchase_item" ALTER COLUMN "id" SET DEFAULT '0f4f3ba7-6147-4272-96a5-d338583848dd';--> statement-breakpoint
ALTER TABLE "invoice" ALTER COLUMN "id" SET DEFAULT '420bfc72-918e-424c-8d01-bccde88655b7';--> statement-breakpoint
ALTER TABLE "warranty_condition" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "waiting_list" ALTER COLUMN "id" SET DEFAULT 'c11b26d8-35fb-4647-a01a-c3231ef9cd94';--> statement-breakpoint
ALTER TABLE "notification" ALTER COLUMN "id" SET DEFAULT '0694fdd2-5cd2-4839-ab66-041071b150ae';--> statement-breakpoint
ALTER TABLE "audit_log" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "waiting_list" ADD COLUMN "product_type_id" text;--> statement-breakpoint
ALTER TABLE "waiting_list" ADD CONSTRAINT "waiting_list_product_type_id_product_type_id_fk" FOREIGN KEY ("product_type_id") REFERENCES "public"."product_type"("id") ON DELETE set null ON UPDATE no action;