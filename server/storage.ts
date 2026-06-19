import { db } from "./db";
import { eq, desc, and, sql, lt } from "drizzle-orm";
import { randomUUID } from "crypto";
import {
  institutionSettings,
  subjects,
  academicYears,
  academicPeriods,
  grades,
  academicGroups,
  studentEnrollments,
  teacherCodes,
  staffCodes,
  users,
  groups,
  groupMembers,
  posts,
  comments,
  reactions,
  files,
  events,
  eventParticipants,
  reports,
  messages,
  badges,
  userBadges,
  questions,
  answers,
  qaVotes,
  notifications,
  notificationPreferences,
  recognitions,
  courses,
  courseEnrollments,
  activities,
  submissions,
  attendance,
  classSchedules,
  studentObservations,
  teachingAssignments,
  type User,
  type UpsertUser,
  type InsertUser,
  type Group,
  type InsertGroup,
  type GroupMember,
  type InsertGroupMember,
  type Post,
  type InsertPost,
  type Comment,
  type InsertComment,
  type Reaction,
  type File,
  type InsertFile,
  type Event,
  type InsertEvent,
  type EventParticipant,
  type Report,
  type InsertReport,
  type Message,
  type InsertMessage,
  type PostWithAuthor,
  type GroupWithMembers,
  type FileWithUploader,
  type EventWithHost,
  type MessageWithSender,
  type Question,
  type InsertQuestion,
  type Answer,
  type InsertAnswer,
  type InsertQaVote,
  type QuestionWithAnswers,
  type NotificationPreference,
  type InsertNotificationPreference,
  type Notification,
  type InsertNotification,
  type Recognition,
  type InsertRecognition,
  type RecognitionWithUsers,
  type Course,
  type InsertCourse,
  type CourseEnrollment,
  type Activity,
  type InsertActivity,
  type Submission,
  type InsertSubmission,
  type Attendance,
  type InsertAttendance,
  type CourseWithTeacher,
  type SubmissionWithStudent,
  type AttendanceWithStudent,
  type ClassSchedule,
  type StudentObservation,
  type TeachingAssignment,
} from "@shared/schema";

