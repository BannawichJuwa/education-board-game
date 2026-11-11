package com.eduboard.controller;

import com.eduboard.config.AuthInterceptor;
import com.eduboard.dto.SessionDtos.*;
import com.eduboard.service.TeamService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/** Managing related entities: TEAM and its STUDENT members (TEAM_MEMBER). */
@RestController
@RequestMapping("/api")
public class TeamController {

    private final TeamService teamService;

    public TeamController(TeamService teamService) {
        this.teamService = teamService;
    }

    @PostMapping("/sessions/{sessionId}/teams")
    @ResponseStatus(HttpStatus.CREATED)
    public TeamDto addTeam(@RequestAttribute(AuthInterceptor.TEACHER_ID) Long teacherId,
                           @PathVariable Long sessionId, @RequestBody TeamDto body) {
        return teamService.addTeam(teacherId, sessionId, body);
    }

    @PutMapping("/teams/{teamId}")
    public TeamDto updateTeam(@RequestAttribute(AuthInterceptor.TEACHER_ID) Long teacherId,
                              @PathVariable Long teamId, @RequestBody TeamDto body) {
        return teamService.updateTeam(teacherId, teamId, body);
    }

    @DeleteMapping("/teams/{teamId}")
    public ResponseEntity<Void> deleteTeam(@RequestAttribute(AuthInterceptor.TEACHER_ID) Long teacherId,
                                           @PathVariable Long teamId) {
        teamService.deleteTeam(teacherId, teamId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/teams/{teamId}/students")
    @ResponseStatus(HttpStatus.CREATED)
    public TeamDto addStudent(@RequestAttribute(AuthInterceptor.TEACHER_ID) Long teacherId,
                              @PathVariable Long teamId, @RequestBody StudentDto body) {
        return teamService.addStudent(teacherId, teamId, body);
    }

    @DeleteMapping("/teams/{teamId}/students/{studentId}")
    public TeamDto removeStudent(@RequestAttribute(AuthInterceptor.TEACHER_ID) Long teacherId,
                                 @PathVariable Long teamId, @PathVariable Long studentId) {
        return teamService.removeStudent(teacherId, teamId, studentId);
    }
}
