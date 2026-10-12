CREATE TYPE "public"."customer_type" AS ENUM('MKO', 'DEALER');--> statement-breakpoint
ALTER TABLE "customer" ALTER COLUMN "id" SET DEFAULT '3b292579-1649-4640-ad83-63fc11ace408';--> statement-breakpoint
ALTER TABLE "customer_category" ALTER COLUMN "id" SET DEFAULT '0e76fad0-5907-469f-b00b-f06466b16397';--> statement-breakpoint
ALTER TABLE "product_category" ALTER COLUMN "id" SET DEFAULT '5812859d-1bc8-4f97-a9b0-49e9ecf0660b';--> statement-breakpoint
ALTER TABLE "product_type" ALTER COLUMN "id" SET DEFAULT '37013068-cb4c-49ad-9e23-2a58186142f9';--> statement-breakpoint
ALTER TABLE "item_code_mapping" ALTER COLUMN "id" SET DEFAULT 'a0380027-a7bf-4aea-bfef-065138f34d57';--> statement-breakpoint
ALTER TABLE "delivery_order" ALTER COLUMN "id" SET DEFAULT '8b4c7bcc-92d5-4b0e-9d43-2bb7b693174d';--> statement-breakpoint
ALTER TABLE "product" ALTER COLUMN "id" SET DEFAULT '338781d5-17d8-42e2-b0a8-4d4bb9af4c52';--> statement-breakpoint
ALTER TABLE "purchase" ALTER COLUMN "id" SET DEFAULT '567bf5b1-4749-4a43-83f7-a7bea924cbd4';--> statement-breakpoint
ALTER TABLE "purchase_item" ALTER COLUMN "id" SET DEFAULT '9cb3c3c2-9eee-432e-8ddc-8197d27999eb';--> statement-breakpoint
ALTER TABLE "invoice" ALTER COLUMN "id" SET DEFAULT '05082f33-dfa6-4f71-8e14-05fcb67c8016';--> statement-breakpoint
ALTER TABLE "waiting_list" ALTER COLUMN "id" SET DEFAULT '64cc1aa9-a745-4ff5-bf95-e5b9cb0a343d';--> statement-breakpoint
ALTER TABLE "notification" ALTER COLUMN "id" SET DEFAULT 'd84c09ff-4e36-422b-9023-d4bbd32d9a5d';--> statement-breakpoint
ALTER TABLE "customer" ADD COLUMN "type" "customer_type" DEFAULT 'MKO' NOT NULL;--> statement-breakpoint
ALTER TABLE "customer" ADD COLUMN "dealer_id" text;--> statement-breakpoint
ALTER TABLE "customer" ADD CONSTRAINT "customer_dealer_id_user_id_fk" FOREIGN KEY ("dealer_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;