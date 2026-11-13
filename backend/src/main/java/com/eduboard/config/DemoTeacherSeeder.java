package com.eduboard.config;

import com.eduboard.entity.Teacher;
import com.eduboard.repository.TeacherRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Local test login (README): username "demo", password "demo1234".
 * Created only with the local H2 database, never with the "mysql" profile used on Google Cloud.
 */
@Component
@Profile("!mysql")
public class DemoTeacherSeeder implements CommandLineRunner {

    private final TeacherRepository teachers;

    public DemoTeacherSeeder(TeacherRepository teachers) {
        this.teachers = teachers;
    }

    @Override
    public void run(String... args) {
        if (teachers.existsByUsernameIgnoreCase("demo")) return;
        Teacher t = new Teacher();
        t.setUsername("demo");
        t.setTeacherName("Demo Teacher");
        t.setPassword(new BCryptPasswordEncoder().encode("demo1234"));
        teachers.save(t);
    }
}
