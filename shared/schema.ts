import { sql, relations } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  jsonb,
  index,
  pgEnum,
  time,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum("user_role", [
  "student", 
  "teacher", 
  "director", 
  "coordinator", 
  "secretary", 
  "admin"
]);
export const groupTypeEnum = pgEnum("group_type", ["course", "club"]);
export const fileVisibilityEnum = pgEnum("file_visibility", ["public", "group", "private"]);
export const reportStatusEnum = pgEnum("report_status", ["pending", "reviewed", "resolved", "dismissed"]);
export const reportTargetTypeEnum = pgEnum("report_target_type", ["post", "comment", "file", "user"]);

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  passwordHash: varchar("password_hash"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").default("student").notNull(),
  grade: varchar("grade"),
  interests: text("interests").array().default(sql`ARRAY[]::text[]`),
  bio: text("bio"),
  verified: boolean("verified").default(false).notNull(),
  blocked: boolean("blocked").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Groups table (courses and clubs)
export const groups = pgTable("groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: groupTypeEnum("type").notNull(),
  grade: varchar("grade"),
  coverImageUrl: varchar("cover_image_url"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Group memberships
export const groupMembers = pgTable(
  "group_members",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    groupId: varchar("group_id").references(() => groups.id, { onDelete: "cascade" }).notNull(),
    userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    role: varchar("role", { length: 50 }).default("member").notNull(),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_group_members_group").on(table.groupId),
    index("idx_group_members_user").on(table.userId),
  ]
);

// Posts table
export const posts = pgTable(
  "posts",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    authorId: varchar("author_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    groupId: varchar("group_id").references(() => groups.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    media: text("media").array().default(sql`ARRAY[]::text[]`),
    pinned: boolean("pinned").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_posts_author").on(table.authorId),
    index("idx_posts_group").on(table.groupId),
    index("idx_posts_created").on(table.createdAt),
  ]
);

// Comments table
export const comments = pgTable(
  "comments",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    postId: varchar("post_id").references(() => posts.id, { onDelete: "cascade" }).notNull(),
    authorId: varchar("author_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_comments_post").on(table.postId),
    index("idx_comments_author").on(table.authorId),
  ]
);

// Reactions table (likes)
export const reactions = pgTable(
  "reactions",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    postId: varchar("post_id").references(() => posts.id, { onDelete: "cascade" }).notNull(),
    userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    type: varchar("type", { length: 50 }).default("like").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_reactions_post").on(table.postId),
    index("idx_reactions_user").on(table.userId),
  ]
);

// Files table (library)
export const files = pgTable(
  "files",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    uploaderId: varchar("uploader_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    fileUrl: varchar("file_url").notNull(),
    storageKey: varchar("storage_key").notNull(),
    fileType: varchar("file_type", { length: 50 }).notNull(),
    fileSize: integer("file_size").notNull(),
    subject: varchar("subject", { length: 100 }),
    description: text("description"),
    visibility: fileVisibilityEnum("visibility").default("public").notNull(),
    groupId: varchar("group_id").references(() => groups.id, { onDelete: "set null" }),
    downloadCount: integer("download_count").default(0).notNull(),
    approved: boolean("approved").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_files_uploader").on(table.uploaderId),
    index("idx_files_subject").on(table.subject),
    index("idx_files_group").on(table.groupId),
  ]
);

// Events/Asesorias table (tutoring sessions)
export const events = pgTable(
  "events",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    hostId: varchar("host_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    subject: varchar("subject", { length: 100 }),
    startTime: timestamp("start_time").notNull(),
    endTime: timestamp("end_time").notNull(),
    locationUrl: varchar("location_url"),
    imageUrl: varchar("image_url"),
    maxParticipants: integer("max_participants"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_events_host").on(table.hostId),
    index("idx_events_start").on(table.startTime),
    index("idx_events_subject").on(table.subject),
  ]
);

// Event participants (bookings)
export const eventParticipants = pgTable(
  "event_participants",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    eventId: varchar("event_id").references(() => events.id, { onDelete: "cascade" }).notNull(),
    userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    status: varchar("status", { length: 50 }).default("confirmed").notNull(),
    bookedAt: timestamp("booked_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_event_participants_event").on(table.eventId),
    index("idx_event_participants_user").on(table.userId),
  ]
);

