CREATE TYPE "public"."user_role" AS ENUM('admin', 'sales', 'dealer', 'technical_support');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'inactive', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."dealer_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."destination_type" AS ENUM('dealer', 'customer');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('unassigned', 'assigned', 'warranty_active', 'warranty_expired');--> statement-breakpoint
CREATE TYPE "public"."purchase_source" AS ENUM('direct_sales', 'dealer');--> statement-breakpoint
CREATE TYPE "public"."warranty_status" AS ENUM('valid', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."requester_type" AS ENUM('end_user', 'dealer');--> statement-breakpoint
CREATE TYPE "public"."waiting_list_status" AS ENUM('pending', 'notified');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('product_ready', 'general');--> statement-breakpoint
CREATE TYPE "public"."audit_log_category" AS ENUM('AUTH', 'PRODUCT', 'DEALER', 'PURCHASE', 'USER', 'WARRANTY', 'WAITING_LIST', 'SYSTEM');--> statement-breakpoint
CREATE TYPE "public"."audit_log_priority" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."audit_log_status" AS ENUM('success', 'error');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"role" "user_role" DEFAULT 'dealer' NOT NULL,
	"status" "user_status" DEFAULT 'active' NOT NULL,
	"last_login_at" timestamp,
	"deleted_at" timestamp,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dealer" (
	"id" text PRIMARY KEY DEFAULT 'fab323c6-7f4e-4eba-884d-69f5238ad027' NOT NULL,
	"user_id" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(50),
	"address" text,
	"status" "dealer_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "dealer_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "dealer_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "customer" (
	"id" text PRIMARY KEY DEFAULT '8bfc1969-93d9-4c71-9877-b2849ddb35d4' NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(50),
	"address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "customer_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "product_category" (
	"id" text PRIMARY KEY DEFAULT '4b0d2410-3360-4ad8-8ea5-39c16dc356c7' NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "product_category_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "product_type" (
	"id" text PRIMARY KEY DEFAULT '733317d3-16f0-46a6-891a-c025996402f6' NOT NULL,
	"category_id" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"warranty_duration_months" integer DEFAULT 12 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "product_type_name_unique" UNIQUE("name"),
	CONSTRAINT "product_type_category_id_name_unique" UNIQUE("category_id","name")
);
--> statement-breakpoint
CREATE TABLE "item_code_mapping" (
	"id" text PRIMARY KEY DEFAULT 'c530ecef-7f29-4bab-8acb-5c39753e51d4' NOT NULL,
	"item_code" varchar(100) NOT NULL,
	"product_type_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "item_code_mapping_item_code_unique" UNIQUE("item_code")
);
--> statement-breakpoint
CREATE TABLE "delivery_order" (
	"id" text PRIMARY KEY DEFAULT '49b1deaa-5281-4903-812a-5982b64a6eef' NOT NULL,
	"do_number" varchar(100) NOT NULL,
	"do_date" date NOT NULL,
	"ship_to_raw" varchar(255) NOT NULL,
	"sent_by" varchar(100),
	"order_ref" varchar(100),
	"dc_ref" varchar(100),
	"destination_type" "destination_type" NOT NULL,
	"destination_dealer_id" text,
	"destination_customer_id" text,
	"uploaded_by" text NOT NULL,
	"file_hash" varchar(64) NOT NULL,
	"original_filename" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "delivery_order_file_hash_unique" UNIQUE("file_hash")
);
--> statement-breakpoint
CREATE TABLE "product" (
	"id" text PRIMARY KEY DEFAULT '7ca23db6-a1c4-40bc-95d1-ff47cbc369d5' NOT NULL,
	"serial_number" varchar(100) NOT NULL,
	"product_type_id" text NOT NULL,
	"delivery_order_id" text NOT NULL,
	"dealer_id" text,
	"status" "product_status" DEFAULT 'unassigned' NOT NULL,
	"warranty_start_date" date,
	"warranty_end_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "product_serial_number_unique" UNIQUE("serial_number")
);
--> statement-breakpoint
CREATE TABLE "purchase" (
	"id" text PRIMARY KEY DEFAULT 'd6743c00-0014-4885-842e-f8be7293a3c6' NOT NULL,
	"purchase_date" date NOT NULL,
	"customer_id" text NOT NULL,
	"dealer_id" text,
	"registered_by" text NOT NULL,
	"source" "purchase_source" NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "purchase_item" (
	"id" text PRIMARY KEY DEFAULT '5ac79cd5-58f0-45f5-9d62-4612fde8271f' NOT NULL,
	"purchase_id" text NOT NULL,
	"product_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "purchase_item_product_id_unique" UNIQUE("product_id")
);
--> statement-breakpoint
CREATE TABLE "invoice" (
	"id" text PRIMARY KEY DEFAULT '36a6b582-7565-48f3-b28f-18891b3c3c2c' NOT NULL,
	"purchase_id" text NOT NULL,
	"storage_path" text NOT NULL,
	"original_filename" varchar(255) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"file_size_bytes" integer NOT NULL,
	"uploaded_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "invoice_purchase_id_unique" UNIQUE("purchase_id")
);
--> statement-breakpoint
CREATE TABLE "warranty_condition" (
	"id" text PRIMARY KEY DEFAULT '6fc37d22-0e33-40a2-923c-7c4371a76d37' NOT NULL,
	"product_id" text NOT NULL,
	"condition" "warranty_status" DEFAULT 'valid' NOT NULL,
	"reason" text,
	"updated_by" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "warranty_condition_product_id_unique" UNIQUE("product_id")
);
--> statement-breakpoint
CREATE TABLE "waiting_list" (
	"id" text PRIMARY KEY DEFAULT '2cc53f53-07e2-4557-803b-42cbc6b970cb' NOT NULL,
	"serial_number_requested" varchar(100) NOT NULL,
	"requester_type" "requester_type" NOT NULL,
	"requester_name" varchar(255),
	"requester_email" varchar(255),
	"requester_phone" varchar(50),
	"dealer_id" text,
	"product_id" text,
	"status" "waiting_list_status" DEFAULT 'pending' NOT NULL,
	"notified_at" timestamp with time zone,
	"resolved_at" timestamp with time zone,
	"notified_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification" (
	"id" text PRIMARY KEY DEFAULT '98c4c64e-5d26-44b3-85a2-c38688c378de' NOT NULL,
	"user_id" text NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"type" "notification_type" NOT NULL,
	"related_waiting_list_id" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" text PRIMARY KEY DEFAULT 'd5c5f659-33fc-4b03-9b7d-38466e6535e7' NOT NULL,
	"user_id" text,
	"category" "audit_log_category" NOT NULL,
	"event" varchar(100) NOT NULL,
	"status" "audit_log_status" NOT NULL,
	"priority" "audit_log_priority" DEFAULT 'low' NOT NULL,
	"ip_address" "inet",
	"user_agent" text,
	"data" jsonb,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dealer" ADD CONSTRAINT "dealer_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_type" ADD CONSTRAINT "product_type_category_id_product_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."product_category"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_code_mapping" ADD CONSTRAINT "item_code_mapping_product_type_id_product_type_id_fk" FOREIGN KEY ("product_type_id") REFERENCES "public"."product_type"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_order" ADD CONSTRAINT "delivery_order_destination_dealer_id_dealer_id_fk" FOREIGN KEY ("destination_dealer_id") REFERENCES "public"."dealer"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_order" ADD CONSTRAINT "delivery_order_destination_customer_id_customer_id_fk" FOREIGN KEY ("destination_customer_id") REFERENCES "public"."customer"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_order" ADD CONSTRAINT "delivery_order_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_product_type_id_product_type_id_fk" FOREIGN KEY ("product_type_id") REFERENCES "public"."product_type"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_delivery_order_id_delivery_order_id_fk" FOREIGN KEY ("delivery_order_id") REFERENCES "public"."delivery_order"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_dealer_id_dealer_id_fk" FOREIGN KEY ("dealer_id") REFERENCES "public"."dealer"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase" ADD CONSTRAINT "purchase_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase" ADD CONSTRAINT "purchase_dealer_id_dealer_id_fk" FOREIGN KEY ("dealer_id") REFERENCES "public"."dealer"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase" ADD CONSTRAINT "purchase_registered_by_user_id_fk" FOREIGN KEY ("registered_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_item" ADD CONSTRAINT "purchase_item_purchase_id_purchase_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "public"."purchase"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_item" ADD CONSTRAINT "purchase_item_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_purchase_id_purchase_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "public"."purchase"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warranty_condition" ADD CONSTRAINT "warranty_condition_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warranty_condition" ADD CONSTRAINT "warranty_condition_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waiting_list" ADD CONSTRAINT "waiting_list_dealer_id_dealer_id_fk" FOREIGN KEY ("dealer_id") REFERENCES "public"."dealer"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waiting_list" ADD CONSTRAINT "waiting_list_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waiting_list" ADD CONSTRAINT "waiting_list_notified_by_user_id_fk" FOREIGN KEY ("notified_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_related_waiting_list_id_waiting_list_id_fk" FOREIGN KEY ("related_waiting_list_id") REFERENCES "public"."waiting_list"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "delivery_order_do_number_index" ON "delivery_order" USING btree ("do_number");--> statement-breakpoint
CREATE INDEX "product_dealer_id_index" ON "product" USING btree ("dealer_id");--> statement-breakpoint
CREATE INDEX "product_product_type_id_index" ON "product" USING btree ("product_type_id");--> statement-breakpoint
CREATE INDEX "product_delivery_order_id_index" ON "product" USING btree ("delivery_order_id");--> statement-breakpoint
CREATE INDEX "purchase_customer_id_index" ON "purchase" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "purchase_dealer_id_index" ON "purchase" USING btree ("dealer_id");--> statement-breakpoint
CREATE INDEX "purchase_item_purchase_id_index" ON "purchase_item" USING btree ("purchase_id");--> statement-breakpoint
CREATE INDEX "waiting_list_serial_number_requested_index" ON "waiting_list" USING btree ("serial_number_requested");--> statement-breakpoint
CREATE INDEX "waiting_list_status_created_at_index" ON "waiting_list" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "waiting_list_dealer_id_index" ON "waiting_list" USING btree ("dealer_id");--> statement-breakpoint
CREATE INDEX "notification_user_id_index" ON "notification" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notification_user_id_is_read_index" ON "notification" USING btree ("user_id","is_read");--> statement-breakpoint
CREATE INDEX "notification_user_id_created_at_index" ON "notification" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_log_created_at_index" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_log_user_id_index" ON "audit_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_log_user_id_created_at_index" ON "audit_log" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_log_category_index" ON "audit_log" USING btree ("category");--> statement-breakpoint
CREATE INDEX "audit_log_priority_created_at_index" ON "audit_log" USING btree ("priority","created_at");