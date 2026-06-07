// Abstract interface for academic system providers (Master 2000, etc.)

export interface AcademicStudent {
  externalId: string;
  firstName: string;
  lastName: string;
  email: string;
  grade: string;
  section?: string;
}

export interface AcademicTeacher {
  externalId: string;
  firstName: string;
  lastName: string;
  email: string;
  subjects: string[];
}

export interface AcademicCourse {
  externalId: string;
  name: string;
  subject: string;
  grade: string;
  section?: string;
  teacherExternalId: string;
}

export interface AcademicGrade {
  studentExternalId: string;
  courseExternalId: string;
  period: string;
  score: number;
  maxScore: number;
  date: Date;
  activityType?: string;
}

export interface AcademicAttendanceRecord {
  studentExternalId: string;
  courseExternalId: string;
  date: Date;
  status: "present" | "absent" | "late" | "excused";
  notes?: string;
}

export interface SyncResult {
  imported: number;
  updated: number;
  skipped: number;
  errors: string[];
}

export interface IAcademicProvider {
  /** Whether the provider is fully configured and available */
  isAvailable(): boolean;

  /** Get configuration status message for admin display */
  getStatusMessage(): string;

  /** List all students from the academic system */
  getStudents(): Promise<AcademicStudent[]>;

  /** List all teachers from the academic system */
  getTeachers(): Promise<AcademicTeacher[]>;

  /** List all courses/subjects from the academic system */
  getCourses(): Promise<AcademicCourse[]>;

  /** Get all grades for a specific student */
  getGradesByStudent(studentExternalId: string): Promise<AcademicGrade[]>;

  /** Get attendance records for a specific student */
  getAttendanceByStudent(studentExternalId: string): Promise<AcademicAttendanceRecord[]>;

  /** Sync all data from the academic system into the local database */
  syncToLocalDB(): Promise<SyncResult>;
}
