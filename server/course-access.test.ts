import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canAccessCourseContent,
  canManageCourseAttendance,
  canReviewCourseSubmissions,
  canViewCourseRoster,
} from "./course-access";

const course = { institutionId: "school-a", teacherId: "teacher-a" };

describe("course access policy", () => {
  it("allows only active students enrolled in the same institution", () => {
    const student = { id: "student-a", role: "student", institutionId: "school-a" };
    assert.equal(canAccessCourseContent(course, student, true), true);
    assert.equal(canAccessCourseContent(course, student, false), false);
    assert.equal(canAccessCourseContent(course, { ...student, institutionId: "school-b" }, true), false);
  });

  it("limits teachers to courses assigned to them", () => {
    const assigned = { id: "teacher-a", role: "teacher", institutionId: "school-a" };
    assert.equal(canAccessCourseContent(course, assigned), true);
    assert.equal(canAccessCourseContent(course, { ...assigned, id: "teacher-b" }), false);
    assert.equal(canReviewCourseSubmissions(course, { ...assigned, id: "teacher-b" }), false);
  });

  it("keeps academic review access institutional and excludes secretaries from private records", () => {
    const coordinator = { id: "coord-a", role: "coordinator", institutionId: "school-a" };
    const secretary = { id: "secretary-a", role: "secretary", institutionId: "school-a" };
    assert.equal(canReviewCourseSubmissions(course, coordinator), true);
    assert.equal(canManageCourseAttendance(course, coordinator), true);
    assert.equal(canViewCourseRoster(course, coordinator), true);
    assert.equal(canReviewCourseSubmissions(course, secretary), false);
    assert.equal(canViewCourseRoster(course, secretary), false);
    assert.equal(canReviewCourseSubmissions(course, { ...coordinator, institutionId: "school-b" }), false);
  });
});
