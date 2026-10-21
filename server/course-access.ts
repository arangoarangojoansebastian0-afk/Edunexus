type CourseAccessRecord = {
  institutionId: string | null;
  teacherId: string | null;
};

type CourseAccessUser = {
  id: string;
  institutionId: string | null;
  role: string;
};

const COURSE_CONTENT_STAFF_ROLES = new Set([
  "admin",
  "director",
  "super_admin",
  "coordinator",
  "secretary",
]);

const COURSE_REVIEW_STAFF_ROLES = new Set(["admin", "director", "super_admin", "coordinator"]);

export function canAccessCourseContent(
  course: CourseAccessRecord | null | undefined,
  user: CourseAccessUser,
  isActivelyEnrolled = false,
): boolean {
  if (!course || !user.institutionId || course.institutionId !== user.institutionId) return false;
  if (COURSE_CONTENT_STAFF_ROLES.has(user.role)) return true;
  if (user.role === "teacher") return course.teacherId === user.id;
  return user.role === "student" && isActivelyEnrolled;
}

export function canReviewCourseSubmissions(course: CourseAccessRecord | null | undefined, user: CourseAccessUser): boolean {
  if (!course || !user.institutionId || course.institutionId !== user.institutionId) return false;
  return (user.role === "teacher" && course.teacherId === user.id) || COURSE_REVIEW_STAFF_ROLES.has(user.role);
}

export function canManageCourseAttendance(course: CourseAccessRecord | null | undefined, user: CourseAccessUser): boolean {
  return canReviewCourseSubmissions(course, user);
}

export function canViewCourseRoster(course: CourseAccessRecord | null | undefined, user: CourseAccessUser): boolean {
  if (!course || !user.institutionId || course.institutionId !== user.institutionId) return false;
  return (user.role === "teacher" && course.teacherId === user.id) || COURSE_REVIEW_STAFF_ROLES.has(user.role);
}
