package com.eduboard;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Runs the whole API against an in-memory H2 database: every CRUD control the course asks for. */
@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = "spring.datasource.url=jdbc:h2:mem:test;MODE=MySQL;DATABASE_TO_LOWER=TRUE;CASE_INSENSITIVE_IDENTIFIERS=TRUE")
class ApiFlowTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired JdbcTemplate jdbc;

    private static final String NEW_SESSION = """
        {"title":"Midterm Review","subject":"Computer Science","gameType":"bingo","status":"in_progress",
         "durationPreset":"quick","timeLimitMinutes":5,"timeRemainingSeconds":300,"boardState":"{\\"x\\":1}",
         "teams":[{"name":"Team 1 (Red)","color":"red","score":0,"students":[{"name":"Emily"},{"name":"Noah"}]},
                  {"name":"Team 2 (Blue)","color":"blue","score":0,"students":[{"name":"Mia"}]}],
         "questions":[{"text":"What does CPU stand for?","answer":"Central Processing Unit","points":10},
                      {"text":"Bits in a byte?","answer":"8","points":10}]}
        """;

    @Test
    void fullCrudFlow() throws Exception {
        // FR-01 register + login, password stored as a BCrypt hash
        String token = token(post("/api/auth/register").content("{\"username\":\"teacher01\",\"name\":\"Prof. A\",\"password\":\"1234\"}"));
        assertThat(jdbc.queryForObject("SELECT password FROM teacher WHERE username='teacher01'", String.class)).startsWith("$2");
        call(post("/api/auth/register").content("{\"username\":\"teacher01\",\"name\":\"X\",\"password\":\"1234\"}"), null)
                .andExpect(status().isConflict());
        call(post("/api/auth/login").content("{\"username\":\"teacher01\",\"password\":\"wrong\"}"), null)
                .andExpect(status().isUnauthorized());
        token(post("/api/auth/login").content("{\"username\":\"teacher01\",\"password\":\"1234\"}"));

        // NFR-01: no token -> 401
        call(get("/api/sessions"), null).andExpect(status().isUnauthorized());

        // Creating
        JsonNode created = body(call(post("/api/sessions").content(NEW_SESSION), token).andExpect(status().isCreated()));
        String sessionId = created.get("id").asText();
        assertThat(created.get("teams")).hasSize(2);
        assertThat(created.get("teams").get(0).get("students")).hasSize(2);
        assertThat(created.get("boardSize").asInt()).isEqualTo(16);
        String team1 = created.get("teams").get(0).get("id").asText();
        String team2 = created.get("teams").get(1).get("id").asText();
        String q1 = created.get("questions").get(0).get("id").asText();

        // Listing + Searching
        assertThat(body(call(get("/api/sessions"), token))).hasSize(1);
        assertThat(body(call(get("/api/sessions?q=midterm"), token))).hasSize(1);
        assertThat(body(call(get("/api/sessions?q=computer"), token))).hasSize(1);   // matches the lesson name
        assertThat(body(call(get("/api/sessions?q=history"), token))).isEmpty();
        assertThat(body(call(get("/api/sessions?status=completed"), token))).isEmpty();

        // Answers: wrong, correct, then duplicate correct is rejected (anti-duplicate scoring)
        call(post("/api/answers").content(answer(team2, q1, false)), token).andExpect(status().isCreated());
        call(post("/api/answers").content(answer(team1, q1, true)), token).andExpect(status().isCreated());
        call(post("/api/answers").content(answer(team2, q1, true)), token).andExpect(status().isConflict());

        // Updating: finish the game
        String update = """
            {"title":"Midterm Review","status":"completed","timeRemainingSeconds":0,"endReason":"bingo_line",
             "boardState":"{\\"x\\":2}","teams":[{"id":"%s","score":40,"winner":true},{"id":"%s","score":0,"winner":false}]}
            """.formatted(team1, team2);
        JsonNode updated = body(call(put("/api/sessions/" + sessionId).content(update), token));
        assertThat(updated.get("status").asText()).isEqualTo("completed");
        assertThat(updated.get("completedAt").isNull()).isFalse();
        assertThat(updated.get("teams").get(0).get("score").asInt()).isEqualTo(40);
        assertThat(updated.get("teams").get(0).get("correctAnswersCount").asInt()).isEqualTo(1);
        assertThat(updated.get("teams").get(1).get("wrongAnswersCount").asInt()).isEqualTo(1);
        assertThat(body(call(get("/api/sessions?status=completed"), token))).hasSize(1);

        // Managing related entities: team, student, question
        JsonNode team3 = body(call(post("/api/sessions/" + sessionId + "/teams")
                .content("{\"name\":\"Team 3\",\"color\":\"green\",\"students\":[]}"), token).andExpect(status().isCreated()));
        JsonNode withStudent = body(call(post("/api/teams/" + team3.get("id").asText() + "/students")
                .content("{\"name\":\"Liam\"}"), token));
        String studentId = withStudent.get("students").get(0).get("id").asText();
        call(delete("/api/teams/" + team3.get("id").asText() + "/students/" + studentId), token).andExpect(status().isOk());
        call(put("/api/teams/" + team3.get("id").asText()).content("{\"name\":\"Green Team\"}"), token).andExpect(status().isOk());
        call(delete("/api/teams/" + team3.get("id").asText()), token).andExpect(status().isNoContent());
        JsonNode q3 = body(call(post("/api/sessions/" + sessionId + "/questions")
                .content("{\"text\":\"2+2?\",\"answer\":\"4\",\"points\":5}"), token).andExpect(status().isCreated()));
        assertThat(q3.get("order").asInt()).isEqualTo(3);
        call(put("/api/questions/" + q3.get("id").asText()).content("{\"points\":15}"), token).andExpect(status().isOk());
        call(delete("/api/questions/" + q3.get("id").asText()), token).andExpect(status().isNoContent());

        // Another teacher cannot see this session
        String other = token(post("/api/auth/register").content("{\"username\":\"teacher02\",\"name\":\"B\",\"password\":\"1234\"}"));
        call(get("/api/sessions/" + sessionId), other).andExpect(status().isNotFound());

        // Restart clears answers
        call(delete("/api/sessions/" + sessionId + "/answers"), token).andExpect(status().isNoContent());
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM answer", Integer.class)).isZero();

        // Deleting: ON DELETE CASCADE removes everything of the session, orphan students are removed too
        call(delete("/api/sessions/" + sessionId), token).andExpect(status().isNoContent());
        for (String table : new String[]{"game_session", "game_setting", "team", "team_member", "question", "answer", "student"}) {
            assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM " + table, Integer.class)).as(table).isZero();
        }
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM game", Integer.class)).isEqualTo(3);
    }

    // ------------------------------------------------------------------ helpers
    private String answer(String team, String question, boolean correct) {
        return "{\"teamId\":" + team + ",\"questionId\":" + question + ",\"correct\":" + correct + "}";
    }

    private org.springframework.test.web.servlet.ResultActions call(MockHttpServletRequestBuilder req, String token) throws Exception {
        req.contentType(MediaType.APPLICATION_JSON);
        if (token != null) req.header("Authorization", "Bearer " + token);
        return mvc.perform(req);
    }

    private String token(MockHttpServletRequestBuilder req) throws Exception {
        return body(call(req, null).andExpect(status().isOk())).get("token").asText();
    }

    private JsonNode body(org.springframework.test.web.servlet.ResultActions actions) throws Exception {
        MvcResult r = actions.andReturn();
        return json.readTree(r.getResponse().getContentAsString());
    }
}
