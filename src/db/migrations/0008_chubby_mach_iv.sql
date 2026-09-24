CREATE TABLE "customer_category" (
	"id" text PRIMARY KEY DEFAULT '0e11a29d-0686-4fb9-b7d2-270ec34fc92f' NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "customer_category_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "dealer" ALTER COLUMN "id" SET DEFAULT '6a94bc28-9acb-413a-8acf-b6f8092deb5d';--> statement-breakpoint
ALTER TABLE "customer" ALTER COLUMN "id" SET DEFAULT 'b6454987-ea9c-4b35-9ac6-27d4970b35cd';--> statement-breakpoint
ALTER TABLE "customer" ALTER COLUMN "email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "product_category" ALTER COLUMN "id" SET DEFAULT 'a0e45a57-cfa1-4c46-ad2d-438d5aebf874';--> statement-breakpoint
ALTER TABLE "product_type" ALTER COLUMN "id" SET DEFAULT '43cde053-e516-4936-82ce-8427763ad24f';--> statement-breakpoint
ALTER TABLE "item_code_mapping" ALTER COLUMN "id" SET DEFAULT '9648b431-3f23-41ad-b2fd-839a829e5777';--> statement-breakpoint
ALTER TABLE "delivery_order" ALTER COLUMN "id" SET DEFAULT '5d48dd35-9b76-424a-a2aa-9480ffa08430';--> statement-breakpoint
ALTER TABLE "product" ALTER COLUMN "id" SET DEFAULT '7343161c-6fa5-45b1-8af8-67c1830780a2';--> statement-breakpoint
ALTER TABLE "purchase" ALTER COLUMN "id" SET DEFAULT 'f20cb0c1-852d-4fdc-8a4b-58f198a8b1db';--> statement-breakpoint
ALTER TABLE "purchase_item" ALTER COLUMN "id" SET DEFAULT 'f44cf7ce-de30-4313-9ff5-ab6c9ae25950';--> statement-breakpoint
ALTER TABLE "invoice" ALTER COLUMN "id" SET DEFAULT 'e9360d8e-1c06-4e79-9740-5f13575772ea';--> statement-breakpoint
ALTER TABLE "waiting_list" ALTER COLUMN "id" SET DEFAULT 'bffacf62-7698-4c57-9113-d8866007f38f';--> statement-breakpoint
ALTER TABLE "notification" ALTER COLUMN "id" SET DEFAULT '37a9269e-9a4e-4a41-a38b-4d3a6c833e87';--> statement-breakpoint
ALTER TABLE "customer" ADD COLUMN "custom_id" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "customer" ADD COLUMN "category_id" text;--> statement-breakpoint
ALTER TABLE "customer" ADD CONSTRAINT "customer_category_id_customer_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."customer_category"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer" ADD CONSTRAINT "customer_custom_id_unique" UNIQUE("custom_id");