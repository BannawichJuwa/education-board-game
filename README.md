# Education Board Game

A classroom quiz board game that the teacher runs on one projector screen. Students answer verbally in teams;
the teacher marks answers Correct or Wrong, and the winning team moves on the board.
Three games: **Classroom Bingo**, **Snakes & Ladders**, and **Card Matching**.

## Members

| Student ID | Name |
|---|---|
| 6831503055 | Bannawich Juwa |
| 6831503036 | Chanon Phetsuit |
| 6831503047 | Daniel Yee-Wangkong |
| 6831503049 | Traiwit Jaroensri |
| 6831503084 | Kalutara Koralalage Himsara Britto Adikaram |

## Technology

| Part | Technology |
|---|---|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS (custom CSS theme) |
| Backend | Java 17, Spring Boot 3, Spring Web (REST), Spring Data JPA |
| Database | MySQL on Google Cloud SQL (deployment) / H2 embedded (local) |
| Deployment | Google Cloud Run + Cloud SQL |

**Live site:** https://YOUR-CLOUD-RUN-URL (see [DEPLOY.md](DEPLOY.md))

## Database (10 tables)

`TEACHER`, `LESSON`, `GAME`, `GAME_SESSION`, `GAME_SETTING`, `TEAM`, `STUDENT`, `TEAM_MEMBER`, `QUESTION`, `ANSWER`.
The SQL that creates them is in [backend/src/main/resources/schema.sql](backend/src/main/resources/schema.sql).

## JPA entities and controls

Entities (`backend/src/main/java/com/eduboard/entity`): Teacher, Lesson, Game, GameSession, GameSetting, Team,
Student, TeamMember, Question, Answer.

| Control | Endpoint |
|---|---|
| Listing | `GET /api/sessions` |
| Searching | `GET /api/sessions?q=keyword&status=in_progress` |
| Creating | `POST /api/sessions` (session + setting + teams + students + questions) |
| Updating | `PUT /api/sessions/{id}` (scores, board, timer, finish) |
| Deleting | `DELETE /api/sessions/{id}` (cascade to teams, questions, answers) |
| Managing related entities | `POST /api/sessions/{id}/teams`, `PUT/DELETE /api/teams/{id}`, `POST /api/teams/{id}/students`, `DELETE /api/teams/{id}/students/{studentId}`, `GET/POST /api/sessions/{id}/questions`, `PUT/DELETE /api/questions/{id}` |
| Answers | `POST /api/answers`, `GET/DELETE /api/sessions/{id}/answers` |
| Accounts | `POST /api/auth/register`, `POST /api/auth/login`, `GET/DELETE /api/auth/me` |

Passwords are stored as BCrypt hashes. Every `/api` request except login, register and `/api/games`
needs the login token, and a teacher can only reach their own sessions.
Guest Mode (no login) keeps sessions in the browser only, deleted after 24 hours.

## Run on your computer

Requirements: JDK 17+, Maven, Node.js 20+.

**Windows:** double-click `start-dev.bat`. It opens two windows (backend on 8080, frontend on 3000)
and then the browser. Log In / Register only work while the backend window is running.

Or start the two parts by hand:

```bash
# terminal 1 - backend (http://localhost:8080)
cd backend
mvn spring-boot:run

# terminal 2 - frontend (http://localhost:3000, /api is proxied to 8080)
npm install --legacy-peer-deps
npm run dev
```

- Swagger UI (try every endpoint): http://localhost:8080/swagger-ui.html
- H2 console (tables and SQL): http://localhost:8080/h2-console -
  JDBC URL `jdbc:h2:file:./data/eduboard;MODE=MySQL;DATABASE_TO_LOWER=TRUE;CASE_INSENSITIVE_IDENTIFIERS=TRUE`, user `sa`, no password
- Tests: `cd backend && mvn test`

## Project structure

```
backend/                 Spring Boot API
  src/main/java/com/eduboard/
    entity/              JPA entities (one per table)
    repository/          Spring Data JPA repositories
    service/             business rules
    controller/          REST controllers
    dto/                 JSON request / response shapes
    config/              login token, error handling, Swagger, seed data
  src/main/resources/    application.properties, schema.sql
src/                     React app
  api/serverSync.ts      calls the REST API
Dockerfile               builds frontend + backend into one container for Cloud Run
DEPLOY.md                Google Cloud deployment steps
```
