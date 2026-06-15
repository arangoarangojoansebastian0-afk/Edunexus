CREATE TABLE "observations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" varchar NOT NULL,
	"created_by" varchar NOT NULL,
	"type" varchar(50) NOT NULL,
	"description" text NOT NULL,
	"commitment" text,
	"follow_up" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schedules" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" varchar NOT NULL,
	"subject_id" varchar NOT NULL,
	"teacher_id" varchar NOT NULL,
	"day" varchar(20) NOT NULL,
	"start_time" varchar(10) NOT NULL,
	"end_time" varchar(10) NOT NULL,
	"room" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teacher_assignments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"teacher_id" varchar NOT NULL,
	"subject_id" varchar NOT NULL,
	"group_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "observations" ADD CONSTRAINT "observations_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observations" ADD CONSTRAINT "observations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_group_id_academic_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."academic_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_group_id_academic_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."academic_groups"("id") ON DELETE cascade ON UPDATE no action;