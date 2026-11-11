package com.eduboard.service;

import com.eduboard.config.ApiException;
import com.eduboard.config.Times;
import com.eduboard.dto.SessionDtos.*;
import com.eduboard.entity.*;
import com.eduboard.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.*;

/** FR-02, FR-07, FR-08: create, list / search, read, update and delete game sessions. */
@Service
public class SessionService {

    private final GameSessionRepository sessions;
    private final GameSettingRepository settings;
    private final GameRepository games;
    private final LessonRepository lessons;
    private final TeacherRepository teachers;
    private final TeamRepository teams;
    private final TeamMemberRepository members;
    private final StudentRepository students;
    private final QuestionRepository questions;
    private final AnswerRepository answers;

    public SessionService(GameSessionRepository sessions, GameSettingRepository settings, GameRepository games,
                          LessonRepository lessons, TeacherRepository teachers, TeamRepository teams,
                          TeamMemberRepository members, StudentRepository students,
                          QuestionRepository questions, AnswerRepository answers) {
        this.sessions = sessions;
        this.settings = settings;
        this.games = games;
        this.lessons = lessons;
        this.teachers = teachers;
        this.teams = teams;
        this.members = members;
        this.students = students;
        this.questions = questions;
        this.answers = answers;
    }

    // ------------------------------------------------------------------ listing + searching
    @Transactional(readOnly = true)
    public List<SessionDto> search(Long teacherId, String keyword, String status) {
        String k = keyword == null || keyword.isBlank() ? null : keyword.trim();
        String s = status == null || status.isBlank() || status.equals("all") ? null : status;
        return sessions.search(teacherId, k, s).stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public SessionDto get(Long teacherId, Long sessionId) {
        return toDto(owned(teacherId, sessionId));
    }

    // ------------------------------------------------------------------ creating
    /** Creates the session together with its setting, teams (with students) and questions. */
    @Transactional
    public SessionDto create(Long teacherId, SessionDto in) {
        if (in.title() == null || in.title().isBlank()) throw ApiException.badRequest("missing_title");
        List<TeamDto> teamList = in.teams() == null ? List.of() : in.teams();
        if (teamList.size() < 2 || teamList.size() > 6) throw ApiException.badRequest("teams_must_be_2_to_6");
        Game game = games.findByGameType(in.gameType()).orElseThrow(() -> ApiException.badRequest("unknown_game_type"));
        String preset = "standard".equals(in.durationPreset()) ? "standard" : "quick";

        GameSession s = new GameSession();
        s.setTeacher(teachers.getReferenceById(teacherId));
        s.setGame(game);
        s.setLesson(findOrCreateLesson(teacherId, in.subject()));
        s.setSessionName(in.title().trim());
        s.setStatus(in.status() == null ? "in_progress" : in.status());
        if (in.createdAt() != null) s.setStartTime(Times.fromMillis(in.createdAt()));
        s.setTimeRemainingSeconds(in.timeRemainingSeconds());
        s.setBoardStateJson(in.boardState());
        sessions.save(s);

        GameSetting setting = new GameSetting();
        setting.setSession(s);
        setting.setDurationPreset(preset);
        setting.setBoardSize(boardSize(game.getGameType(), preset));
        setting.setTimeLimitMinutes(in.timeLimitMinutes() == null ? 5 : in.timeLimitMinutes());
        settings.save(setting);

        for (TeamDto t : teamList) addTeam(s, t);

        int order = 1;
        for (QuestionDto q : in.questions() == null ? List.<QuestionDto>of() : in.questions()) {
            addQuestion(s, q, order++);
        }
        return toDto(s);
    }

    // ------------------------------------------------------------------ updating
    /**
     * Saves game progress: name, status, timer, board state, finish data and team scores / winners.
     * Teams, students and questions themselves are changed through their own endpoints.
     */
    @Transactional
    public SessionDto update(Long teacherId, Long sessionId, SessionDto in) {
        GameSession s = owned(teacherId, sessionId);
        if (in.title() != null && !in.title().isBlank()) s.setSessionName(in.title().trim());
        if (in.subject() != null) s.setLesson(findOrCreateLesson(teacherId, in.subject()));
        if (in.status() != null) s.setStatus(in.status());
        s.setTimeRemainingSeconds(in.timeRemainingSeconds());
        s.setEndReason(in.endReason());
        if (in.boardState() != null) s.setBoardStateJson(in.boardState());
        if ("completed".equals(s.getStatus())) {
            LocalDateTime end = Times.fromMillis(in.completedAt());
            s.setEndTime(end != null ? end : (s.getEndTime() != null ? s.getEndTime() : LocalDateTime.now()));
        } else {
            s.setEndTime(null);
        }
        if (in.timeLimitMinutes() != null) {
            settings.findById(s.getId()).ifPresent(st -> st.setTimeLimitMinutes(in.timeLimitMinutes()));
        }
        if (in.teams() != null) {
            Map<Long, Team> byId = new HashMap<>();
            teams.findBySessionIdOrderByIdAsc(s.getId()).forEach(t -> byId.put(t.getId(), t));
            for (TeamDto t : in.teams()) {
                Team team = byId.get(parseId(t.id()));
                if (team == null) continue;                       // ignore teams of other sessions
                if (t.score() != null) team.setTeamScore(t.score());
                if (t.winner() != null) team.setWinner(t.winner());
                if (t.name() != null && !t.name().isBlank()) team.setTeamName(t.name().trim());
            }
        }
        return toDto(s);
    }

    // ------------------------------------------------------------------ deleting
    /** ON DELETE CASCADE removes the setting, teams, team members, questions and answers. */
    @Transactional
    public void delete(Long teacherId, Long sessionId) {
        sessions.delete(owned(teacherId, sessionId));
        sessions.flush();
        students.deleteStudentsWithoutTeam();
    }

    // ------------------------------------------------------------------ helpers shared with other services
    public GameSession owned(Long teacherId, Long sessionId) {
        return sessions.findByIdAndTeacherId(sessionId, teacherId).orElseThrow(() -> ApiException.notFound("session"));
    }

    Team addTeam(GameSession s, TeamDto t) {
        Team team = new Team();
        team.setSession(s);
        team.setTeamName(t.name() == null || t.name().isBlank() ? "Team" : t.name().trim());
        team.setColor(t.color() == null ? "red" : t.color());
        team.setTeamScore(t.score() == null ? 0 : t.score());
        teams.save(team);
        Set<String> seen = new HashSet<>();
        for (StudentDto st : t.students() == null ? List.<StudentDto>of() : t.students()) {
            String name = st.name() == null ? "" : st.name().trim();
            if (!name.isEmpty() && seen.add(name.toLowerCase())) addMember(team, name);
        }
        return team;
    }

    Student addMember(Team team, String name) {
        Student student = students.save(new Student(name));
        members.save(new TeamMember(team, student));
        return student;
    }

    Question addQuestion(GameSession s, QuestionDto q, int order) {
        if (q.text() == null || q.text().isBlank()) throw ApiException.badRequest("missing_question_text");
        Question question = new Question();
        question.setSession(s);
        question.setQuestionText(q.text().trim());
        question.setCorrectAnswer(q.answer() == null ? "" : q.answer().trim());
        question.setScore(q.points() == null ? 10 : q.points());
        question.setCategory(blankToNull(q.category()));
        question.setExplanation(blankToNull(q.explanation()));
        question.setQuestionOrder(order);
        return questions.save(question);
    }

    private Lesson findOrCreateLesson(Long teacherId, String subject) {
        if (subject == null || subject.isBlank()) return null;
        String name = subject.trim();
        return lessons.findByTeacherIdAndLessonNameIgnoreCase(teacherId, name).orElseGet(() -> {
            Lesson l = new Lesson();
            l.setTeacher(teachers.getReferenceById(teacherId));
            l.setLessonName(name);
            return lessons.save(l);
        });
    }

    /** BOARD_SIZE from the game and preset (FR-02). */
    static int boardSize(String gameType, String preset) {
        boolean quick = "quick".equals(preset);
        return switch (gameType) {
            case "bingo" -> quick ? 16 : 25;
            case "snakes_ladders" -> quick ? 30 : 36;
            default -> quick ? 20 : 30;           // card_matching: number of cards
        };
    }

    // ------------------------------------------------------------------ entity -> JSON
    public SessionDto toDto(GameSession s) {
        GameSetting st = settings.findById(s.getId()).orElse(null);
        List<TeamDto> teamDtos = teams.findBySessionIdOrderByIdAsc(s.getId()).stream().map(this::toDto).toList();
        List<QuestionDto> questionDtos = questions.findBySessionIdOrderByQuestionOrderAsc(s.getId())
                .stream().map(SessionService::toDto).toList();
        return new SessionDto(
                String.valueOf(s.getId()),
                s.getSessionName(),
                s.getLesson() == null ? null : s.getLesson().getLessonName(),
                s.getGame().getGameType(),
                s.getStatus(),
                st == null ? null : st.getDurationPreset(),
                st == null ? null : st.getBoardSize(),
                st == null ? null : st.getTimeLimitMinutes(),
                s.getTimeRemainingSeconds(),
                Times.toMillis(s.getStartTime()),
                Times.toMillis(s.getEndTime()),
                s.getEndReason(),
                s.getBoardStateJson(),
                teamDtos,
                questionDtos);
    }

    public TeamDto toDto(Team t) {
        List<StudentDto> studentDtos = members.findByTeamIdOrderByStudentIdAsc(t.getId()).stream()
                .map(m -> new StudentDto(String.valueOf(m.getStudent().getId()), m.getStudent().getStudentName()))
                .toList();
        return new TeamDto(String.valueOf(t.getId()), t.getTeamName(), t.getColor(), t.getTeamScore(), t.getWinner(),
                studentDtos,
                answers.countByTeamIdAndCorrect(t.getId(), true),
                answers.countByTeamIdAndCorrect(t.getId(), false));
    }

    public static QuestionDto toDto(Question q) {
        return new QuestionDto(String.valueOf(q.getId()), q.getQuestionText(), q.getCorrectAnswer(), q.getScore(),
                q.getCategory(), q.getExplanation(), q.getQuestionOrder());
    }

    static Long parseId(String id) {
        try {
            return id == null ? null : Long.parseLong(id);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static String blankToNull(String s) { return s == null || s.isBlank() ? null : s.trim(); }
}
