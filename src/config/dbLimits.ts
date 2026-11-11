/**
 * Column sizes of the database (schema.sql / Data Dictionary in the SRS).
 * The web app keeps every text inside these sizes so that what is shown on screen
 * is exactly what is stored in the database.
 */
export const DB_LIMITS = {
  username: 50,       // TEACHER.USERNAME      VARCHAR(50)
  teacherName: 100,   // TEACHER.TEACHER_NAME  VARCHAR(100)
  sessionName: 100,   // GAME_SESSION.SESSION_NAME VARCHAR(100)
  lessonName: 100,    // LESSON.LESSON_NAME    VARCHAR(100)
  teamName: 50,       // TEAM.TEAM_NAME        VARCHAR(50)
  studentName: 100,   // STUDENT.STUDENT_NAME  VARCHAR(100)
  correctAnswer: 255, // QUESTION.CORRECT_ANSWER VARCHAR(255)
  category: 50,       // QUESTION.CATEGORY     VARCHAR(50)
} as const;

/** Trims a text and cuts it to the column size. */
export const fit = (value: string | undefined | null, max: number): string => (value ?? '').trim().slice(0, max);

/** QUESTION.SCORE must be a whole number >= 0 (CHECK constraint). */
export const fitPoints = (value: number | undefined | null): number =>
  Number.isFinite(value) ? Math.max(0, Math.round(value as number)) : 10;
