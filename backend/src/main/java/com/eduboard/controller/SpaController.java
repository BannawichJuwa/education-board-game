package com.eduboard.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * The React app has one address per page (see public/sitemap.xml). When a browser opens or
 * refreshes one of these addresses, Spring Boot returns index.html and React shows the page.
 */
@Controller
public class SpaController {

    @GetMapping({"/login", "/dashboard", "/sessions", "/create", "/how-to-play",
                 "/game/{sessionId}", "/scoreboard/{sessionId}"})
    public String page() {
        return "forward:/index.html";
    }
}
