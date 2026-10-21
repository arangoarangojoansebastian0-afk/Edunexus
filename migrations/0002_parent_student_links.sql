DO $$ BEGIN
  CREATE TYPE "parent_link_status" AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "parent_student_links" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_id" varchar NOT NULL,
	"student_id" varchar NOT NULL,
	"institution_id" uuid NOT NULL,
	"status" "parent_link_status" DEFAULT 'pending' NOT NULL,
	"approved_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"responded_at" timestamp
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "parent_student_links" ADD CONSTRAINT "parent_student_links_parent_id_users_id_fk"
    FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "parent_student_links" ADD CONSTRAINT "parent_student_links_student_id_users_id_fk"
    FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "parent_student_links" ADD CONSTRAINT "parent_student_links_institution_id_institution_settings_id_fk"
    FOREIGN KEY ("institution_id") REFERENCES "public"."institution_settings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "parent_student_links" ADD CONSTRAINT "parent_student_links_approved_by_users_id_fk"
    FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_parent_links_parent" ON "parent_student_links" USING btree ("parent_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_parent_links_student" ON "parent_student_links" USING btree ("student_id");
