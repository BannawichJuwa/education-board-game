package com.eduboard.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;

/**
 * Simple login token: "<teacherId>.<signature>".
 * The signature is an HMAC-SHA256 of the teacher id made with a server secret,
 * so a browser cannot change the id without the server noticing.
 */
@Service
public class TokenService {

    private final byte[] secret;

    public TokenService(@Value("${app.token-secret}") String secret) {
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
    }

    public String createToken(Long teacherId) {
        return teacherId + "." + sign(String.valueOf(teacherId));
    }

    /** Returns the teacher id inside a valid token, or null when the token is missing or forged. */
    public Long readTeacherId(String token) {
        if (token == null || !token.contains(".")) return null;
        String idPart = token.substring(0, token.indexOf('.'));
        String sigPart = token.substring(token.indexOf('.') + 1);
        boolean valid = MessageDigest.isEqual(
                sign(idPart).getBytes(StandardCharsets.UTF_8), sigPart.getBytes(StandardCharsets.UTF_8));
        if (!valid) return null;
        try {
            return Long.parseLong(idPart);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private String sign(String value) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret, "HmacSHA256"));
            byte[] raw = mac.doFinal(value.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(raw);
        } catch (Exception e) {
            throw new IllegalStateException("Cannot sign token", e);
        }
    }
}
