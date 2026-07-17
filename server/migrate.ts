import { pool } from "./db";

export async function runMigrations(): Promise<void> {
  const client = await pool.connect().catch((err) => {
    console.warn("[migrate] Cannot connect to DB:", err.message);
    return null;
  });
  if (!client) return;

  try {
    await client.query("BEGIN");

    // ── Classroom tables ──────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        institution_id UUID REFERENCES institution_settings(id) ON DELETE CASCADE,
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
        grade VARCHAR(50),
        feedback TEXT,
        graded_at TIMESTAMP,
        graded_by VARCHAR REFERENCES users(id),
        status VARCHAR(50) NOT NULL DEFAULT 'submitted'
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        institution_id UUID REFERENCES institution_settings(id) ON DELETE CASCADE,
        course_id VARCHAR NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        student_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        date TIMESTAMP NOT NULL,
        status VARCHAR(50) NOT NULL,
        notes TEXT,
        recorded_by VARCHAR NOT NULL REFERENCES users(id),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // ── Gradebook ─────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS gradebook_entries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        institution_id UUID NOT NULL REFERENCES institution_settings(id) ON DELETE CASCADE,
        student_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        subject_id VARCHAR NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
        group_id VARCHAR NOT NULL REFERENCES academic_groups(id) ON DELETE CASCADE,
        academic_period_id VARCHAR NOT NULL REFERENCES academic_periods(id) ON DELETE CASCADE,
        grade VARCHAR(50) NOT NULL,
        notes TEXT,
        recorded_by VARCHAR NOT NULL REFERENCES users(id),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Migrate old integer grade column if it exists
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='gradebook_entries' AND column_name='grade'
          AND data_type='integer'
        ) THEN
          ALTER TABLE gradebook_entries ALTER COLUMN grade TYPE VARCHAR(50) USING grade::text;
        END IF;
      END$$;
    `);

    // ── Institution settings new columns ─────────────────────────────────
    await client.query(`
      ALTER TABLE institution_settings
        ADD COLUMN IF NOT EXISTS qualitative_scale VARCHAR(255),
        ADD COLUMN IF NOT EXISTS email_allowed_domain VARCHAR(255),
        ADD COLUMN IF NOT EXISTS gc_client_id VARCHAR(255),
        ADD COLUMN IF NOT EXISTS gc_client_secret VARCHAR(255);
    `);

    // ── Google Classroom tokens ───────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS google_classroom_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        institution_id UUID NOT NULL REFERENCES institution_settings(id) ON DELETE CASCADE,
        access_token TEXT NOT NULL,
        refresh_token TEXT,
        expires_at TIMESTAMP,
        email VARCHAR(255),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS google_classroom_course_links (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        course_id VARCHAR NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        gc_course_id VARCHAR(100) NOT NULL,
        gc_course_name VARCHAR(255),
        teacher_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        institution_id UUID NOT NULL REFERENCES institution_settings(id) ON DELETE CASCADE,
        last_sync_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // ── Indexes ────────────────────────────────────────────────────────────
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_courses_teacher ON courses(teacher_id);
      CREATE INDEX IF NOT EXISTS idx_courses_active ON courses(is_active);
    \`);

    await client.query(\`
      ALTER TABLE courses
        ADD COLUMN IF NOT EXISTS academic_group_id VARCHAR REFERENCES academic_groups(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS academic_period_id VARCHAR REFERENCES academic_periods(id) ON DELETE SET NULL;
    \`);

    await client.query(\`
      CREATE INDEX IF NOT EXISTS idx_enrollments_course ON course_enrollments(course_id);
      CREATE INDEX IF NOT EXISTS idx_enrollments_student ON course_enrollments(student_id);
      CREATE INDEX IF NOT EXISTS idx_activities_course ON activities(course_id);
      CREATE INDEX IF NOT EXISTS idx_submissions_activity ON submissions(activity_id);
      CREATE INDEX IF NOT EXISTS idx_submissions_student ON submissions(student_id);
      CREATE INDEX IF NOT EXISTS idx_attendance_course ON attendance(course_id);
      CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
      CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
      CREATE INDEX IF NOT EXISTS idx_gradebook_student ON gradebook_entries(student_id);
      CREATE INDEX IF NOT EXISTS idx_gradebook_subject ON gradebook_entries(subject_id);
      CREATE INDEX IF NOT EXISTS idx_gradebook_period ON gradebook_entries(academic_period_id);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_gradebook_unique
        ON gradebook_entries(student_id, subject_id, academic_period_id);
      CREATE INDEX IF NOT EXISTS idx_gc_tokens_user ON google_classroom_tokens(user_id);
    `);

    // ── Direct messages (chat privado) ──────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS direct_messages (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        sender_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        receiver_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        institution_id UUID NOT NULL REFERENCES institution_settings(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        media_url VARCHAR,
        media_type VARCHAR,
        read_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_dm_sender ON direct_messages(sender_id);
      CREATE INDEX IF NOT EXISTS idx_dm_receiver ON direct_messages(receiver_id);
      CREATE INDEX IF NOT EXISTS idx_dm_created ON direct_messages(created_at);
    `);

    // ── Tabla de sesiones (connect-pg-simple) ───────────────────────────────
    // La creamos aquí (con manejo de errores ya probado) en vez de dejar que
    // connect-pg-simple la cree sola con "createTableIfMissing" — si el rol
    // de conexión no tiene permiso de CREATE TABLE (común en algunos
    // proveedores gestionados), ese intento fallaba sin control y tumbaba el
    // proceso en cada arranque, lo que hacía parecer que el login "no pegaba"
    // y el sistema se reiniciaba solo.
    await client.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL
      ) WITH (OIDS=FALSE);
    `);
    await client.query(`
      DO $$
      BEGIN
        ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;
      EXCEPTION WHEN duplicate_object THEN
        NULL; -- la restricción ya existe, no hacer nada
      END $$;
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");`);

    await client.query("COMMIT");
    console.log("[migrate] All migrations OK");
  } catch (err: any) {
    await client.query("ROLLBACK").catch(() => {});
    console.warn("[migrate] Migration error (non-fatal):", err.message);
  } finally {
    client.release();
  }
}
