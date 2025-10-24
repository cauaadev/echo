package com.backend.echo.media;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.*;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.util.stream.Stream;

@Service
public class FileSystemAvatarService implements AvatarService {

    private final Path storageLocation;
    private final Resource defaultAvatar;

    public FileSystemAvatarService(@Value("${avatars.storage.path:./data/avatars}") String storagePath,
                                   ResourceLoader resourceLoader) throws IOException {
        this.storageLocation = Paths.get(storagePath).toAbsolutePath().normalize();
        Files.createDirectories(this.storageLocation);
        // default avatar embutido em resources/static/default-avatar.jpg (adicione essa imagem no projeto)
        Resource r = resourceLoader.getResource("classpath:static/default-avatar.jpg");
        this.defaultAvatar = r.exists() ? r : null;
    }

    @Override
    public Resource loadAvatarAsResource(String userId) {
        try {
            // procura por arquivos que começam com userId. ex: 123.jpg, 123.png
            try (Stream<Path> files = Files.list(this.storageLocation)) {
                Path found = files
                        .filter(p -> p.getFileName().toString().startsWith(userId + "."))
                        .findFirst().orElse(null);
                if (found != null && Files.exists(found)) {
                    Resource resource = new UrlResource(found.toUri());
                    if (resource.exists() || resource.isReadable()) return resource;
                }
            }
        } catch (IOException e) {
            // ignore, vamos retornar default
        }
        return this.defaultAvatar;
    }

    @Override
    public String saveAvatar(MultipartFile file, String userId) throws Exception {
        if (file == null || file.isEmpty()) throw new IllegalArgumentException("Arquivo vazio");

        String original = StringUtils.cleanPath(file.getOriginalFilename());
        String ext = "";
        int idx = original.lastIndexOf('.');
        if (idx >= 0) ext = original.substring(idx).toLowerCase();

        if (!ext.matches("\\.(jpg|jpeg|png|gif|webp)")) {
            // tenta inferir do contentType
            String ct = file.getContentType();
            if ("image/png".equals(ct)) ext = ".png";
            else if ("image/webp".equals(ct)) ext = ".webp";
            else if ("image/gif".equals(ct)) ext = ".gif";
            else ext = ".jpg";
        }

        // Remove avatares anteriores do user
        try (Stream<Path> files = Files.list(this.storageLocation)) {
            files.filter(p -> p.getFileName().toString().startsWith(userId + "."))
                    .forEach(p -> { try { Files.deleteIfExists(p); } catch (IOException ignored) {} });
        }

        String filename = userId + ext;
        Path target = this.storageLocation.resolve(filename).normalize();
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        return filename; // o controller pode montar a URL /media/avatar/{userId}
    }

    @Override
    public void deleteAvatar(String userId) throws Exception {
        try (Stream<Path> files = Files.list(this.storageLocation)) {
            files.filter(p -> p.getFileName().toString().startsWith(userId + "."))
                    .forEach(p -> { try { Files.deleteIfExists(p); } catch (IOException ignored) {} });
        }
    }
}