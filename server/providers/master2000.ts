import type {
  IAcademicProvider,
  AcademicStudent,
  AcademicTeacher,
  AcademicCourse,
  AcademicGrade,
  AcademicAttendanceRecord,
  SyncResult,
} from "./academic-provider";

/**
 * Master 2000 Academic System Integration
 *
 * Stub implementation — ready to connect when credentials are available.
 * To activate: set MASTER2000_API_URL and MASTER2000_API_KEY environment variables.
 *
 * Expected API format (adapt when real docs are available):
 *   GET /api/students        → AcademicStudent[]
 *   GET /api/teachers        → AcademicTeacher[]
 *   GET /api/courses         → AcademicCourse[]
 *   GET /api/grades/:id      → AcademicGrade[]
 *   GET /api/attendance/:id  → AcademicAttendanceRecord[]
 */
export class Master2000Provider implements IAcademicProvider {
  private baseUrl: string | undefined;
  private apiKey: string | undefined;

  constructor() {
    this.baseUrl = process.env.MASTER2000_API_URL;
    this.apiKey = process.env.MASTER2000_API_KEY;
  }

  isAvailable(): boolean {
    return !!(this.baseUrl && this.apiKey);
  }

  getStatusMessage(): string {
    if (this.isAvailable()) {
      return `Master 2000 conectado en: ${this.baseUrl}`;
    }
    return "Master 2000 no configurado. Configure las variables MASTER2000_API_URL y MASTER2000_API_KEY para habilitar la integración.";
  }

  private checkAvailability(): void {
    if (!this.isAvailable()) {
      throw new Error(this.getStatusMessage());
    }
  }

  private async apiFetch<T>(path: string): Promise<T> {
    this.checkAvailability();
    const res = await fetch(`${this.baseUrl}${path}`, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) {
      throw new Error(`Master 2000 API error: ${res.status} ${res.statusText}`);
    }
    return res.json();
  }

  async getStudents(): Promise<AcademicStudent[]> {
    // TODO: uncomment when API is available
    // return this.apiFetch<AcademicStudent[]>('/api/students');
    this.checkAvailability();
    return [];
  }

  async getTeachers(): Promise<AcademicTeacher[]> {
    // TODO: uncomment when API is available
    // return this.apiFetch<AcademicTeacher[]>('/api/teachers');
    this.checkAvailability();
    return [];
  }

  async getCourses(): Promise<AcademicCourse[]> {
    // TODO: uncomment when API is available
    // return this.apiFetch<AcademicCourse[]>('/api/courses');
    this.checkAvailability();
    return [];
  }

  async getGradesByStudent(studentExternalId: string): Promise<AcademicGrade[]> {
    // TODO: uncomment when API is available
    // return this.apiFetch<AcademicGrade[]>(`/api/grades/${studentExternalId}`);
    this.checkAvailability();
    return [];
  }

  async getAttendanceByStudent(
    studentExternalId: string
  ): Promise<AcademicAttendanceRecord[]> {
    // TODO: uncomment when API is available
    // return this.apiFetch<AcademicAttendanceRecord[]>(`/api/attendance/${studentExternalId}`);
    this.checkAvailability();
    return [];
  }

  async syncToLocalDB(): Promise<SyncResult> {
    this.checkAvailability();
    // Full sync implementation — wire up when API is confirmed:
    // 1. Fetch students → create/update User records with externalId
    // 2. Fetch courses  → create/update Course records
    // 3. Fetch grades   → create/update Submission records
    // 4. Fetch attendance → create/update Attendance records
    return { imported: 0, updated: 0, skipped: 0, errors: [] };
  }
}

export const master2000Provider = new Master2000Provider();
