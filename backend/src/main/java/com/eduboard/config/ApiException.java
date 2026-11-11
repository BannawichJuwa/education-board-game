package com.eduboard.config;

import org.springframework.http.HttpStatus;

/** Thrown by services; turned into a JSON error like {"error":"username_taken"} by ApiExceptionHandler. */
public class ApiException extends RuntimeException {
    private final HttpStatus status;
    private final String code;

    public ApiException(HttpStatus status, String code) {
        super(code);
        this.status = status;
        this.code = code;
    }

    public HttpStatus getStatus() { return status; }
    public String getCode() { return code; }

    public static ApiException notFound(String what) { return new ApiException(HttpStatus.NOT_FOUND, what + "_not_found"); }
    public static ApiException badRequest(String code) { return new ApiException(HttpStatus.BAD_REQUEST, code); }
}
