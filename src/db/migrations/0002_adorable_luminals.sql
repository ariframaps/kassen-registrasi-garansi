ALTER TABLE "users" ADD COLUMN "otp_resend_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "otp_resend_blocked_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "otp_last_sent_at" timestamp with time zone;