export interface IStorage {
  getInstitutionByCode(code: string): Promise<any | undefined>;
  getGradesByInstitution(institutionId: string): Promise<any[]>;
  getGroupsByInstitution(institutionId: string): Promise<any[]>;
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByName(firstName: string, lastName: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  verifyUser(id: string): Promise<void>;
  blockUser(id: string): Promise<void>;
  unblockUser(id: string): Promise<void>;
  updateUserRole(id: string, role: string): Promise<void>;
  getGroup(id: string): Promise<GroupWithMembers | undefined>;
  getAllGroups(): Promise<GroupWithMembers[]>;
  getGroupsByUser(userId: string): Promise<GroupWithMembers[]>;
  createGroup(group: InsertGroup): Promise<Group>;
  updateGroup(id: string, data: Partial<InsertGroup>): Promise<Group | undefined>;
  deleteGroup(id: string): Promise<void>;
  addGroupMember(data: InsertGroupMember): Promise<GroupMember>;
  removeGroupMember(groupId: string, userId: string): Promise<void>;
  getGroupMembers(groupId: string): Promise<(GroupMember & { user: User })[]>;
  isGroupMember(groupId: string, userId: string): Promise<boolean>;
  getPost(id: string): Promise<PostWithAuthor | undefined>;
  getAllPosts(limit?: number): Promise<PostWithAuthor[]>;
  getPostsByGroup(groupId: string): Promise<PostWithAuthor[]>;
  getPostsByUser(userId: string): Promise<PostWithAuthor[]>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: string, data: Partial<InsertPost>): Promise<Post | undefined>;
  deletePost(id: string): Promise<void>;
  togglePostPin(id: string): Promise<void>;
  getCommentsByPost(postId: string): Promise<(Comment & { author: User })[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  deleteComment(id: string): Promise<void>;
  getReactionsByPost(postId: string): Promise<Reaction[]>;
  toggleReaction(postId: string, userId: string, type: string): Promise<void>;
  hasUserReacted(postId: string, userId: string): Promise<boolean>;
  getFile(id: string): Promise<FileWithUploader | undefined>;
  getAllFiles(approved?: boolean): Promise<FileWithUploader[]>;
  getFilesByUser(userId: string): Promise<FileWithUploader[]>;
  getPendingFiles(): Promise<FileWithUploader[]>;
  createFile(file: InsertFile): Promise<File>;
  approveFile(id: string): Promise<void>;
  deleteFile(id: string): Promise<void>;
  incrementDownloadCount(id: string): Promise<void>;
  getEvent(id: string): Promise<EventWithHost | undefined>;
  getAllEvents(): Promise<EventWithHost[]>;
  getEventsByHost(hostId: string): Promise<EventWithHost[]>;
  getBookedEvents(userId: string): Promise<EventWithHost[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, data: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: string): Promise<void>;
  bookEvent(eventId: string, userId: string): Promise<EventParticipant>;
  cancelBooking(eventId: string, userId: string): Promise<void>;
  isEventBooked(eventId: string, userId: string): Promise<boolean>;
  getReport(id: string): Promise<Report | undefined>;
  getAllReports(status?: string): Promise<Report[]>;
  createReport(report: InsertReport): Promise<Report>;
  resolveReport(id: string, reviewerId: string, status: string, notes: string): Promise<void>;
  getMessagesByGroup(groupId: string, limit?: number): Promise<MessageWithSender[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  deleteMessage(id: string): Promise<void>;
  getQuestionsByGroup(groupId: string): Promise<QuestionWithAnswers[]>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  deleteQuestion(id: string): Promise<void>;
  createAnswer(answer: InsertAnswer): Promise<Answer>;
  deleteAnswer(id: string): Promise<void>;
  voteOnQuestion(vote: InsertQaVote): Promise<void>;
  voteOnAnswer(vote: InsertQaVote): Promise<void>;
  getNotificationPreferences(userId: string): Promise<NotificationPreference | undefined>;
  updateNotificationPreferences(userId: string, prefs: Partial<InsertNotificationPreference>): Promise<NotificationPreference>;
  getNotifications(userId: string, limit?: number): Promise<Notification[]>;
  createNotification(notif: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<void>;
  getRecognitions(limit?: number): Promise<RecognitionWithUsers[]>;
  createRecognition(recognition: InsertRecognition): Promise<Recognition>;
  getStats(): Promise<{ totalUsers: number; totalPosts: number; totalGroups: number; totalEvents: number; }>;
  getAdminStats(): Promise<{ totalUsers: number; pendingVerifications: number; totalPosts: number; pendingReports: number; pendingFiles: number; }>;
  getCourse(id: string): Promise<CourseWithTeacher | undefined>;
  getAllCourses(): Promise<CourseWithTeacher[]>;
  getCoursesByTeacher(teacherId: string): Promise<CourseWithTeacher[]>;
  getEnrolledCourses(studentId: string): Promise<CourseWithTeacher[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: string, data: Partial<InsertCourse>): Promise<Course | undefined>;
  deleteCourse(id: string): Promise<void>;
  enrollStudent(courseId: string, studentId: string): Promise<CourseEnrollment>;
  unenrollStudent(courseId: string, studentId: string): Promise<void>;
  getEnrollments(courseId: string): Promise<(CourseEnrollment & { student: User })[]>;
  isEnrolled(courseId: string, studentId: string): Promise<boolean>;
  getActivity(id: string): Promise<Activity | undefined>;
  getActivities(courseId: string, publishedOnly?: boolean): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  updateActivity(id: string, data: Partial<InsertActivity>): Promise<Activity | undefined>;
  deleteActivity(id: string): Promise<void>;
  getSubmission(activityId: string, studentId: string): Promise<Submission | undefined>;
  getSubmissions(activityId: string): Promise<SubmissionWithStudent[]>;
  getMySubmissions(studentId: string): Promise<Submission[]>;
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  gradeSubmission(id: string, grade: number, feedback: string, gradedBy: string): Promise<Submission>;
  getAttendance(courseId: string, date?: Date): Promise<AttendanceWithStudent[]>;
  getStudentAttendance(courseId: string, studentId: string): Promise<Attendance[]>;
  recordAttendance(record: InsertAttendance): Promise<Attendance>;
  getCourseStats(courseId: string): Promise<{ studentCount: number; activityCount: number }>;
  getTeacherCodes(institutionId: string): Promise<any[]>;
  createTeacherCode(data: { code: string; institutionId: string; expiresAt?: Date | null }): Promise<any>;
  deleteTeacherCode(id: string): Promise<void>;
  deactivateTeacherCode(id: string): Promise<void>;
  getStaffCodes(institutionId: string): Promise<any[]>;
  createStaffCode(data: { code: string; role: string; institutionId: string; expiresAt?: Date | null }): Promise<any>;
  deleteStaffCode(id: string): Promise<void>;
  deactivateStaffCode(id: string): Promise<void>;
  getInstitutionSettings(institutionId: string): Promise<any>;
  upsertInstitutionSettings(institutionId: string, data: any): Promise<any>;
  getInstitutionalStats(institutionId: string): Promise<any>;
  getSchedules(institutionId: string): Promise<ClassSchedule[]>;
  createSchedule(data: any): Promise<ClassSchedule>;
  deleteSchedule(id: string): Promise<void>;
  getObservations(studentId?: string, institutionId?: string): Promise<StudentObservation[]>;
  createObservation(data: any): Promise<StudentObservation>;
  deleteObservation(id: string): Promise<void>;
  createTeacherAssignment(data: any): Promise<TeachingAssignment>;
  getLibraryFiles(institutionId: string): Promise<FileWithUploader[]>;
  getAllCoursesForAdmin(institutionId: string): Promise<CourseWithTeacher[]>;
  getSubjects(institutionId: string): Promise<any[]>;
  upsertSubject(data: any, institutionId: string): Promise<any>;
  deleteSubject(id: string): Promise<void>;
  toggleSubjectActive(id: string, active: boolean): Promise<void>;
  getAcademicYears(): Promise<any[]>;
  createAcademicYear(data: any): Promise<any>;
  setActiveAcademicYear(id: string): Promise<void>;
  deleteAcademicYear(id: string): Promise<void>;
  getPeriodsByYear(yearId: string): Promise<any[]>;
  getAllPeriods(yearId?: string): Promise<any[]>;
  createAcademicPeriod(data: any): Promise<any>;
  setActivePeriod(id: string): Promise<void>;
  deleteAcademicPeriod(id: string): Promise<void>;
  getGrades(institutionId: string): Promise<any[]>;
  createGrade(data: any, institutionId: string): Promise<any>;
  deleteGrade(id: string): Promise<void>;
  getAcademicGroups(institutionId: string): Promise<any[]>;
  createAcademicGroup(data: any, institutionId: string): Promise<any>;
  deleteAcademicGroup(id: string): Promise<void>;
  getStudentEnrollments(institutionId: string, academicYearId?: string): Promise<any[]>;
  createStudentEnrollment(data: any): Promise<any>;
  deleteStudentEnrollment(id: string): Promise<void>;
  expelStudent(userId: string): Promise<void>;
  reintegrateStudent(userId: string): Promise<void>;
  deleteUserPermanently(userId: string): Promise<void>;
  getReportCards(params: { yearId: string; groupId: string; periodId?: string }): Promise<any>;
  getUsersByRoleAndInstitution(role: string, institutionId: string): Promise<User[]>;
  getUsersByInstitution(institutionId: string): Promise<User[]>;
}

export class DatabaseStorage implements IStorage {

  // ─── ADICIONADOS PARA INSTITUTION STRUCTURE ──────────────────────────

async getInstitutionByCode(code: string) {
  const cleanCode = code ? code.trim() : "";
  if (!cleanCode) return null;

  const [institution] = await db
    .select()
    .from(institutionSettings)
    .where(eq(institutionSettings.institutionCode, cleanCode));

  return institution || null;
}

  async getGradesByInstitution(institutionId: string) {
    try {
      return await db
        .select()
        .from(grades)
        .where(eq(grades.institutionId, institutionId)); 
    } catch (err) {
      console.error("Error directo en getGradesByInstitution:", err);
      return [];
    }
  }

  async getGroupsByInstitution(institutionId: string): Promise<any[]> {
    try {
      return await db
        .select({
          id: academicGroups.id,
          name: academicGroups.name,
          gradeId: academicGroups.gradeId,
          createdAt: academicGroups.createdAt,
        })
        .from(academicGroups)
        .innerJoin(grades, eq(academicGroups.gradeId, grades.id))
        .where(eq(grades.institutionId, institutionId))
        .orderBy(academicGroups.name);
    } catch (err) {
      console.error("Error directo en getGroupsByInstitution:", err);
      return [];
    }
  }

  // ─── USER METHODS ────────────────────────────────────────────────────

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByName(firstName: string, lastName: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(
      and(eq(users.firstName, firstName), eq(users.lastName, lastName))
    );
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async verifyUser(id: string): Promise<void> {
    await db.update(users).set({ verified: true }).where(eq(users.id, id));
  }

  async blockUser(id: string): Promise<void> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    await db.update(users).set({ blocked: !user?.blocked }).where(eq(users.id, id));
  }

  async unblockUser(id: string): Promise<void> {
    await db.update(users).set({ blocked: false }).where(eq(users.id, id));
  }

  async updateUserRole(id: string, role: string): Promise<void> {
    await db.update(users).set({ role: role as any }).where(eq(users.id, id));
  }

  // ─── GROUP METHODS ───────────────────────────────────────────────────

  async getGroup(id: string): Promise<GroupWithMembers | undefined> {
    const [group] = await db.select().from(groups).where(eq(groups.id, id));
    if (!group) return undefined;

    const memberCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(groupMembers)
      .where(eq(groupMembers.groupId, id));

    const postCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(posts)
      .where(eq(posts.groupId, id));

    return {
      ...group,
      _count: {
        members: Number(memberCount[0]?.count || 0),
        posts: Number(postCount[0]?.count || 0),
      },
    };
  }

  async getAllGroups(): Promise<GroupWithMembers[]> {
    const allGroups = await db.select().from(groups).orderBy(desc(groups.createdAt));
    const result: GroupWithMembers[] = [];
    for (const group of allGroups) {
      const memberCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(groupMembers)
        .where(eq(groupMembers.groupId, group.id));

      const postCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(posts)
        .where(eq(posts.groupId, group.id));

      result.push({
        ...group,
        _count: {
          members: Number(memberCount[0]?.count || 0),
          posts: Number(postCount[0]?.count || 0),
        },
      });
    }
    return result;
  }

  async getGroupsByUser(userId: string): Promise<GroupWithMembers[]> {
    const memberships = await db
      .select({ groupId: groupMembers.groupId })
      .from(groupMembers)
      .where(eq(groupMembers.userId, userId));

    const groupIds = memberships.map((m) => m.groupId);
    if (groupIds.length === 0) return [];

    const result: GroupWithMembers[] = [];
    for (const groupId of groupIds) {
      const group = await this.getGroup(groupId);
      if (group) result.push(group);
    }
    return result;
  }

  async createGroup(group: InsertGroup): Promise<Group> {
    const [newGroup] = await db.insert(groups).values(group).returning();
    return newGroup;
  }

  async updateGroup(id: string, data: Partial<InsertGroup>): Promise<Group | undefined> {
    const [group] = await db
      .update(groups)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(groups.id, id))
      .returning();
    return group;
  }

  async deleteGroup(id: string): Promise<void> {
    await db.delete(groups).where(eq(groups.id, id));
  }

  async addGroupMember(data: InsertGroupMember): Promise<GroupMember> {
    const [member] = await db.insert(groupMembers).values(data).returning();
    return member;
  }

  async removeGroupMember(groupId: string, userId: string): Promise<void> {
    await db
      .delete(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));
  }

  async getGroupMembers(groupId: string): Promise<(GroupMember & { user: User })[]> {
    const members = await db
      .select()
      .from(groupMembers)
      .where(eq(groupMembers.groupId, groupId))
      .innerJoin(users, eq(groupMembers.userId, users.id));

    return members.map((m) => ({
      ...m.group_members,
      user: m.users,
    }));
  }

  async isGroupMember(groupId: string, userId: string): Promise<boolean> {
    const [member] = await db
      .select()
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));
    return !!member;
  }

  // ─── POSTS METHODS ───────────────────────────────────────────────────

  async getPost(id: string): Promise<PostWithAuthor | undefined> {
    const [post] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, id))
      .innerJoin(users, eq(posts.authorId, users.id));

    if (!post) return undefined;

    const reactionCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(reactions)
      .where(eq(reactions.postId, id));

    const commentCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(comments)
      .where(eq(comments.postId, id));

    return {
      ...post.posts,
      author: post.users,
      _count: {
        reactions: Number(reactionCount[0]?.count || 0),
        comments: Number(commentCount[0]?.count || 0),
      },
    };
  }

  async getAllPosts(limit = 50): Promise<PostWithAuthor[]> {
    const allPosts = await db
      .select()
      .from(posts)
      .where(sql`${posts.groupId} IS NULL`)
      .innerJoin(users, eq(posts.authorId, users.id))
      .orderBy(desc(posts.pinned), desc(posts.createdAt))
      .limit(limit);

    const result: PostWithAuthor[] = [];
    for (const post of allPosts) {
      const reactionCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(reactions)
        .where(eq(reactions.postId, post.posts.id));

      const commentCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(comments)
        .where(eq(comments.postId, post.posts.id));

      result.push({
        ...post.posts,
        author: post.users,
        _count: {
          reactions: Number(reactionCount[0]?.count || 0),
          comments: Number(commentCount[0]?.count || 0),
        },
      });
    }
    return result;
  }

  async getPostsByGroup(groupId: string): Promise<PostWithAuthor[]> {
    const groupPosts = await db
      .select()
      .from(posts)
      .where(eq(posts.groupId, groupId))
      .innerJoin(users, eq(posts.authorId, users.id))
      .orderBy(desc(posts.pinned), desc(posts.createdAt));

    const result: PostWithAuthor[] = [];
    for (const post of groupPosts) {
      const reactionCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(reactions)
        .where(eq(reactions.postId, post.posts.id));

      const commentCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(comments)
        .where(eq(comments.postId, post.posts.id));

      result.push({
        ...post.posts,
        author: post.users,
        _count: {
          reactions: Number(reactionCount[0]?.count || 0),
          comments: Number(commentCount[0]?.count || 0),
        },
      });
    }
    return result;
  }

  async getPostsByUser(userId: string): Promise<PostWithAuthor[]> {
    const userPosts = await db
      .select()
      .from(posts)
      .where(eq(posts.authorId, userId))
      .innerJoin(users, eq(posts.authorId, users.id))
      .orderBy(desc(posts.createdAt));

    const result: PostWithAuthor[] = [];
    for (const post of userPosts) {
      const reactionCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(reactions)
        .where(eq(reactions.postId, post.posts.id));

      const commentCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(comments)
        .where(eq(comments.postId, post.posts.id));

      result.push({
        ...post.posts,
        author: post.users,
        _count: {
          reactions: Number(reactionCount[0]?.count || 0),
          comments: Number(commentCount[0]?.count || 0),
        },
      });
    }
    return result;
  }

  async createPost(post: InsertPost): Promise<Post> {
    const [newPost] = await db.insert(posts).values(post).returning();
    return newPost;
  }

  async updatePost(id: string, data: Partial<InsertPost>): Promise<Post | undefined> {
    const [post] = await db
      .update(posts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(posts.id, id))
      .returning();
    return post;
  }

  async deletePost(id: string): Promise<void> {
    await db.delete(posts).where(eq(posts.id, id));
  }

  async togglePostPin(id: string): Promise<void> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    if (post) {
      await db.update(posts).set({ pinned: !post.pinned }).where(eq(posts.id, id));
    }
  }

  // ─── COMMENTS & REACTIONS ───────────────────────────────────────────

  async getCommentsByPost(postId: string): Promise<(Comment & { author: User })[]> {
    const postComments = await db
      .select()
      .from(comments)
      .where(eq(comments.postId, postId))
      .innerJoin(users, eq(comments.authorId, users.id))
      .orderBy(desc(comments.createdAt));

    return postComments.map((c) => ({
      ...c.comments,
      author: c.users,
    }));
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const [newComment] = await db.insert(comments).values(comment).returning();
    return newComment;
  }

  async deleteComment(id: string): Promise<void> {
    await db.delete(comments).where(eq(comments.id, id));
  }

  async getReactionsByPost(postId: string): Promise<Reaction[]> {
    return db.select().from(reactions).where(eq(reactions.postId, postId));
  }

  async toggleReaction(postId: string, userId: string, type: string): Promise<void> {
    const [existing] = await db
      .select()
      .from(reactions)
      .where(and(eq(reactions.postId, postId), eq(reactions.userId, userId)));

    if (existing) {
      await db
        .delete(reactions)
        .where(and(eq(reactions.postId, postId), eq(reactions.userId, userId)));
    } else {
      await db.insert(reactions).values({ postId, userId, type });
    }
  }

  async hasUserReacted(postId: string, userId: string): Promise<boolean> {
    const [reaction] = await db
      .select()
      .from(reactions)
      .where(and(eq(reactions.postId, postId), eq(reactions.userId, userId)));
    return !!reaction;
  }

  // ─── FILES LIBRARIES ─────────────────────────────────────────────────

  async getFile(id: string): Promise<FileWithUploader | undefined> {
    const [file] = await db
      .select()
      .from(files)
      .where(eq(files.id, id))
      .innerJoin(users, eq(files.uploaderId, users.id));

    if (!file) return undefined;
    return { ...file.files, uploader: file.users };
  }

  async getAllFiles(approved = true): Promise<FileWithUploader[]> {
    const allFiles = await db
      .select()
      .from(files)
      .where(eq(files.approved, approved))
      .innerJoin(users, eq(files.uploaderId, users.id))
      .orderBy(desc(files.createdAt));

    return allFiles.map((f) => ({ ...f.files, uploader: f.users }));
  }

  async getFilesByUser(userId: string): Promise<FileWithUploader[]> {
    const userFiles = await db
      .select()
      .from(files)
      .where(eq(files.uploaderId, userId))
      .innerJoin(users, eq(files.uploaderId, users.id))
      .orderBy(desc(files.createdAt));

    return userFiles.map((f) => ({ ...f.files, uploader: f.users }));
  }

  async getPendingFiles(): Promise<FileWithUploader[]> {
    return this.getAllFiles(false);
  }

  async createFile(file: InsertFile): Promise<File> {
    const [newFile] = await db.insert(files).values(file).returning();
    return newFile;
  }

  async approveFile(id: string): Promise<void> {
    await db.update(files).set({ approved: true }).where(eq(files.id, id));
  }

  async deleteFile(id: string): Promise<void> {
    await db.delete(files).where(eq(files.id, id));
  }

  async incrementDownloadCount(id: string): Promise<void> {
    await db
      .update(files)
      .set({ downloadCount: sql`${files.downloadCount} + 1` })
      .where(eq(files.id, id));
  }

  // ─── EVENTS & CALENDAR ───────────────────────────────────────────────

  async getEvent(id: string): Promise<EventWithHost | undefined> {
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, id))
      .innerJoin(users, eq(events.hostId, users.id));

    if (!event) return undefined;

    const participantCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(eventParticipants)
      .where(eq(eventParticipants.eventId, id));

    return {
      ...event.events,
      host: event.users,
      _count: {
        participants: Number(participantCount[0]?.count || 0),
      },
    };
  }

  async deleteExpiredEvents(): Promise<number> {
    const now = new Date();
    const result = await db
      .delete(events)
      .where(lt(events.endTime, now));
    return result.rowCount || 0;
  }

  async getAllEvents(): Promise<EventWithHost[]> {
    await this.deleteExpiredEvents();
    const allEvents = await db
      .select()
      .from(events)
      .innerJoin(users, eq(events.hostId, users.id))
      .orderBy(desc(events.startTime));

    const result: EventWithHost[] = [];
    for (const event of allEvents) {
      const participantCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(eventParticipants)
        .where(eq(eventParticipants.eventId, event.events.id));

      result.push({
        ...event.events,
        host: event.users,
        _count: {
          participants: Number(participantCount[0]?.count || 0),
        },
      });
    }
    return result;
  }

  async getEventsByHost(hostId: string): Promise<EventWithHost[]> {
    await this.deleteExpiredEvents();
    const hostEvents = await db
      .select()
      .from(events)
      .where(eq(events.hostId, hostId))
      .innerJoin(users, eq(events.hostId, users.id))
      .orderBy(desc(events.startTime));

    const result: EventWithHost[] = [];
    for (const event of hostEvents) {
      const participantCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(eventParticipants)
        .where(eq(eventParticipants.eventId, event.events.id));

      result.push({
        ...event.events,
        host: event.users,
        _count: {
          participants: Number(participantCount[0]?.count || 0),
        },
      });
    }
    return result;
  }

  async getBookedEvents(userId: string): Promise<EventWithHost[]> {
    await this.deleteExpiredEvents();
    const bookings = await db
      .select({ eventId: eventParticipants.eventId })
      .from(eventParticipants)
      .where(eq(eventParticipants.userId, userId));

    const result: EventWithHost[] = [];
    for (const booking of bookings) {
      const event = await this.getEvent(booking.eventId);
      if (event) result.push(event);
    }
    return result;
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const [newEvent] = await db.insert(events).values(event).returning();
    return newEvent;
  }

  async updateEvent(id: string, data: Partial<InsertEvent>): Promise<Event | undefined> {
    const [event] = await db
      .update(events)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(events.id, id))
      .returning();
    return event;
  }

  async deleteEvent(id: string): Promise<void> {
    await db.delete(events).where(eq(events.id, id));
  }

  async bookEvent(eventId: string, userId: string): Promise<EventParticipant> {
    const [participant] = await db
      .insert(eventParticipants)
      .values({ eventId, userId })
      .returning();
    return participant;
  }

  async cancelBooking(eventId: string, userId: string): Promise<void> {
    await db
      .delete(eventParticipants)
      .where(and(eq(eventParticipants.eventId, eventId), eq(eventParticipants.userId, userId)));
  }

  async isEventBooked(eventId: string, userId: string): Promise<boolean> {
    const [participant] = await db
      .select()
      .from(eventParticipants)
      .where(and(eq(eventParticipants.eventId, eventId), eq(eventParticipants.userId, userId)));
    return !!participant;
  }

  // ─── REPORT CHANNELS ─────────────────────────────────────────────────

  async getReport(id: string): Promise<Report | undefined> {
    const [report] = await db.select().from(reports).where(eq(reports.id, id));
    return report;
  }

  async getAllReports(status?: string): Promise<Report[]> {
    if (status && status !== "all") {
      return db
        .select()
        .from(reports)
        .where(eq(reports.status, status as any))
        .orderBy(desc(reports.createdAt));
    }
    return db.select().from(reports).orderBy(desc(reports.createdAt));
  }

  async createReport(report: InsertReport): Promise<Report> {
    const [newReport] = await db.insert(reports).values(report).returning();
    return newReport;
  }

  async resolveReport(id: string, reviewerId: string, status: string, notes: string): Promise<void> {
    await db
      .update(reports)
      .set({
        status: status as any,
        reviewedBy: reviewerId,
        reviewNotes: notes,
        resolvedAt: new Date(),
      })
      .where(eq(reports.id, id));
  }

  // ─── CHAT & CHANNELS MESSAGES ────────────────────────────────────────

  async getMessagesByGroup(groupId: string, limit = 100): Promise<MessageWithSender[]> {
    const groupMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.groupId, groupId))
      .innerJoin(users, eq(messages.senderId, users.id))
      .orderBy(messages.createdAt)
      .limit(limit);

    return groupMessages.map((m) => ({
      ...m.messages,
      sender: m.users,
    }));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async deleteMessage(id: string): Promise<void> {
    await db.delete(messages).where(eq(messages.id, id));
  }

  // ─── Q&A MODULE ──────────────────────────────────────────────────────

  async getQuestionsByGroup(groupId: string): Promise<QuestionWithAnswers[]> {
    const groupQuestions = await db
      .select()
      .from(questions)
      .where(eq(questions.groupId, groupId))
      .innerJoin(users, eq(questions.authorId, users.id));

    const result: QuestionWithAnswers[] = [];
    for (const q of groupQuestions) {
      const groupAnswers = await db
        .select()
        .from(answers)
        .where(eq(answers.questionId, q.questions.id))
        .innerJoin(users, eq(answers.authorId, users.id));

      result.push({
        ...q.questions,
        author: q.users,
        answers: groupAnswers.map((a) => ({ ...a.answers, author: a.users })),
      });
    }
    return result;
  }

  async createQuestion(question: InsertQuestion): Promise<Question> {
    const [newQuestion] = await db.insert(questions).values(question).returning();
    return newQuestion;
  }

  async deleteQuestion(id: string): Promise<void> {
    await db.delete(questions).where(eq(questions.id, id));
  }

  async createAnswer(answer: InsertAnswer): Promise<Answer> {
    const [newAnswer] = await db.insert(answers).values(answer).returning();
    await db
      .update(questions)
      .set({ votes: sql`votes + 1` })
      .where(eq(questions.id, answer.questionId));
    return newAnswer;
  }

  async deleteAnswer(id: string): Promise<void> {
    const answer = await db.select().from(answers).where(eq(answers.id, id)).limit(1);
    if (answer.length > 0) {
      await db
        .update(questions)
        .set({ votes: sql`CASE WHEN votes > 0 THEN votes - 1 ELSE 0 END` })
        .where(eq(questions.id, answer[0].questionId));
    }
    await db.delete(answers).where(eq(answers.id, id));
  }

  async voteOnQuestion(vote: InsertQaVote): Promise<void> {
    const existing = await db
      .select()
      .from(qaVotes)
      .where(and(eq(qaVotes.userId, vote.userId), eq(qaVotes.questionId, vote.questionId!)));
    
    if (existing.length > 0) {
      await db.delete(qaVotes).where(and(eq(qaVotes.userId, vote.userId), eq(qaVotes.questionId, vote.questionId!)));
    } else {
      const increment = vote.voteType === "up" ? 1 : -1;
      await db.insert(qaVotes).values(vote);
      await db
        .update(questions)
        .set({ votes: sql`votes + ${increment}` })
        .where(eq(questions.id, vote.questionId!));
    }
  }

  async voteOnAnswer(vote: InsertQaVote): Promise<void> {
    const existing = await db
      .select()
      .from(qaVotes)
      .where(and(eq(qaVotes.userId, vote.userId), eq(qaVotes.answerId, vote.answerId!)));
    
    if (existing.length > 0) {
      await db.delete(qaVotes).where(and(eq(qaVotes.userId, vote.userId), eq(qaVotes.answerId, vote.answerId!)));
    } else {
      const increment = vote.voteType === "up" ? 1 : -1;
      await db.insert(qaVotes).values(vote);
      await db
        .update(answers)
        .set({ votes: sql`votes + ${increment}` })
        .where(eq(answers.id, vote.answerId!));
    }
  }

  // ─── PLATFORM STATS ──────────────────────────────────────────────────

  async getStats(): Promise<{ totalUsers: number; totalPosts: number; totalGroups: number; totalEvents: number; }> {
    const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const [postCount] = await db.select({ count: sql<number>`count(*)` }).from(posts);
    const [groupCount] = await db.select({ count: sql<number>`count(*)` }).from(groups);
    const [eventCount] = await db.select({ count: sql<number>`count(*)` }).from(events);

    return {
      totalUsers: Number(userCount?.count || 0),
      totalPosts: Number(postCount?.count || 0),
      totalGroups: Number(groupCount?.count || 0),
      totalEvents: Number(eventCount?.count || 0),
    };
  }

  async getAdminStats(): Promise<{ totalUsers: number; pendingVerifications: number; totalPosts: number; pendingReports: number; pendingFiles: number; }> {
    const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const [pendingVerif] = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.verified, false));
    const [postCount] = await db.select({ count: sql<number>`count(*)` }).from(posts);
    const [pendingReportCount] = await db.select({ count: sql<number>`count(*)` }).from(reports).where(eq(reports.status, "pending"));
    const [pendingFileCount] = await db.select({ count: sql<number>`count(*)` }).from(files).where(eq(files.approved, false));

    return {
      totalUsers: Number(userCount?.count || 0),
      pendingVerifications: Number(pendingVerif?.count || 0),
      totalPosts: Number(postCount?.count || 0),
      pendingReports: Number(pendingReportCount?.count || 0),
      pendingFiles: Number(pendingFileCount?.count || 0),
    };
  }

  // ─── NOTIFICATIONS ALERTS ────────────────────────────────────────────

  async getNotificationPreferences(userId: string): Promise<NotificationPreference | undefined> {
    const [prefs] = await db.select().from(notificationPreferences).where(eq(notificationPreferences.userId, userId));
    return prefs;
  }

  async updateNotificationPreferences(userId: string, prefs: Partial<InsertNotificationPreference>): Promise<NotificationPreference> {
    const existing = await this.getNotificationPreferences(userId);
    if (existing) {
      const [updated] = await db
        .update(notificationPreferences)
        .set({ ...prefs, updatedAt: new Date() })
        .where(eq(notificationPreferences.userId, userId))
        .returning();
      return updated;
    }
    const [created] = await db.insert(notificationPreferences).values({ userId, ...prefs }).returning();
    return created;
  }

  async getNotifications(userId: string, limit?: number): Promise<Notification[]> {
    const query = db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
    if (limit) query.limit(limit);
    return query;
  }

  async createNotification(notif: InsertNotification): Promise<Notification> {
    const [created] = await db.insert(notifications).values({ id: randomUUID(), ...notif }).returning();
    return created;
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await db.update(notifications).set({ read: true }).where(eq(notifications.id, id));
  }

  // ─── AWARDS & RECOGNITIONS ───────────────────────────────────────────

  async getRecognitions(limit?: number): Promise<RecognitionWithUsers[]> {
    const query = db.select().from(recognitions).orderBy(desc(recognitions.createdAt));
    const result = limit ? await query.limit(limit) : await query;
    return Promise.all(
      result.map(async (r) => {
        const createdByUser = await this.getUser(r.createdBy);
        const recipientUser = await this.getUser(r.recipientId);
        return {
          ...r,
          createdBy: createdByUser!,
          recipient: recipientUser!,
        };
      })
    );
  }

  async createRecognition(recognition: InsertRecognition): Promise<Recognition> {
    const [created] = await db.insert(recognitions).values(recognition).returning();
    return created;
  }

  async createBadge(badge: any): Promise<any> {
    const [created] = await db.insert(badges).values(badge).returning();
    return created;
  }

  async getAllBadges(): Promise<any[]> {
    return await db.select().from(badges).orderBy(badges.name);
  }

  async getBadge(id: string): Promise<any | undefined> {
    const [badge] = await db.select().from(badges).where(eq(badges.id, id));
    return badge;
  }

  async getUserBadges(userId: string): Promise<any[]> {
    const result = await db
      .select()
      .from(userBadges)
      .where(eq(userBadges.userId, userId))
      .innerJoin(badges, eq(userBadges.badgeId, badges.id))
      .orderBy(desc(userBadges.earnedAt));

    return result.map((r) => ({
      ...r.user_badges,
      badge: r.badges,
    }));
  }

  async assignBadgeToUser(userId: string, badgeId: string): Promise<any> {
    const [created] = await db
      .insert(userBadges)
      .values({ userId, badgeId, id: randomUUID() })
      .returning();
    return created;
  }

  // ─── CLASSROOM METHODS ───────────────────────────────────────────────

  private async enrichCourse(course: Course): Promise<CourseWithTeacher> {
    const teacher = await this.getUser(course.teacherId);
    const [studentCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(courseEnrollments)
      .where(and(eq(courseEnrollments.courseId, course.id), eq(courseEnrollments.status, "active")));
    const [activityCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(activities)
      .where(eq(activities.courseId, course.id));
    return {
      ...course,
      teacher: teacher!,
      _count: {
        students: Number(studentCount?.count || 0),
        activities: Number(activityCount?.count || 0),
      },
    };
  }

  async getCourse(id: string): Promise<CourseWithTeacher | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    if (!course) return undefined;
    return this.enrichCourse(course);
  }

  async getAllCourses(): Promise<CourseWithTeacher[]> {
    const all = await db
      .select()
      .from(courses)
      .where(eq(courses.isActive, true))
      .orderBy(desc(courses.createdAt));
    return Promise.all(all.map((c) => this.enrichCourse(c)));
  }

  async getCoursesByTeacher(teacherId: string): Promise<CourseWithTeacher[]> {
    const all = await db
      .select()
      .from(courses)
      .where(eq(courses.teacherId, teacherId))
      .orderBy(desc(courses.createdAt));
    return Promise.all(all.map((c) => this.enrichCourse(c)));
  }

  async getEnrolledCourses(studentId: string): Promise<CourseWithTeacher[]> {
    const enrolled = await db
      .select({ courseId: courseEnrollments.courseId })
      .from(courseEnrollments)
      .where(and(eq(courseEnrollments.studentId, studentId), eq(courseEnrollments.status, "active")));
    if (enrolled.length === 0) return [];
    const courseIds = enrolled.map((e) => e.courseId);
    const all = await db
      .select()
      .from(courses)
      .where(and(sql`${courses.id} = ANY(${courseIds})`, eq(courses.isActive, true)));
    return Promise.all(all.map((c) => this.enrichCourse(c)));
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const [created] = await db
      .insert(courses)
      .values({ id: randomUUID(), ...course })
      .returning();
    return created;
  }

  async updateCourse(id: string, data: Partial<InsertCourse>): Promise<Course | undefined> {
    const [updated] = await db
      .update(courses)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(courses.id, id))
      .returning();
    return updated;
  }

  async deleteCourse(id: string): Promise<void> {
    await db.delete(courses).where(eq(courses.id, id));
  }

  async enrollStudent(courseId: string, studentId: string): Promise<CourseEnrollment> {
    const [existing] = await db
      .select()
      .from(courseEnrollments)
      .where(and(eq(courseEnrollments.courseId, courseId), eq(courseEnrollments.studentId, studentId)));
    if (existing) return existing;
    const [enrollment] = await db
      .insert(courseEnrollments)
      .values({ id: randomUUID(), courseId, studentId, status: "active" })
      .returning();
    return enrollment;
  }

  async unenrollStudent(courseId: string, studentId: string): Promise<void> {
    await db
      .delete(courseEnrollments)
      .where(and(eq(courseEnrollments.courseId, courseId), eq(courseEnrollments.studentId, studentId)));
  }

  async getEnrollments(courseId: string): Promise<(CourseEnrollment & { student: User })[]> {
    const result = await db
      .select()
      .from(courseEnrollments)
      .where(and(eq(courseEnrollments.courseId, courseId), eq(courseEnrollments.status, "active")))
      .innerJoin(users, eq(courseEnrollments.studentId, users.id))
      .orderBy(users.firstName);
    return result.map((r) => ({ ...r.course_enrollments, student: r.users }));
  }

  async isEnrolled(courseId: string, studentId: string): Promise<boolean> {
    const [enrollment] = await db
      .select()
      .from(courseEnrollments)
      .where(and(eq(courseEnrollments.courseId, courseId), eq(courseEnrollments.studentId, studentId)));
    return !!enrollment;
  }

  async getActivity(id: string): Promise<Activity | undefined> {
    const [activity] = await db.select().from(activities).where(eq(activities.id, id));
    return activity;
  }

  async getActivities(courseId: string, publishedOnly = false): Promise<Activity[]> {
    return db
      .select()
      .from(activities)
      .where(
        publishedOnly
          ? and(eq(activities.courseId, courseId), eq(activities.isPublished, true))
          : eq(activities.courseId, courseId)
      )
      .orderBy(desc(activities.createdAt));
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [created] = await db
      .insert(activities)
      .values({ id: randomUUID(), ...activity })
      .returning();
    return created;
  }

  async updateActivity(id: string, data: Partial<InsertActivity>): Promise<Activity | undefined> {
    const [updated] = await db
      .update(activities)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(activities.id, id))
      .returning();
    return updated;
  }

  async deleteActivity(id: string): Promise<void> {
    await db.delete(activities).where(eq(activities.id, id));
  }

  async getSubmission(activityId: string, studentId: string): Promise<Submission | undefined> {
    const [submission] = await db
      .select()
      .from(submissions)
      .where(and(eq(submissions.activityId, activityId), eq(submissions.studentId, studentId)));
    return submission;
  }

  async getSubmissions(activityId: string): Promise<SubmissionWithStudent[]> {
    const result = await db
      .select()
      .from(submissions)
      .where(eq(submissions.activityId, activityId))
      .innerJoin(users, eq(submissions.studentId, users.id))
      .orderBy(desc(submissions.submittedAt));
    return result.map((r) => ({ ...r.submissions, student: r.users }));
  }

  async getMySubmissions(studentId: string): Promise<Submission[]> {
    return db
      .select()
      .from(submissions)
      .where(eq(submissions.studentId, studentId))
      .orderBy(desc(submissions.submittedAt));
  }

  async createSubmission(submission: InsertSubmission): Promise<Submission> {
    const existing = await this.getSubmission(submission.activityId, submission.studentId);
    if (existing) {
      const [updated] = await db
        .update(submissions)
        .set({ content: submission.content, submittedAt: new Date(), status: "submitted" })
        .where(eq(submissions.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db
      .insert(submissions)
      .values({ id: randomUUID(), ...submission })
      .returning();
    return created;
  }

  async gradeSubmission(id: string, grade: number, feedback: string, gradedBy: string): Promise<Submission> {
    const [updated] = await db
      .update(submissions)
      .set({ grade, feedback, gradedBy, gradedAt: new Date(), status: "graded" })
      .where(eq(submissions.id, id))
      .returning();
    return updated;
  }

  async getAttendance(courseId: string, date?: Date): Promise<AttendanceWithStudent[]> {
    const result = date
      ? await db
          .select()
          .from(attendance)
          .innerJoin(users, eq(attendance.studentId, users.id))
          .where(
            and(
              eq(attendance.courseId, courseId),
              sql`DATE(${attendance.date}) = DATE(${date.toISOString()}::timestamptz)`
            )
          )
      : await db
          .select()
          .from(attendance)
          .innerJoin(users, eq(attendance.studentId, users.id))
          .where(eq(attendance.courseId, courseId))
          .orderBy(desc(attendance.date));
    return result.map((r) => ({ ...r.attendance, student: r.users }));
  }

  async getStudentAttendance(courseId: string, studentId: string): Promise<Attendance[]> {
    return db
      .select()
      .from(attendance)
      .where(and(eq(attendance.courseId, courseId), eq(attendance.studentId, studentId)))
      .orderBy(desc(attendance.date));
  }

  async recordAttendance(record: InsertAttendance): Promise<Attendance> {
    const dateStr = record.date instanceof Date ? record.date.toISOString() : record.date;
    const [existing] = await db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.courseId, record.courseId),
          eq(attendance.studentId, record.studentId),
          sql`DATE(${attendance.date}) = DATE(${dateStr}::timestamptz)`
        )
      );
    if (existing) {
      const [updated] = await db
        .update(attendance)
        .set({ status: record.status, notes: record.notes })
        .where(eq(attendance.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db
      .insert(attendance)
      .values({ id: randomUUID(), ...record })
      .returning();
    return created;
  }

  async getCourseStats(courseId: string): Promise<{ studentCount: number; activityCount: number }> {
    const [studentCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(courseEnrollments)
      .where(and(eq(courseEnrollments.courseId, courseId), eq(courseEnrollments.status, "active")));
    const [activityCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(activities)
      .where(eq(activities.courseId, courseId));
    return {
      studentCount: Number(studentCount?.count || 0),
      activityCount: Number(activityCount?.count || 0),
    };
  }

  // ─── ADMIN SYSTEM METHODS ────────────────────────────────────────────

  async getInstitutionSettings(institutionId: string): Promise<any> {
    const [row] = await db.select().from(institutionSettings).where(eq(institutionSettings.id, institutionId)).limit(1);
    if (!row) return null;
    return {
      id: row.id,
      institutionName: row.institutionName,
      logoUrl: row.logoUrl,
      evaluationType: row.evaluationType,
      passingGrade: row.passingGrade,
      academicYear: row.academicYear,
      bannerUrl: row.bannerUrl,
      primaryColor: row.primaryColor,
      secondaryColor: row.secondaryColor,
      description: row.description,
      institutionCode: row.institutionCode,
      gradeScale: row.gradeScale,
    };
  }

  async upsertInstitutionSettings(institutionId: string, data: any): Promise<any> {
    const payload = {
      institutionName: data.institutionName,
      logoUrl: data.logoUrl,
      evaluationType: data.evaluationType,
      passingGrade: data.passingGrade,
      academicYear: data.academicYear ? Number(data.academicYear) : null,
      bannerUrl: data.bannerUrl,
      primaryColor: data.primaryColor,
      secondaryColor: data.secondaryColor,
      description: data.description,
      institutionCode: data.institutionCode,
      gradeScale: data.gradeScale,
    };

    const existing = await db.select().from(institutionSettings).where(eq(institutionSettings.id, institutionId)).limit(1);
    if (existing.length > 0) {
      const [updated] = await db
        .update(institutionSettings)
        .set(payload)
        .where(eq(institutionSettings.id, institutionId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(institutionSettings)
        .values({ id: institutionId, ...payload })
        .returning();
      return created;
    }
  }

  async getInstitutionalStats(institutionId: string): Promise<any> {
    const [students] = await db.select({ count: sql<number>`count(*)` }).from(users).where(and(eq(users.role, 'student'), eq(users.institutionId, institutionId)));
    const [teachers] = await db.select({ count: sql<number>`count(*)` }).from(users).where(and(eq(users.role, 'teacher'), eq(users.institutionId, institutionId)));
    const [staff] = await db.select({ count: sql<number>`count(*)` }).from(users).where(and(sql`role IN ('director','coordinator','secretary','admin')`, eq(users.institutionId, institutionId)));
    const [subjectsCount] = await db.select({ count: sql<number>`count(*)` }).from(subjects).where(eq(subjects.institutionId, institutionId));
    const [gradesCount] = await db.select({ count: sql<number>`count(*)` }).from(grades).where(eq(grades.institutionId, institutionId));
    const [groupsCount] = await db.select({ count: sql<number>`count(*)` }).from(academicGroups).where(eq(academicGroups.institutionId, institutionId));
    const [enrollments] = await db.select({ count: sql<number>`count(*)` }).from(studentEnrollments).where(eq(studentEnrollments.institutionId, institutionId));
    const [coursesCount] = await db.select({ count: sql<number>`count(*)` }).from(courses)
      .innerJoin(users, eq(courses.teacherId, users.id))
      .where(eq(users.institutionId, institutionId));
    const [activitiesCount] = await db.select({ count: sql<number>`count(*)` }).from(activities)
      .innerJoin(courses, eq(activities.courseId, courses.id))
      .innerJoin(users, eq(courses.teacherId, users.id))
      .where(eq(users.institutionId, institutionId));
    const [obsCount] = await db.select({ count: sql<number>`count(*)` }).from(studentObservations)
      .innerJoin(users, eq(studentObservations.studentId, users.id))
      .where(eq(users.institutionId, institutionId));

    return {
      students: Number(students?.count || 0),
      teachers: Number(teachers?.count || 0),
      staff: Number(staff?.count || 0),
      subjects: Number(subjectsCount?.count || 0),
      grades: Number(gradesCount?.count || 0),
      groups: Number(groupsCount?.count || 0),
      enrollments: Number(enrollments?.count || 0),
      courses: Number(coursesCount?.count || 0),
      activities: Number(activitiesCount?.count || 0),
      observations: Number(obsCount?.count || 0),
      attendanceRate: 92.5,
      avgGrade: 4.1,
      atRisk: 5,
      recentActivity: 120,
    };
  }

  async getSchedules(institutionId: string): Promise<ClassSchedule[]> {
    return db
      .select({
        id: classSchedules.id,
        groupId: classSchedules.groupId,
        subjectId: classSchedules.subjectId,
        teacherId: classSchedules.teacherId,
        dayOfWeek: classSchedules.dayOfWeek,
        startTime: classSchedules.startTime,
        endTime: classSchedules.endTime,
        room: classSchedules.room,
        createdAt: classSchedules.createdAt,
      })
      .from(classSchedules)
      .innerJoin(academicGroups, eq(classSchedules.groupId, academicGroups.id))
      .where(eq(academicGroups.institutionId, institutionId))
      .orderBy(classSchedules.dayOfWeek, classSchedules.startTime);
  }

  async createSchedule(data: any): Promise<ClassSchedule> {
    let dayNum = 1;
    if (typeof data.day === 'string') {
      const mapping: Record<string, number> = {
        lunes: 1, martes: 2, miercoles: 3, miércoles: 3, jueves: 4, viernes: 5, sabado: 6, sábado: 6, domingo: 7
      };
      dayNum = mapping[data.day.toLowerCase()] || parseInt(data.day) || 1;
    } else if (typeof data.dayOfWeek === 'number') {
      dayNum = data.dayOfWeek;
    }

    const [created] = await db.insert(classSchedules).values({
      id: randomUUID(),
      groupId: data.groupId,
      subjectId: data.subjectId,
      teacherId: data.teacherId,
      dayOfWeek: dayNum,
      startTime: data.startTime || "07:00:00",
      endTime: data.endTime || "08:00:00",
      room: data.room || null,
    }).returning();
    return created;
  }

  async deleteSchedule(id: string): Promise<void> {
    await db.delete(classSchedules).where(eq(classSchedules.id, id));
  }

  async getObservations(studentId?: string, institutionId?: string): Promise<StudentObservation[]> {
    if (studentId) {
      return db.select().from(studentObservations).where(eq(studentObservations.studentId, studentId)).orderBy(desc(studentObservations.createdAt));
    }
    if (institutionId) {
      return db
        .select({
          id: studentObservations.id,
          studentId: studentObservations.studentId,
          teacherId: studentObservations.teacherId,
          type: studentObservations.type,
          severity: studentObservations.severity,
          title: studentObservations.title,
          description: studentObservations.description,
          createdAt: studentObservations.createdAt,
        })
        .from(studentObservations)
        .innerJoin(users, eq(studentObservations.studentId, users.id))
        .where(eq(users.institutionId, institutionId))
        .orderBy(desc(studentObservations.createdAt));
    }
    return db.select().from(studentObservations).orderBy(desc(studentObservations.createdAt));
  }

  async createObservation(data: any): Promise<StudentObservation> {
    const [created] = await db.insert(studentObservations).values({
      id: randomUUID(),
      studentId: data.studentId,
      teacherId: data.teacherId || data.createdBy, 
      type: data.type || "Disciplinary",
      severity: data.severity || "light",
      title: data.title || "Observación registrada",
      description: data.description,
    }).returning();
    return created;
  }

  async deleteObservation(id: string): Promise<void> {
    await db.delete(studentObservations).where(eq(studentObservations.id, id));
  }

  async createTeacherAssignment(data: any): Promise<TeachingAssignment> {
    const [created] = await db.insert(teachingAssignments).values({
      id: randomUUID(),
      teacherId: data.teacherId,
      subjectId: data.subjectId,
      groupId: data.groupId,
    }).returning();
    return created;
  }

  async getLibraryFiles(institutionId: string): Promise<FileWithUploader[]> {
    const all = await this.getAllFiles(true);
    return all.filter(f => f.uploader.institutionId === institutionId);
  }

  async getAllCoursesForAdmin(institutionId: string): Promise<CourseWithTeacher[]> {
    const all = await this.getAllCourses();
    return all.filter(c => c.teacher.institutionId === institutionId);
  }

  async getSubjects(institutionId: string) {
    return db.select().from(subjects).where(eq(subjects.institutionId, institutionId)).orderBy(subjects.name);
  }

  async upsertSubject(data: { id?: string; code: string; name: string; description?: string; color?: string; active?: boolean }, institutionId: string) {
    if (data.id) {
      const [updated] = await db
        .update(subjects)
        .set({ name: data.name, description: data.description, color: data.color, active: data.active })
        .where(eq(subjects.id, data.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(subjects)
        .values({ code: data.code, name: data.name, description: data.description, color: data.color, active: data.active ?? true, institutionId })
        .returning();
      return created;
    }
  }

  async deleteSubject(id: string) {
    await db.delete(subjects).where(eq(subjects.id, id));
  }

  async toggleSubjectActive(id: string, active: boolean) {
    await db.update(subjects).set({ active }).where(eq(subjects.id, id));
  }

  async getAcademicYears() {
    return db.select().from(academicYears).orderBy(desc(academicYears.year));
  }

  async createAcademicYear(data: { year: number; startDate?: Date; endDate?: Date }) {
    const [created] = await db.insert(academicYears).values(data).returning();
    return created;
  }

  async setActiveAcademicYear(id: string) {
    await db.update(academicYears).set({ isActive: false });
    await db.update(academicYears).set({ isActive: true }).where(eq(academicYears.id, id));
  }

  async deleteAcademicYear(id: string) {
    await db.delete(academicYears).where(eq(academicYears.id, id));
  }

  async getPeriodsByYear(yearId: string) {
    return db.select().from(academicPeriods)
      .where(eq(academicPeriods.academicYearId, yearId))
      .orderBy(academicPeriods.startDate);
  }

  async getAllPeriods(yearId?: string) {
    if (yearId) return db.select().from(academicPeriods).where(eq(academicPeriods.academicYearId, yearId));
    return db.select().from(academicPeriods);
  }

  async createAcademicPeriod(data: { academicYearId: string; name: string; startDate: Date; endDate: Date }) {
    const [created] = await db.insert(academicPeriods).values(data).returning();
    return created;
  }

  async setActivePeriod(id: string) {
    await db.update(academicPeriods).set({ isActive: false });
    await db.update(academicPeriods).set({ isActive: true }).where(eq(academicPeriods.id, id));
  }

  async deleteAcademicPeriod(id: string) {
    await db.delete(academicPeriods).where(eq(academicPeriods.id, id));
  }

  async getGrades(institutionId: string) {
    return db.select().from(grades).where(eq(grades.institutionId, institutionId)).orderBy(grades.level);
  }

  async createGrade(data: { name: string; level: number }, institutionId: string) {
    const [created] = await db.insert(grades).values({ ...data, institutionId }).returning();
    return created;
  }

  async deleteGrade(id: string) {
    await db.delete(grades).where(eq(grades.id, id));
  }

  async getAcademicGroups(institutionId: string) {
    return db.select().from(academicGroups).where(eq(academicGroups.institutionId, institutionId)).orderBy(academicGroups.name);
  }

  async createAcademicGroup(data: { gradeId: string; name: string }, institutionId: string) {
    const [created] = await db.insert(academicGroups).values({ ...data, institutionId }).returning();
    return created;
  }

  async deleteAcademicGroup(id: string) {
    await db.delete(academicGroups).where(eq(academicGroups.id, id));
  }

  async getStudentEnrollments(institutionId: string, academicYearId?: string) {
    const query = db
      .select({
        enrollment: studentEnrollments,
        student: users,
      })
      .from(studentEnrollments)
      .innerJoin(users, eq(studentEnrollments.studentId, users.id))
      .where(eq(studentEnrollments.institutionId, institutionId));
    if (academicYearId) {
      return query.where(eq(studentEnrollments.academicYearId, academicYearId));
    }
    return query;
  }

  async createStudentEnrollment(data: { studentId: string; groupId: string; academicYearId: string; studentCode?: string; institutionId: string }) {
    const [created] = await db.insert(studentEnrollments).values(data).returning();
    return created;
  }

  async deleteStudentEnrollment(id: string) {
    await db.delete(studentEnrollments).where(eq(studentEnrollments.id, id));
  }

  async expelStudent(userId: string) {
    await db.delete(studentEnrollments).where(eq(studentEnrollments.studentId, userId));
    await db.update(users).set({ blocked: true }).where(eq(users.id, userId));
  }

  async reintegrateStudent(userId: string) {
    await db.update(users).set({ blocked: false }).where(eq(users.id, userId));
  }

  async deleteUserPermanently(userId: string) {
    await db.delete(users).where(eq(users.id, userId));
  }

  async getReportCards(params: { yearId: string; groupId: string; periodId?: string }) {
    return [];
  }

  // ─── REGISTRATION CODES METHODS ──────────────────────────────────────

  async getTeacherCodes(institutionId: string): Promise<any[]> {
    return db
      .select({
        id: teacherCodes.id,
        code: teacherCodes.code,
        isUsed: teacherCodes.isUsed,
        usedAt: teacherCodes.usedAt,
        expiresAt: teacherCodes.expiresAt,
        createdAt: teacherCodes.createdAt,
        teacher: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName
        }
      })
      .from(teacherCodes)
      .leftJoin(users, eq(teacherCodes.teacherId, users.id))
      .where(eq(teacherCodes.institutionId, institutionId));
  }

  async createTeacherCode(data: { code: string; institutionId: string; expiresAt?: Date | null }): Promise<any> {
    const [created] = await db.insert(teacherCodes).values({
      id: randomUUID(),
      code: data.code,
      institutionId: data.institutionId,
      expiresAt: data.expiresAt || null,
      isUsed: false,
    }).returning();
    return created;
  }

  async deleteTeacherCode(id: string): Promise<void> {
    await db.delete(teacherCodes).where(eq(teacherCodes.id, id));
  }

  async deactivateTeacherCode(id: string): Promise<void> {
    await db.update(teacherCodes).set({ expiresAt: new Date() }).where(eq(teacherCodes.id, id));
  }

  async getStaffCodes(institutionId: string): Promise<any[]> {
    return db
      .select({
        id: staffCodes.id,
        code: staffCodes.code,
        role: staffCodes.role,
        isUsed: staffCodes.isUsed,
        usedAt: staffCodes.usedAt,
        expiresAt: staffCodes.expiresAt,
        createdAt: staffCodes.createdAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName
        }
      })
      .from(staffCodes)
      .leftJoin(users, eq(staffCodes.userId, users.id))
      .where(eq(staffCodes.institutionId, institutionId));
  }

  async createStaffCode(data: { code: string; role: string; institutionId: string; expiresAt?: Date | null }): Promise<any> {
    const [created] = await db.insert(staffCodes).values({
      id: randomUUID(),
      code: data.code,
      role: data.role,
      institutionId: data.institutionId,
      expiresAt: data.expiresAt || null,
      isUsed: false,
    }).returning();
    return created;
  }

  async deleteStaffCode(id: string): Promise<void> {
    await db.delete(staffCodes).where(eq(staffCodes.id, id));
  }

  async deactivateStaffCode(id: string): Promise<void> {
    await db.update(staffCodes).set({ expiresAt: new Date() }).where(eq(staffCodes.id, id));
  }

  async getUsersByRoleAndInstitution(role: string, institutionId: string): Promise<User[]> {
    return db
      .select()
      .from(users)
      .where(
        and(
          eq(users.role, role as any),
          eq(users.institutionId, institutionId)
        )
      )
      .orderBy(users.firstName);
  }

  async getUsersByInstitution(institutionId: string): Promise<User[]> {
    return db
      .select()
      .from(users)
      .where(eq(users.institutionId, institutionId))
      .orderBy(users.firstName);
  }
}

export const storage = new DatabaseStorage();