package com.backend.echo.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/media/**")
                .allowedOrigins("http://localhost:5182")
                .allowedMethods("GET");
    }
}