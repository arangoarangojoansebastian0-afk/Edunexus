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
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum("user_role", ["student", "teacher", "admin"]);
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
    mediaUrl: varchar("media_url"), // URL to voice, image, or document
    mediaType: varchar("media_type"), // "voice", "image", "document"
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
    voteType: varchar("vote_type", { length: 50 }).notNull(), // "up" or "down"
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
    type: varchar("type", { length: 50 }).notNull(), // "post", "answer", "comment", "message"
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),
    relatedId: varchar("related_id"), // post_id, question_id, etc
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

// Recognition relations
export const recognitionsRelations = relations(recognitions, ({ one }) => ({
  createdBy: one(users, {
    fields: [recognitions.createdBy],
    references: [users.id],
  }),
  recipient: one(users, {
    fields: [recognitions.recipientId],
    references: [users.id],
  }),
}));

// Relations
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
  notificationPreferences: one(notificationPreferences, {
    fields: [users.id],
    references: [notificationPreferences.userId],
  }),
  notifications: many(notifications),
  recognitionsCreated: many(recognitions, { relationName: "createdBy" }),
  recognitionsReceived: many(recognitions, { relationName: "recipient" }),
}));

export const groupsRelations = relations(groups, ({ one, many }) => ({
  creator: one(users, {
    fields: [groups.createdBy],
    references: [users.id],
  }),
  members: many(groupMembers),
  posts: many(posts),
  files: many(files),
  messages: many(messages),
  questions: many(questions),
}));

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  group: one(groups, {
    fields: [groupMembers.groupId],
    references: [groups.id],
  }),
  user: one(users, {
    fields: [groupMembers.userId],
    references: [users.id],
  }),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  group: one(groups, {
    fields: [posts.groupId],
    references: [groups.id],
  }),
  comments: many(comments),
  reactions: many(reactions),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
}));

export const reactionsRelations = relations(reactions, ({ one }) => ({
  post: one(posts, {
    fields: [reactions.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [reactions.userId],
    references: [users.id],
  }),
}));

export const filesRelations = relations(files, ({ one }) => ({
  uploader: one(users, {
    fields: [files.uploaderId],
    references: [users.id],
  }),
  group: one(groups, {
    fields: [files.groupId],
    references: [groups.id],
  }),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  host: one(users, {
    fields: [events.hostId],
    references: [users.id],
  }),
  participants: many(eventParticipants),
}));

export const eventParticipantsRelations = relations(eventParticipants, ({ one }) => ({
  event: one(events, {
    fields: [eventParticipants.eventId],
    references: [events.id],
  }),
  user: one(users, {
    fields: [eventParticipants.userId],
    references: [users.id],
  }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  reporter: one(users, {
    fields: [reports.reporterId],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [reports.reviewedBy],
    references: [users.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  group: one(groups, {
    fields: [messages.groupId],
    references: [groups.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  group: one(groups, {
    fields: [questions.groupId],
    references: [groups.id],
  }),
  author: one(users, {
    fields: [questions.authorId],
    references: [users.id],
  }),
  answers: many(answers),
  votes: many(qaVotes),
}));

export const answersRelations = relations(answers, ({ one, many }) => ({
  question: one(questions, {
    fields: [answers.questionId],
    references: [questions.id],
  }),
  author: one(users, {
    fields: [answers.authorId],
    references: [users.id],
  }),
  votes: many(qaVotes),
}));

export const qaVotesRelations = relations(qaVotes, ({ one }) => ({
  user: one(users, {
    fields: [qaVotes.userId],
    references: [users.id],
  }),
  question: one(questions, {
    fields: [qaVotes.questionId],
    references: [questions.id],
  }),
  answer: one(answers, {
    fields: [qaVotes.answerId],
    references: [answers.id],
  }),
}));

export const badgesRelations = relations(badges, ({ many }) => ({
  userBadges: many(userBadges),
}));

export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  user: one(users, {
    fields: [userBadges.userId],
    references: [users.id],
  }),
  badge: one(badges, {
    fields: [userBadges.badgeId],
    references: [badges.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGroupSchema = createInsertSchema(groups).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGroupMemberSchema = createInsertSchema(groupMembers).omit({
  id: true,
  joinedAt: true,
});

export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReactionSchema = createInsertSchema(reactions).omit({
  id: true,
  createdAt: true,
});

export const insertFileSchema = createInsertSchema(files).omit({
  id: true,
  createdAt: true,
  downloadCount: true,
});

export const insertEventSchema = createInsertSchema(events)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
  });

export const insertEventParticipantSchema = createInsertSchema(eventParticipants).omit({
  id: true,
  bookedAt: true,
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
  resolvedAt: true,
  reviewedBy: true,
  reviewNotes: true,
  status: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
  votes: true,
  createdAt: true,
});

export const insertAnswerSchema = createInsertSchema(answers).omit({
  id: true,
  votes: true,
  createdAt: true,
});

export const insertQaVoteSchema = createInsertSchema(qaVotes).omit({
  id: true,
  createdAt: true,
});

export const insertBadgeSchema = createInsertSchema(badges).omit({
  id: true,
  createdAt: true,
});

export const insertUserBadgeSchema = createInsertSchema(userBadges).omit({
  id: true,
  earnedAt: true,
});

export const insertNotificationPreferenceSchema = createInsertSchema(notificationPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertRecognitionSchema = createInsertSchema(recognitions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

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

// Extended types with relations
export type PostWithAuthor = Post & {
  author: User;
  comments?: CommentWithAuthor[];
  reactions?: Reaction[];
  _count?: {
    comments: number;
    reactions: number;
  };
};

export type CommentWithAuthor = Comment & {
  author: User;
};

export type GroupWithMembers = Group & {
  members?: GroupMember[];
  _count?: {
    members: number;
    posts: number;
  };
};

export type FileWithUploader = File & {
  uploader: User;
};

export type EventWithHost = Event & {
  host: User;
  participants?: EventParticipant[];
  _count?: {
    participants: number;
  };
};

export type MessageWithSender = Message & {
  sender: User;
};

export type UserWithBadges = User & {
  userBadges?: (UserBadge & { badge: Badge })[];
};

export type QuestionWithAnswers = Question & {
  author: User;
  answers: (Answer & { author: User })[];
  _count?: {
    answers: number;
  };
};

export type RecognitionWithUsers = Recognition & {
  createdBy: User;
  recipient: User;
};