// Reports table (moderation)
export const reports = pgTable(
  "reports",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    reporterId: varchar("reporter_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    targetType: reportTargetTypeEnum("target_type").notNull(),
    targetId: varchar("target_id").notNull(),
    reason: text("reason").notNull(),
    status: reportStatusEnum("status").default("pending").notNull(),
    reviewedBy: varchar("reviewed_by").references(() => users.id),
    reviewNotes: text("review_notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    resolvedAt: timestamp("resolved_at"),
  },
  (table) => [
    index("idx_reports_reporter").on(table.reporterId),
    index("idx_reports_status").on(table.status),
    index("idx_reports_target").on(table.targetType, table.targetId),
  ]
);

// Chat messages table
export const messages = pgTable(
  "messages",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    groupId: varchar("group_id").references(() => groups.id, { onDelete: "cascade" }).notNull(),
    senderId: varchar("sender_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    content: text("content").notNull(),
    mediaUrl: varchar("media_url"),
    mediaType: varchar("media_type"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_messages_group").on(table.groupId),
    index("idx_messages_sender").on(table.senderId),
    index("idx_messages_created").on(table.createdAt),
  ]
);

// Q&A Questions table
export const questions = pgTable(
  "questions",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    groupId: varchar("group_id").references(() => groups.id, { onDelete: "cascade" }).notNull(),
    authorId: varchar("author_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    content: text("content").notNull(),
    votes: integer("votes").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_questions_group").on(table.groupId),
    index("idx_questions_author").on(table.authorId),
  ]
);

// Q&A Answers table
export const answers = pgTable(
  "answers",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    questionId: varchar("question_id").references(() => questions.id, { onDelete: "cascade" }).notNull(),
    authorId: varchar("author_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    content: text("content").notNull(),
    votes: integer("votes").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_answers_question").on(table.questionId),
    index("idx_answers_author").on(table.authorId),
  ]
);

// Question/Answer votes
export const qaVotes = pgTable(
  "qa_votes",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    questionId: varchar("question_id").references(() => questions.id, { onDelete: "cascade" }),
    answerId: varchar("answer_id").references(() => answers.id, { onDelete: "cascade" }),
    voteType: varchar("vote_type", { length: 50 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_qa_votes_user").on(table.userId),
    index("idx_qa_votes_question").on(table.questionId),
    index("idx_qa_votes_answer").on(table.answerId),
  ]
);

// Badges table
export const badges = pgTable("badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  iconUrl: varchar("icon_url"),
  color: varchar("color", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User badges (earned badges)
export const userBadges = pgTable(
  "user_badges",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    badgeId: varchar("badge_id").references(() => badges.id, { onDelete: "cascade" }).notNull(),
    earnedAt: timestamp("earned_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_user_badges_user").on(table.userId),
    index("idx_user_badges_badge").on(table.badgeId),
  ]
);

// Notification preferences
export const notificationPreferences = pgTable(
  "notification_preferences",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
    emailNewPost: boolean("email_new_post").default(true).notNull(),
    emailNewAnswer: boolean("email_new_answer").default(true).notNull(),
    emailNewComment: boolean("email_new_comment").default(true).notNull(),
    emailNewMessage: boolean("email_new_message").default(true).notNull(),
    pushEnabled: boolean("push_enabled").default(false).notNull(),
    pushNewPost: boolean("push_new_post").default(false).notNull(),
    pushNewAnswer: boolean("push_new_answer").default(false).notNull(),
    pushNewMessage: boolean("push_new_message").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("idx_notif_prefs_user").on(table.userId)]
);

// Notifications history
export const notifications = pgTable(
  "notifications",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    type: varchar("type", { length: 50 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),
    relatedId: varchar("related_id"),
    read: boolean("read").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_notifications_user").on(table.userId),
    index("idx_notifications_read").on(table.read),
  ]
);

// Recognition/Shoutouts table
export const recognitions = pgTable(
  "recognitions",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    createdBy: varchar("created_by").references(() => users.id, { onDelete: "cascade" }).notNull(),
    recipientId: varchar("recipient_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    content: text("content").notNull(),
    imageUrl: varchar("image_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_recognitions_created").on(table.createdBy),
    index("idx_recognitions_recipient").on(table.recipientId),
  ]
);

// ====== CORREGIDO & NUEVAS TABLAS ADMIN CORRESPONDIENTES A SUPABASE ======

export const institutionSettings = pgTable("institution_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  institutionName: varchar("institution_name", { length: 255 }),
  logoUrl: text("logo_url"),
  evaluationType: varchar("evaluation_type", { length: 20 }),
  passingGrade: varchar("passing_grade"),
  academicYear: integer("academic_year"),
  bannerUrl: text("banner_url"),
  primaryColor: varchar("primary_color", { length: 50 }),
  secondaryColor: varchar("secondary_color", { length: 50 }),
  description: text("description"),
  institutionCode: varchar("institution_code", { length: 50 }),
  gradeScale: varchar("grade_scale", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const subjects = pgTable("subjects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").unique().notNull(),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const grades = pgTable("grades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 50 }).notNull(),
  level: integer("level").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  institution_id: integer("institution_id")
    .notNull()
    .references(() => institutionSettings.id, { onDelete: "cascade" }),
});

export const academicGroups = pgTable("academic_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  gradeId: varchar("grade_id").references(() => grades.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 20 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const teacherCodes = pgTable("teacher_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teacherId: varchar("teacher_id").references(() => users.id),
  code: varchar("code", { length: 50 }).unique().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const staffCodes = pgTable("staff_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  code: varchar("code", { length: 50 }).unique().notNull(),
  role: varchar("role", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const academicYears = pgTable("academic_years", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  year: integer("year").notNull().unique(),
  isActive: boolean("is_active").default(false),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
});

export const academicPeriods = pgTable("academic_periods", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  academicYearId: varchar("academic_year_id").references(() => academicYears.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 50 }).notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").default(false),
});

export const studentEnrollments = pgTable("student_enrollments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  groupId: varchar("group_id").references(() => academicGroups.id, { onDelete: "cascade" }).notNull(),
  academicYearId: varchar("academic_year_id").references(() => academicYears.id).notNull(),
  studentCode: varchar("student_code", { length: 50 }).unique(),
  status: varchar("status", { length: 50 }).default("enrolled").notNull(), 
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_enrollment_student").on(table.studentId),
  index("idx_enrollment_group").on(table.groupId),
  index("idx_enrollment_year").on(table.academicYearId),
]);

export const classSchedules = pgTable("class_schedules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").references(() => academicGroups.id, { onDelete: "cascade" }).notNull(),
  subjectId: varchar("subject_id").references(() => subjects.id, { onDelete: "cascade" }).notNull(),
  teacherId: varchar("teacher_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  dayOfWeek: integer("day_of_week").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  room: varchar("room", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const studentObservations = pgTable("student_observations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  teacherId: varchar("teacher_id").references(() => users.id).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  severity: varchar("severity", { length: 20 }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const teachingAssignments = pgTable("teaching_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teacherId: varchar("teacher_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  subjectId: varchar("subject_id").references(() => subjects.id, { onDelete: "cascade" }).notNull(),
  groupId: varchar("group_id").references(() => academicGroups.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ====== CLASSROOM MODULE ======
export const courses = pgTable(
  "courses",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    subject: varchar("subject", { length: 100 }).notNull(),
    teacherId: varchar("teacher_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    grade: varchar("grade", { length: 50 }),
    semester: varchar("semester", { length: 50 }),
    academicYear: varchar("academic_year", { length: 20 }),
    coverImageUrl: varchar("cover_image_url"),
    groupId: varchar("group_id").references(() => groups.id, { onDelete: "set null" }),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_courses_teacher").on(table.teacherId),
    index("idx_courses_active").on(table.isActive),
  ]
);

export const courseEnrollments = pgTable(
  "course_enrollments",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    courseId: varchar("course_id").references(() => courses.id, { onDelete: "cascade" }).notNull(),
    studentId: varchar("student_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
    status: varchar("status", { length: 50 }).default("active").notNull(),
  },
  (table) => [
    index("idx_enrollments_course").on(table.courseId),
    index("idx_enrollments_student").on(table.studentId),
  ]
);

export const activities = pgTable(
  "activities",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    courseId: varchar("course_id").references(() => courses.id, { onDelete: "cascade" }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    type: varchar("type", { length: 50 }).notNull(),
    dueDate: timestamp("due_date"),
    maxScore: integer("max_score").default(100).notNull(),
    attachments: text("attachments").array().default(sql`ARRAY[]::text[]`),
    isPublished: boolean("is_published").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("idx_activities_course").on(table.courseId)]
);

export const submissions = pgTable(
  "submissions",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    activityId: varchar("activity_id").references(() => activities.id, { onDelete: "cascade" }).notNull(),
    studentId: varchar("student_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    content: text("content"),
    attachments: text("attachments").array().default(sql`ARRAY[]::text[]`),
    submittedAt: timestamp("submitted_at").defaultNow().notNull(),
    grade: integer("grade"),
    feedback: text("feedback"),
    gradedAt: timestamp("graded_at"),
    gradedBy: varchar("graded_by").references(() => users.id),
    status: varchar("status", { length: 50 }).default("submitted").notNull(),
  },
  (table) => [
    index("idx_submissions_activity").on(table.activityId),
    index("idx_submissions_student").on(table.studentId),
  ]
);

export const attendance = pgTable(
  "attendance",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    courseId: varchar("course_id").references(() => courses.id, { onDelete: "cascade" }).notNull(),
    studentId: varchar("student_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    date: timestamp("date").notNull(),
    status: varchar("status", { length: 50 }).notNull(),
    notes: text("notes"),
    recordedBy: varchar("recorded_by").references(() => users.id).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_attendance_course").on(table.courseId),
    index("idx_attendance_student").on(table.studentId),
    index("idx_attendance_date").on(table.date),
  ]
);

// Relations definitions
export const recognitionsRelations = relations(recognitions, ({ one }) => ({
  createdBy: one(users, { fields: [recognitions.createdBy], references: [users.id], relationName: "createdBy" }),
  recipient: one(users, { fields: [recognitions.recipientId], references: [users.id], relationName: "recipient" }),
}));

export const enrollmentsRelations = relations(studentEnrollments, ({ one }) => ({
  student: one(users, { fields: [studentEnrollments.studentId], references: [users.id] }),
  group: one(academicGroups, { fields: [studentEnrollments.groupId], references: [academicGroups.id] }),
  academicYear: one(academicYears, { fields: [studentEnrollments.academicYearId], references: [academicYears.id] }),
}));

export const teacherCodesRelations = relations(teacherCodes, ({ one }) => ({
  user: one(users, { fields: [teacherCodes.teacherId], references: [users.id] }),
}));

export const staffCodesRelations = relations(staffCodes, ({ one }) => ({
  user: one(users, { fields: [staffCodes.userId], references: [users.id] }),
}));

export const gradesRelations = relations(grades, ({ many }) => ({
  academicGroups: many(academicGroups),
}));

export const academicGroupsRelations = relations(academicGroups, ({ one }) => ({
  grade: one(grades, { fields: [academicGroups.gradeId], references: [grades.id] }),
}));

export const subjectsRelations = relations(subjects, ({ many }) => ({
  courses: many(courses), 
}));

export const usersRelations = relations(users, ({ many, one }) => ({
  posts: many(posts),
  comments: many(comments),
  reactions: many(reactions),
  files: many(files),
  hostedEvents: many(events),
  eventParticipations: many(eventParticipants),
  groupMemberships: many(groupMembers),
  messages: many(messages),
  reports: many(reports),
  userBadges: many(userBadges),
  questions: many(questions),
  answers: many(answers),
  qaVotes: many(qaVotes),
  notificationPreferences: one(notificationPreferences, { fields: [users.id], references: [notificationPreferences.userId] }),
  notifications: many(notifications),
  recognitionsCreated: many(recognitions, { relationName: "createdBy" }),
  recognitionsReceived: many(recognitions, { relationName: "recipient" }),
}));

export const groupsRelations = relations(groups, ({ one, many }) => ({
  creator: one(users, { fields: [groups.createdBy], references: [users.id] }),
  members: many(groupMembers),
  posts: many(posts),
  files: many(files),
  messages: many(messages),
  questions: many(questions),
}));

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  group: one(groups, { fields: [groupMembers.groupId], references: [groups.id] }),
  user: one(users, { fields: [groupMembers.userId], references: [users.id] }),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, { fields: [posts.authorId], references: [users.id] }),
  group: one(groups, { fields: [posts.groupId], references: [groups.id] }),
  comments: many(comments),
  reactions: many(reactions),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, { fields: [comments.postId], references: [posts.id] }),
  author: one(users, { fields: [comments.authorId], references: [users.id] }),
}));

export const reactionsRelations = relations(reactions, ({ one }) => ({
  post: one(posts, { fields: [reactions.postId], references: [posts.id] }),
  user: one(users, { fields: [reactions.userId], references: [users.id] }),
}));

export const filesRelations = relations(files, ({ one }) => ({
  uploader: one(users, { fields: [files.uploaderId], references: [users.id] }),
  group: one(groups, { fields: [files.groupId], references: [groups.id] }),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  host: one(users, { fields: [events.hostId], references: [users.id] }),
  participants: many(eventParticipants),
}));

export const eventParticipantsRelations = relations(eventParticipants, ({ one }) => ({
  event: one(events, { fields: [eventParticipants.eventId], references: [events.id] }),
  user: one(users, { fields: [eventParticipants.userId], references: [users.id] }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  reporter: one(users, { fields: [reports.reporterId], references: [users.id] }),
  reviewer: one(users, { fields: [reports.reviewedBy], references: [users.id] }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  group: one(groups, { fields: [messages.groupId], references: [groups.id] }),
  sender: one(users, { fields: [messages.senderId], references: [users.id] }),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  group: one(groups, { fields: [questions.groupId], references: [groups.id] }),
  author: one(users, { fields: [questions.authorId], references: [users.id] }),
  answers: many(answers),
  votes: many(qaVotes),
}));

export const answersRelations = relations(answers, ({ one, many }) => ({
  question: one(questions, { fields: [answers.questionId], references: [questions.id] }),
  author: one(users, { fields: [answers.authorId], references: [users.id] }),
  votes: many(qaVotes),
}));

export const qaVotesRelations = relations(qaVotes, ({ one }) => ({
  user: one(users, { fields: [qaVotes.userId], references: [users.id] }),
  question: one(questions, { fields: [qaVotes.questionId], references: [questions.id] }),
  answer: one(answers, { fields: [qaVotes.answerId], references: [answers.id] }),
}));

export const badgesRelations = relations(badges, ({ many }) => ({
  userBadges: many(userBadges),
}));

export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  user: one(users, { fields: [userBadges.userId], references: [users.id] }),
  badge: one(badges, { fields: [userBadges.badgeId], references: [badges.id] }),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  teacher: one(users, { fields: [courses.teacherId], references: [users.id] }),
  group: one(groups, { fields: [courses.groupId], references: [groups.id] }),
  enrollments: many(courseEnrollments),
  activities: many(activities),
  attendanceRecords: many(attendance),
}));

export const courseEnrollmentsRelations = relations(courseEnrollments, ({ one }) => ({
  course: one(courses, { fields: [courseEnrollments.courseId], references: [courses.id] }),
  student: one(users, { fields: [courseEnrollments.studentId], references: [users.id] }),
}));

export const activitiesRelations = relations(activities, ({ one, many }) => ({
  course: one(courses, { fields: [activities.courseId], references: [courses.id] }),
  submissions: many(submissions),
}));

export const submissionsRelations = relations(submissions, ({ one }) => ({
  activity: one(activities, { fields: [submissions.activityId], references: [activities.id] }),
  student: one(users, { fields: [submissions.studentId], references: [users.id] }),
  gradedByUser: one(users, { fields: [submissions.gradedBy], references: [users.id] }),
}));

export const attendanceRelations = relations(attendance, ({ one }) => ({
  course: one(courses, { fields: [attendance.courseId], references: [courses.id] }),
  student: one(users, { fields: [attendance.studentId], references: [users.id] }),
  recorder: one(users, { fields: [attendance.recordedBy], references: [users.id] }),
}));

// Insert schemas
export const insertAcademicYearSchema = createInsertSchema(academicYears).omit({ id: true });
export const insertAcademicPeriodSchema = createInsertSchema(academicPeriods).omit({ id: true });
export const insertStudentEnrollmentSchema = createInsertSchema(studentEnrollments).omit({ id: true, createdAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertGroupSchema = createInsertSchema(groups).omit({ id: true, createdAt: true, updatedAt: true });
export const insertGroupMemberSchema = createInsertSchema(groupMembers).omit({ id: true, joinedAt: true });
export const insertPostSchema = createInsertSchema(posts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCommentSchema = createInsertSchema(comments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertReactionSchema = createInsertSchema(reactions).omit({ id: true, createdAt: true });
export const insertFileSchema = createInsertSchema(files).omit({ id: true, createdAt: true, downloadCount: true });
export const insertEventSchema = createInsertSchema(events).omit({ id: true, createdAt: true, updatedAt: true }).extend({ startTime: z.coerce.date(), endTime: z.coerce.date() });
export const insertEventParticipantSchema = createInsertSchema(eventParticipants).omit({ id: true, bookedAt: true });
export const insertReportSchema = createInsertSchema(reports).omit({ id: true, createdAt: true, resolvedAt: true, reviewedBy: true, reviewNotes: true, status: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export const insertQuestionSchema = createInsertSchema(questions).omit({ id: true, votes: true, createdAt: true });
export const insertAnswerSchema = createInsertSchema(answers).omit({ id: true, votes: true, createdAt: true });
export const insertQaVoteSchema = createInsertSchema(qaVotes).omit({ id: true, createdAt: true });
export const insertBadgeSchema = createInsertSchema(badges).omit({ id: true, createdAt: true });
export const insertUserBadgeSchema = createInsertSchema(userBadges).omit({ id: true, earnedAt: true });
export const insertNotificationPreferenceSchema = createInsertSchema(notificationPreferences).omit({ id: true, createdAt: true, updatedAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export const insertRecognitionSchema = createInsertSchema(recognitions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSubjectSchema = createInsertSchema(subjects).omit({ id: true, createdAt: true });
export const insertGradeSchema = createInsertSchema(grades).omit({ id: true, createdAt: true });
export const insertAcademicGroupSchema = createInsertSchema(academicGroups).omit({ id: true, createdAt: true });
export const insertInstitutionSettingsSchema = createInsertSchema(institutionSettings).omit({ id: true, createdAt: true });
export const insertClassScheduleSchema = createInsertSchema(classSchedules).omit({ id: true, createdAt: true });
export const insertStudentObservationSchema = createInsertSchema(studentObservations).omit({ id: true, createdAt: true });
export const insertTeachingAssignmentSchema = createInsertSchema(teachingAssignments).omit({ id: true, createdAt: true });
export const insertCourseSchema = createInsertSchema(courses).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCourseEnrollmentSchema = createInsertSchema(courseEnrollments).omit({ id: true, enrolledAt: true });
export const insertActivitySchema = createInsertSchema(activities, { dueDate: z.string().transform(val => val ? new Date(val) : null).optional().nullable() }).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSubmissionSchema = createInsertSchema(submissions).omit({ id: true, submittedAt: true, grade: true, feedback: true, gradedAt: true, gradedBy: true });
export const insertAttendanceSchema = createInsertSchema(attendance).omit({ id: true, createdAt: true });

// Types
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Group = typeof groups.$inferSelect;
export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type GroupMember = typeof groupMembers.$inferSelect;
export type InsertGroupMember = z.infer<typeof insertGroupMemberSchema>;
export type Post = typeof posts.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Reaction = typeof reactions.$inferSelect;
export type InsertReaction = z.infer<typeof insertReactionSchema>;
export type File = typeof files.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type EventParticipant = typeof eventParticipants.$inferSelect;
export type InsertEventParticipant = z.infer<typeof insertEventParticipantSchema>;
export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Answer = typeof answers.$inferSelect;
export type InsertAnswer = z.infer<typeof insertAnswerSchema>;
export type QaVote = typeof qaVotes.$inferSelect;
export type InsertQaVote = z.infer<typeof insertQaVoteSchema>;
export type Badge = typeof badges.$inferSelect;
export type InsertBadge = z.infer<typeof insertBadgeSchema>;
export type UserBadge = typeof userBadges.$inferSelect;
export type InsertUserBadge = z.infer<typeof insertUserBadgeSchema>;
export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = z.infer<typeof insertNotificationPreferenceSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Recognition = typeof recognitions.$inferSelect;
export type InsertRecognition = z.infer<typeof insertRecognitionSchema>;
export type InstitutionSettings = typeof institutionSettings.$inferSelect;
export type InsertInstitutionSettings = z.infer<typeof insertInstitutionSettingsSchema>;
export type ClassSchedule = typeof classSchedules.$inferSelect;
export type StudentObservation = typeof studentObservations.$inferSelect;
export type TeachingAssignment = typeof teachingAssignments.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type CourseEnrollment = typeof courseEnrollments.$inferSelect;
export type InsertCourseEnrollment = z.infer<typeof insertCourseEnrollmentSchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Submission = typeof submissions.$inferSelect;
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;

// Extended types with relations
export type PostWithAuthor = Post & { author: User; comments?: CommentWithAuthor[]; reactions?: Reaction[]; _count?: { comments: number; reactions: number } };
export type CommentWithAuthor = Comment & { author: User };
export type GroupWithMembers = Group & { members?: GroupMember[]; _count?: { members: number; posts: number } };
export type FileWithUploader = File & { uploader: User };
export type EventWithHost = Event & { host: User; participants?: EventParticipant[]; _count?: { participants: number } };
export type MessageWithSender = Message & { sender: User };
export type UserWithBadges = User & { userBadges?: (UserBadge & { badge: Badge })[] };
export type QuestionWithAnswers = Question & { author: User; answers: (Answer & { author: User })[]; _count?: { answers: number } };
export type RecognitionWithUsers = Recognition & { createdBy: User; recipient: User };
export type CourseWithTeacher = Course & { teacher: User; _count?: { students: number; activities: number } };
export type ActivityWithSubmission = Activity & { mySubmission?: Submission; _count?: { submissions: number } };
export type SubmissionWithStudent = Submission & { student: User };
export type AttendanceWithStudent = Attendance & { student: User };