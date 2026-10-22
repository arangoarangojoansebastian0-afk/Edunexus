CREATE TABLE IF NOT EXISTS "student_promotion_reviews" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" uuid NOT NULL,
	"enrollment_id" varchar NOT NULL,
	"teacher_id" varchar NOT NULL,
	"recommendation" varchar(30) NOT NULL,
	"notes" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "student_promotion_reviews_recommendation_check" CHECK ("recommendation" IN ('promote', 'repeat', 'review')),
	CONSTRAINT "uq_promotion_review_enrollment_teacher" UNIQUE("enrollment_id", "teacher_id")
);
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "student_promotion_reviews" ADD CONSTRAINT "student_promotion_reviews_institution_id_institution_settings_id_fk"
		FOREIGN KEY ("institution_id") REFERENCES "public"."institution_settings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "student_promotion_reviews" ADD CONSTRAINT "student_promotion_reviews_enrollment_id_student_enrollments_id_fk"
		FOREIGN KEY ("enrollment_id") REFERENCES "public"."student_enrollments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "student_promotion_reviews" ADD CONSTRAINT "student_promotion_reviews_teacher_id_users_id_fk"
		FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_promotion_review_institution_enrollment" ON "student_promotion_reviews" USING btree ("institution_id", "enrollment_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_promotion_review_teacher" ON "student_promotion_reviews" USING btree ("teacher_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "student_promotion_decisions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" uuid NOT NULL,
	"enrollment_id" varchar NOT NULL,
	"decided_by" varchar NOT NULL,
	"outcome" varchar(30) NOT NULL,
	"target_enrollment_id" varchar,
	"notes" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "student_promotion_decisions_outcome_check" CHECK ("outcome" IN ('promote', 'repeat', 'defer'))
);
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "student_promotion_decisions" ADD CONSTRAINT "student_promotion_decisions_institution_id_institution_settings_id_fk"
		FOREIGN KEY ("institution_id") REFERENCES "public"."institution_settings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "student_promotion_decisions" ADD CONSTRAINT "student_promotion_decisions_enrollment_id_student_enrollments_id_fk"
		FOREIGN KEY ("enrollment_id") REFERENCES "public"."student_enrollments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "student_promotion_decisions" ADD CONSTRAINT "student_promotion_decisions_decided_by_users_id_fk"
		FOREIGN KEY ("decided_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "student_promotion_decisions" ADD CONSTRAINT "student_promotion_decisions_target_enrollment_id_student_enrollments_id_fk"
		FOREIGN KEY ("target_enrollment_id") REFERENCES "public"."student_enrollments"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_promotion_decision_institution_enrollment" ON "student_promotion_decisions" USING btree ("institution_id", "enrollment_id");
