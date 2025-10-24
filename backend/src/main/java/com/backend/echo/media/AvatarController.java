package com.backend.echo.media;

import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/media")
public class AvatarController {

    private final AvatarService avatarService; // implementa loadAvatarAsResource(userId)

    public AvatarController(AvatarService avatarService) {
        this.avatarService = avatarService;
    }

    @GetMapping("/avatar/{userId}")
    public ResponseEntity<Resource> avatar(@PathVariable String userId) {
        Resource res = avatarService.loadAvatarAsResource(userId);
        if (res == null || !res.exists()) return ResponseEntity.notFound().build();

        try {
            // tenta descobrir o content type
            String contentType = null;
            try {
                Path path = Paths.get(res.getURI());
                contentType = Files.probeContentType(path);
            } catch (Exception ignored) {}

            if (contentType == null) contentType = "image/jpeg";
            HttpHeaders headers = new HttpHeaders();
            headers.setCacheControl(CacheControl.maxAge(1, java.util.concurrent.TimeUnit.DAYS));
            return ResponseEntity.ok().headers(headers).contentType(MediaType.parseMediaType(contentType)).body(res);
        } catch (Exception e) {
            return ResponseEntity.ok().contentType(MediaType.IMAGE_JPEG).body(res);
        }
    }
}