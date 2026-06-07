---
name: Classroom Module
description: Full classroom module with courses, activities, submissions, attendance
---

Added to shared/schema.ts:
- courses, course_enrollments, activities, submissions, attendance tables
- Insert schemas + extended types (CourseWithTeacher, ActivityWithSubmission, etc.)

Storage (server/storage.ts): getCourse, getAllCourses, getCoursesByTeacher, getEnrolledCourses, createCourse, enrollStudent, getEnrollments, getActivities, createActivity, createSubmission, gradeSubmission, getAttendance, recordAttendance

Routes (server/routes.ts): Full REST API under /api/classroom/...

Frontend:
- client/src/pages/Classroom.tsx — course listing (teacher: their courses, student: enrolled)
- client/src/pages/CourseDetail.tsx — 4-tab detail (Activities, Students, Grades, Attendance)
- Routes: /classroom and /classroom/:id added to App.tsx

Sidebar: "Aula Virtual" nav item added (School icon)

Auto-migration: server/migrate.ts creates all 5 tables on startup (graceful fail if DB unavailable).

**Why:** User requested Classroom (Aula Virtual) module to manage courses, activities, grades, and attendance.

**How to apply:** Tables are only created when DATABASE_URL is working. Run `npx drizzle-kit push` once credentials are fixed to also push via drizzle.
