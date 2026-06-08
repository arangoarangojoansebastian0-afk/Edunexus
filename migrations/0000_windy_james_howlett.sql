CREATE TYPE "public"."file_visibility" AS ENUM('public', 'group', 'private');--> statement-breakpoint
CREATE TYPE "public"."group_type" AS ENUM('course', 'club');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('pending', 'reviewed', 'resolved', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."report_target_type" AS ENUM('post', 'comment', 'file', 'user');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('student', 'teacher', 'director', 'coordinator', 'secretary', 'admin');--> statement-breakpoint
CREATE TABLE "academic_groups" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"grade_id" varchar,
	"name" varchar(20) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "academic_periods" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"academic_year_id" varchar NOT NULL,
	"name" varchar(50) NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"is_active" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "academic_years" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"year" integer NOT NULL,
	"is_active" boolean DEFAULT false,
	"start_date" timestamp,
	"end_date" timestamp,
	CONSTRAINT "academic_years_year_unique" UNIQUE("year")
);
--> statement-breakpoint
CREATE TABLE "activities" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" varchar NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"type" varchar(50) NOT NULL,
	"due_date" timestamp,
	"max_score" integer DEFAULT 100 NOT NULL,
	"attachments" text[] DEFAULT ARRAY[]::text[],
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "answers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" varchar NOT NULL,
	"author_id" varchar NOT NULL,
	"content" text NOT NULL,
	"votes" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" varchar NOT NULL,
	"student_id" varchar NOT NULL,
	"date" timestamp NOT NULL,
	"status" varchar(50) NOT NULL,
	"notes" text,
	"recorded_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "badges" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"icon_url" varchar,
	"color" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" varchar NOT NULL,
	"author_id" varchar NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_enrollments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" varchar NOT NULL,
	"student_id" varchar NOT NULL,
	"enrolled_at" timestamp DEFAULT now() NOT NULL,
	"status" varchar(50) DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"subject" varchar(100) NOT NULL,
	"teacher_id" varchar NOT NULL,
	"grade" varchar(50),
	"semester" varchar(50),
	"academic_year" varchar(20),
	"cover_image_url" varchar,
	"group_id" varchar,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_participants" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"status" varchar(50) DEFAULT 'confirmed' NOT NULL,
	"booked_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"host_id" varchar NOT NULL,
	"subject" varchar(100),
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"location_url" varchar,
	"image_url" varchar,
	"max_participants" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "files" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"uploader_id" varchar NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_url" varchar NOT NULL,
	"storage_key" varchar NOT NULL,
	"file_type" varchar(50) NOT NULL,
	"file_size" integer NOT NULL,
	"subject" varchar(100),
	"description" text,
	"visibility" "file_visibility" DEFAULT 'public' NOT NULL,
	"group_id" varchar,
	"download_count" integer DEFAULT 0 NOT NULL,
	"approved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grades" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(50) NOT NULL,
	"level" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_members" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"role" varchar(50) DEFAULT 'member' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"type" "group_type" NOT NULL,
	"grade" varchar,
	"cover_image_url" varchar,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "institution_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_name" varchar(255),
	"logo_url" text,
	"evaluation_type" varchar(20),
	"passing_grade" varchar,
	"academic_year" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" varchar NOT NULL,
	"sender_id" varchar NOT NULL,
	"content" text NOT NULL,
	"media_url" varchar,
	"media_type" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"email_new_post" boolean DEFAULT true NOT NULL,
	"email_new_answer" boolean DEFAULT true NOT NULL,
	"email_new_comment" boolean DEFAULT true NOT NULL,
	"email_new_message" boolean DEFAULT true NOT NULL,
	"push_enabled" boolean DEFAULT false NOT NULL,
	"push_new_post" boolean DEFAULT false NOT NULL,
	"push_new_answer" boolean DEFAULT false NOT NULL,
	"push_new_message" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "notification_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"related_id" varchar,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author_id" varchar NOT NULL,
	"group_id" varchar,
	"content" text NOT NULL,
	"media" text[] DEFAULT ARRAY[]::text[],
	"pinned" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "qa_votes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"question_id" varchar,
	"answer_id" varchar,
	"vote_type" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" varchar NOT NULL,
	"author_id" varchar NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"votes" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"type" varchar(50) DEFAULT 'like' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recognitions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_by" varchar NOT NULL,
	"recipient_id" varchar NOT NULL,
	"content" text NOT NULL,
	"image_url" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporter_id" varchar NOT NULL,
	"target_type" "report_target_type" NOT NULL,
	"target_id" varchar NOT NULL,
	"reason" text NOT NULL,
	"status" "report_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by" varchar,
	"review_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_codes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"code" varchar(50) NOT NULL,
	"role" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "staff_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "student_enrollments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" varchar NOT NULL,
	"group_id" varchar NOT NULL,
	"academic_year_id" varchar NOT NULL,
	"student_code" varchar(50),
	"status" varchar(50) DEFAULT 'enrolled' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "student_enrollments_student_code_unique" UNIQUE("student_code")
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color" text,
	"active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subjects_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activity_id" varchar NOT NULL,
	"student_id" varchar NOT NULL,
	"content" text,
	"attachments" text[] DEFAULT ARRAY[]::text[],
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"grade" integer,
	"feedback" text,
	"graded_at" timestamp,
	"graded_by" varchar,
	"status" varchar(50) DEFAULT 'submitted' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teacher_codes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"teacher_id" varchar,
	"code" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "teacher_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "user_badges" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"badge_id" varchar NOT NULL,
	"earned_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar NOT NULL,
	"password_hash" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"role" "user_role" DEFAULT 'student' NOT NULL,
	"grade" varchar,
	"interests" text[] DEFAULT ARRAY[]::text[],
	"bio" text,
	"verified" boolean DEFAULT false NOT NULL,
	"blocked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "academic_groups" ADD CONSTRAINT "academic_groups_grade_id_grades_id_fk" FOREIGN KEY ("grade_id") REFERENCES "public"."grades"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_periods" ADD CONSTRAINT "academic_periods_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "answers" ADD CONSTRAINT "answers_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "answers" ADD CONSTRAINT "answers_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_participants" ADD CONSTRAINT "event_participants_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_participants" ADD CONSTRAINT "event_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_host_id_users_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_uploader_id_users_id_fk" FOREIGN KEY ("uploader_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qa_votes" ADD CONSTRAINT "qa_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qa_votes" ADD CONSTRAINT "qa_votes_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qa_votes" ADD CONSTRAINT "qa_votes_answer_id_answers_id_fk" FOREIGN KEY ("answer_id") REFERENCES "public"."answers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recognitions" ADD CONSTRAINT "recognitions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recognitions" ADD CONSTRAINT "recognitions_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_codes" ADD CONSTRAINT "staff_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_enrollments" ADD CONSTRAINT "student_enrollments_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_enrollments" ADD CONSTRAINT "student_enrollments_group_id_academic_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."academic_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_enrollments" ADD CONSTRAINT "student_enrollments_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_graded_by_users_id_fk" FOREIGN KEY ("graded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_codes" ADD CONSTRAINT "teacher_codes_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badge_id_badges_id_fk" FOREIGN KEY ("badge_id") REFERENCES "public"."badges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_activities_course" ON "activities" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "idx_answers_question" ON "answers" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "idx_answers_author" ON "answers" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "idx_attendance_course" ON "attendance" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "idx_attendance_student" ON "attendance" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_attendance_date" ON "attendance" USING btree ("date");--> statement-breakpoint
CREATE INDEX "idx_comments_post" ON "comments" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "idx_comments_author" ON "comments" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "idx_enrollments_course" ON "course_enrollments" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "idx_enrollments_student" ON "course_enrollments" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_courses_teacher" ON "courses" USING btree ("teacher_id");--> statement-breakpoint
CREATE INDEX "idx_courses_active" ON "courses" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_event_participants_event" ON "event_participants" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "idx_event_participants_user" ON "event_participants" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_events_host" ON "events" USING btree ("host_id");--> statement-breakpoint
CREATE INDEX "idx_events_start" ON "events" USING btree ("start_time");--> statement-breakpoint
CREATE INDEX "idx_events_subject" ON "events" USING btree ("subject");--> statement-breakpoint
CREATE INDEX "idx_files_uploader" ON "files" USING btree ("uploader_id");--> statement-breakpoint
CREATE INDEX "idx_files_subject" ON "files" USING btree ("subject");--> statement-breakpoint
CREATE INDEX "idx_files_group" ON "files" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "idx_group_members_group" ON "group_members" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "idx_group_members_user" ON "group_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_messages_group" ON "messages" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "idx_messages_sender" ON "messages" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "idx_messages_created" ON "messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_notif_prefs_user" ON "notification_preferences" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_user" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_read" ON "notifications" USING btree ("read");--> statement-breakpoint
CREATE INDEX "idx_posts_author" ON "posts" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "idx_posts_group" ON "posts" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "idx_posts_created" ON "posts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_qa_votes_user" ON "qa_votes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_qa_votes_question" ON "qa_votes" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "idx_qa_votes_answer" ON "qa_votes" USING btree ("answer_id");--> statement-breakpoint
CREATE INDEX "idx_questions_group" ON "questions" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "idx_questions_author" ON "questions" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "idx_reactions_post" ON "reactions" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "idx_reactions_user" ON "reactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_recognitions_created" ON "recognitions" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_recognitions_recipient" ON "recognitions" USING btree ("recipient_id");--> statement-breakpoint
CREATE INDEX "idx_reports_reporter" ON "reports" USING btree ("reporter_id");--> statement-breakpoint
CREATE INDEX "idx_reports_status" ON "reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_reports_target" ON "reports" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");--> statement-breakpoint
CREATE INDEX "idx_enrollment_student" ON "student_enrollments" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_enrollment_group" ON "student_enrollments" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "idx_enrollment_year" ON "student_enrollments" USING btree ("academic_year_id");--> statement-breakpoint
CREATE INDEX "idx_submissions_activity" ON "submissions" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "idx_submissions_student" ON "submissions" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_user_badges_user" ON "user_badges" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_badges_badge" ON "user_badges" USING btree ("badge_id");