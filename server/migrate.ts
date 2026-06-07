import { pool } from "./db";

/**
 * Runs a lightweight startup migration to create any missing tables.
 * Errors are logged but do not crash the server.
 */
export async function runMigrations(): Promise<void> {
  const client = await pool.connect().catch((err) => {
    console.warn("[migrate] Cannot connect to DB (will retry on next request):", err.message);
    return null;
  });
  if (!client) return;

  try {
    await client.query("BEGIN");

    await client.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        subject VARCHAR(100) NOT NULL,
        teacher_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        grade VARCHAR(50),
        semester VARCHAR(50),
        academic_year VARCHAR(20),
        cover_image_url VARCHAR,
        group_id VARCHAR REFERENCES groups(id) ON DELETE SET NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS course_enrollments (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        course_id VARCHAR NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        student_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        enrolled_at TIMESTAMP NOT NULL DEFAULT NOW(),
        status VARCHAR(50) NOT NULL DEFAULT 'active'
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS activities (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        course_id VARCHAR NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        type VARCHAR(50) NOT NULL,
        due_date TIMESTAMP,
        max_score INTEGER NOT NULL DEFAULT 100,
        attachments TEXT[] DEFAULT '{}',
        is_published BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS submissions (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        activity_id VARCHAR NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
        student_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT,
        attachments TEXT[] DEFAULT '{}',
        submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
        grade INTEGER,
        feedback TEXT,
        graded_at TIMESTAMP,
        graded_by VARCHAR REFERENCES users(id),
        status VARCHAR(50) NOT NULL DEFAULT 'submitted'
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        course_id VARCHAR NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        student_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        date TIMESTAMP NOT NULL,
        status VARCHAR(50) NOT NULL,
        notes TEXT,
        recorded_by VARCHAR NOT NULL REFERENCES users(id),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_courses_teacher ON courses(teacher_id);
      CREATE INDEX IF NOT EXISTS idx_courses_active ON courses(is_active);
      CREATE INDEX IF NOT EXISTS idx_enrollments_course ON course_enrollments(course_id);
      CREATE INDEX IF NOT EXISTS idx_enrollments_student ON course_enrollments(student_id);
      CREATE INDEX IF NOT EXISTS idx_activities_course ON activities(course_id);
      CREATE INDEX IF NOT EXISTS idx_submissions_activity ON submissions(activity_id);
      CREATE INDEX IF NOT EXISTS idx_submissions_student ON submissions(student_id);
      CREATE INDEX IF NOT EXISTS idx_attendance_course ON attendance(course_id);
      CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
      CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
    `);

    await client.query("COMMIT");
    console.log("[migrate] Classroom tables OK");
  } catch (err: any) {
    await client.query("ROLLBACK").catch(() => {});
    console.warn("[migrate] Migration error (non-fatal):", err.message);
  } finally {
    client.release();
  }
}
