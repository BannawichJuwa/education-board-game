-- =====================================================================
-- Education Board Game - database schema (ERD v1.1, 10 tables)
-- Matches Appendix A (ERD and data dictionary) of the SRS and ERD_v1.1.drawio. Runs at every start,
-- IF NOT EXISTS keeps existing data.
-- Stored values are lowercase to match the web application:
--   game_type       : bingo | snakes_ladders | card_matching
--   duration_preset : quick | standard
--   status          : in_progress | completed   (draft is reserved, not used by the web app)
-- =====================================================================

CREATE TABLE IF NOT EXISTS teacher (
  teacher_id    INT          NOT NULL AUTO_INCREMENT,
  username      VARCHAR(50)  NOT NULL,
  teacher_name  VARCHAR(100) NOT NULL,
  password      VARCHAR(255) NOT NULL,                      -- BCrypt hash only
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login_at DATETIME     NULL,
  PRIMARY KEY (teacher_id),
  CONSTRAINT uq_teacher_username UNIQUE (username)
);

CREATE TABLE IF NOT EXISTS lesson (
  lesson_id   INT          NOT NULL AUTO_INCREMENT,
  teacher_id  INT          NOT NULL,
  lesson_name VARCHAR(100) NOT NULL,
  PRIMARY KEY (lesson_id),
  CONSTRAINT uq_lesson_teacher_name UNIQUE (teacher_id, lesson_name),
  CONSTRAINT fk_lesson_teacher FOREIGN KEY (teacher_id)
    REFERENCES teacher (teacher_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS game (
  game_id     INT          NOT NULL AUTO_INCREMENT,
  game_name   VARCHAR(100) NOT NULL,
  game_type   VARCHAR(20)  NOT NULL,
  description TEXT         NULL,
  PRIMARY KEY (game_id),
  CONSTRAINT uq_game_type  UNIQUE (game_type),
  CONSTRAINT chk_game_type CHECK (game_type IN ('bingo','snakes_ladders','card_matching'))
);

CREATE TABLE IF NOT EXISTS game_session (
  session_id             INT          NOT NULL AUTO_INCREMENT,
  game_id                INT          NOT NULL,
  teacher_id             INT          NOT NULL,
  lesson_id              INT          NULL,
  session_name           VARCHAR(100) NOT NULL,
  status                 VARCHAR(20)  NOT NULL DEFAULT 'in_progress',
  start_time             DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  end_time               DATETIME     NULL,
  end_reason             VARCHAR(30)  NULL,
  time_remaining_seconds INT          NULL,
  board_state_json       LONGTEXT     NULL,
  PRIMARY KEY (session_id),
  CONSTRAINT chk_session_status CHECK (status IN ('draft','in_progress','completed')),
  CONSTRAINT chk_session_reason CHECK (end_reason IS NULL OR end_reason IN
    ('bingo_line','bingo_territory','bingo_score','snakes_finish','snakes_score',
     'cards_all_matched','cards_score','highest_score','time_up','teacher_finish')),
  CONSTRAINT chk_session_time   CHECK (time_remaining_seconds IS NULL OR time_remaining_seconds >= 0),
  CONSTRAINT fk_session_game    FOREIGN KEY (game_id)    REFERENCES game (game_id),
  CONSTRAINT fk_session_teacher FOREIGN KEY (teacher_id) REFERENCES teacher (teacher_id) ON DELETE CASCADE,
  CONSTRAINT fk_session_lesson  FOREIGN KEY (lesson_id)  REFERENCES lesson (lesson_id)   ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS game_setting (
  session_id         INT         NOT NULL,
  duration_preset    VARCHAR(10) NOT NULL,
  board_size         INT         NOT NULL,
  time_limit_minutes INT         NOT NULL,
  PRIMARY KEY (session_id),
  CONSTRAINT chk_setting_preset CHECK (duration_preset IN ('quick','standard')),
  CONSTRAINT chk_setting_board  CHECK (board_size > 0),
  CONSTRAINT chk_setting_time   CHECK (time_limit_minutes > 0),
  CONSTRAINT fk_setting_session FOREIGN KEY (session_id)
    REFERENCES game_session (session_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS team (
  team_id    INT         NOT NULL AUTO_INCREMENT,
  session_id INT         NOT NULL,
  team_name  VARCHAR(50) NOT NULL,
  color      VARCHAR(10) NOT NULL,
  team_score INT         NOT NULL DEFAULT 0,
  is_winner  BOOLEAN     NOT NULL DEFAULT FALSE,     -- TRUE for the winning team of a completed session
  PRIMARY KEY (team_id),
  CONSTRAINT chk_team_color CHECK (color IN ('red','blue','green','orange','purple','pink')),
  CONSTRAINT fk_team_session FOREIGN KEY (session_id)
    REFERENCES game_session (session_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS student (
  student_id   INT          NOT NULL AUTO_INCREMENT,
  student_name VARCHAR(100) NOT NULL,
  PRIMARY KEY (student_id)
);

CREATE TABLE IF NOT EXISTS team_member (
  team_id    INT NOT NULL,
  student_id INT NOT NULL,
  PRIMARY KEY (team_id, student_id),
  CONSTRAINT fk_member_team    FOREIGN KEY (team_id)    REFERENCES team (team_id)       ON DELETE CASCADE,
  CONSTRAINT fk_member_student FOREIGN KEY (student_id) REFERENCES student (student_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS question (
  question_id    INT          NOT NULL AUTO_INCREMENT,
  session_id     INT          NOT NULL,
  question_text  TEXT         NOT NULL,
  correct_answer VARCHAR(255) NOT NULL,
  score          INT          NOT NULL DEFAULT 10,
  category       VARCHAR(50)  NULL,
  explanation    TEXT         NULL,
  question_order INT          NOT NULL,
  PRIMARY KEY (question_id),
  CONSTRAINT chk_question_score CHECK (score >= 0),
  CONSTRAINT fk_question_session FOREIGN KEY (session_id)
    REFERENCES game_session (session_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS answer (
  answer_id   INT      NOT NULL AUTO_INCREMENT,
  team_id     INT      NOT NULL,
  question_id INT      NOT NULL,
  is_correct  BOOLEAN  NOT NULL,
  score       INT      NOT NULL DEFAULT 0,
  answered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (answer_id),
  CONSTRAINT chk_answer_score CHECK (score >= 0),
  CONSTRAINT fk_answer_team     FOREIGN KEY (team_id)     REFERENCES team (team_id)         ON DELETE CASCADE,
  CONSTRAINT fk_answer_question FOREIGN KEY (question_id) REFERENCES question (question_id) ON DELETE CASCADE
);

-- The three GAME rows are inserted by DataSeeder.java when the table is empty.
