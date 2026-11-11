package com.eduboard.entity;

import jakarta.persistence.*;

/** LESSON table: a lesson / subject name owned by one teacher (TEACHER 1 : N LESSON). */
@Entity
@Table(name = "lesson")
public class Lesson {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "lesson_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "teacher_id")
    private Teacher teacher;

    @Column(name = "lesson_name", nullable = false, length = 100)
    private String lessonName;

    public Long getId() { return id; }
    public Teacher getTeacher() { return teacher; }
    public void setTeacher(Teacher teacher) { this.teacher = teacher; }
    public String getLessonName() { return lessonName; }
    public void setLessonName(String lessonName) { this.lessonName = lessonName; }
}
