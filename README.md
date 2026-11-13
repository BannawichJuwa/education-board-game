# Education Board Game

> ## 🌐 Live website: **[https://eduboard-798471611335.us-central1.run.app](https://eduboard-798471611335.us-central1.run.app)**
>
> Deployed on Google Cloud Run (Spring Boot + MySQL on Cloud SQL). Open it in any browser – no install needed.
> Create your own teacher account on the **Log In** page, or play without an account (Guest Mode).
> Sitemap of every page and its functions: [/sitemap.xml](https://eduboard-798471611335.us-central1.run.app/sitemap.xml)

Education Board Game is a classroom web application that turns a quiz into a team board game played on one
projector screen. The teacher creates a session (subject, game, board size, time limit, teams and questions),
reads each question aloud, picks the team that raised a hand first and marks the answer Correct or Wrong; only a
correct team may claim a Bingo tile, roll the dice in Snakes & Ladders or flip cards in Card Matching. The teacher
can save a session and continue it later, or end it to see the winner (ties are shared as co-champions), the
scoreboard and a CSV report. Logged-in teachers keep their sessions in the database (Spring Boot + JPA);
Guest Mode keeps sessions in the browser for 24 hours.

## GROUP MEMBERS

```
6831503036   Chanon Phetsuit 
6831503047   Daniel Yee-wangkong  
6831503049   Traiwit Jaroensri 
6831503055   Bannawich Juwa 
6831503084  
```

## How to run the project

Requirements: **JDK 17 or newer** and **Maven 3.9+** (Node.js is not needed to run it).

1. Clone the repository and go into the folder:
   ```bash
   git clone https://github.com/BannawichJuwa/education-board-game.git
   cd education-board-game
   ```
2. Start the application (`pom.xml` is at the root; the Spring Boot module is `backend/`):
   ```bash
   mvn spring-boot:run
   ```
   The first start downloads the Maven dependencies. It is ready when the log shows `Started EduboardApplication`.
3. Open **http://localhost:8080** in the browser (port **8080**).
4. Test login: username **`demo`**, password **`demo1234`** (created automatically in the local database).
   You can also register a new account on the Log In page, or play without an account (Guest Mode).
5. Try it: **Create Game** → choose a game → add teams → **Load Sample Questions** → **Create & Start Game**
   → select a team → **Correct** → **Save / End Game**.

Useful addresses while it is running:

| Address | What it is |
|---|---|
| http://localhost:8080 | The web application |
| http://localhost:8080/sitemap.xml | Sitemap of every page and its functions |
| http://localhost:8080/swagger-ui.html | Swagger UI to try every REST endpoint |
| http://localhost:8080/h2-console | H2 database console. JDBC URL `jdbc:h2:file:./data/eduboard;MODE=MySQL;DATABASE_TO_LOWER=TRUE;CASE_INSENSITIVE_IDENTIFIERS=TRUE`, user `sa`, empty password |

Other commands:

```bash
mvn test                      # automated API test (backend/src/test/.../ApiFlowTest.java)
```

The local database is an H2 file in `backend/data/` (created on the first run, not committed).
The live version runs on Google Cloud Run with MySQL on Cloud SQL: **[https://eduboard-798471611335.us-central1.run.app](https://eduboard-798471611335.us-central1.run.app)**
(steps in [DEPLOY.md](DEPLOY.md); passwords and secrets are given as environment variables, never stored in the repository).

### Changing the frontend (only for developers)

The React source is in `src/`. With Node.js 20+:

```bash
npm install --legacy-peer-deps
npm run dev            # http://localhost:3000, /api is sent to the backend on 8080 (run mvn spring-boot:run too)
npm run build:spring   # rebuild the website into backend/src/main/resources/static before committing
```

On Windows, `start-dev.bat` starts the backend (8080) and the frontend dev server (3000) together.

## Technology

| Part | Technology |
|---|---|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS |
| Backend | Java 17, Spring Boot 3.4, Spring Web (REST), Spring Data JPA, BCrypt |
| Database | H2 (local) / MySQL 8 on Google Cloud SQL (deployment) |
| Deployment | Docker, Google Cloud Run |

## Pages

Every page has its own address: `/` (Main Menu), `/login`, `/dashboard`, `/sessions`, `/create`, `/how-to-play`,
`/game/{sessionId}`, `/scoreboard/{sessionId}`. The functions of each page are listed in `/sitemap.xml`.

## Database (10 tables)

`TEACHER`, `LESSON`, `GAME`, `GAME_SESSION`, `GAME_SETTING`, `TEAM`, `STUDENT`, `TEAM_MEMBER`, `QUESTION`, `ANSWER`.
The SQL that creates them is [backend/src/main/resources/schema.sql](backend/src/main/resources/schema.sql).

## JPA entities and REST API

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

## Project structure

```
pom.xml                  root build file (runs the backend module)
backend/                 Spring Boot application
  src/main/java/com/eduboard/
    entity/              JPA entities (one per table)
    repository/          Spring Data JPA repositories
    service/             business rules
    controller/          REST controllers + page addresses
    dto/                 JSON request / response shapes
    config/              login token, error handling, Swagger, seed data
  src/main/resources/    application.properties, schema.sql, static/ (built website)
src/                     React source code
public/                  sitemap.xml, robots.txt
Dockerfile               builds frontend + backend into one container for Cloud Run
DEPLOY.md                Google Cloud deployment steps
```
