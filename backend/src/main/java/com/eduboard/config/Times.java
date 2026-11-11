package com.eduboard.config;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;

/** The web app uses epoch milliseconds; the database uses DATETIME. */
public final class Times {
    private Times() { }

    public static Long toMillis(LocalDateTime t) {
        return t == null ? null : t.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli();
    }

    public static LocalDateTime fromMillis(Long ms) {
        return ms == null ? null : LocalDateTime.ofInstant(Instant.ofEpochMilli(ms), ZoneId.systemDefault());
    }
}
