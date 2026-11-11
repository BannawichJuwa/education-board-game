package com.eduboard.entity;

import jakarta.persistence.*;

/** QUESTION table: a question written for one GAME_SESSION (GAME_SESSION 1 : N QUESTION). */
@Entity
@Table(name = "question")
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "question_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id")
    private GameSession session;

    @Column(name = "question_text", nullable = false)
    private String questionText;

    @Column(name = "correct_answer", nullable = false)
    private String correctAnswer;

    @Column(nullable = false)
    private Integer score = 10;

    @Column(length = 50)
    private String category;

    @Column
    private String explanation;

    @Column(name = "question_order", nullable = false)
    private Integer questionOrder;

    public Long getId() { return id; }
    public GameSession getSession() { return session; }
    public void setSession(GameSession session) { this.session = session; }
    public String getQuestionText() { return questionText; }
    public void setQuestionText(String questionText) { this.questionText = questionText; }
    public String getCorrectAnswer() { return correctAnswer; }
    public void setCorrectAnswer(String correctAnswer) { this.correctAnswer = correctAnswer; }
    public Integer getScore() { return score; }
    public void setScore(Integer score) { this.score = score; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getExplanation() { return explanation; }
    public void setExplanation(String explanation) { this.explanation = explanation; }
    public Integer getQuestionOrder() { return questionOrder; }
    public void setQuestionOrder(Integer questionOrder) { this.questionOrder = questionOrder; }
}
