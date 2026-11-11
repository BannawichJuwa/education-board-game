package com.eduboard.entity;

import jakarta.persistence.*;

/** STUDENT table: a student name typed in a team roster (students have no accounts). */
@Entity
@Table(name = "student")
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "student_id")
    private Long id;

    @Column(name = "student_name", nullable = false, length = 100)
    private String studentName;

    protected Student() { }

    public Student(String studentName) { this.studentName = studentName; }

    public Long getId() { return id; }
    public String getStudentName() { return studentName; }
    public void setStudentName(String studentName) { this.studentName = studentName; }
}
