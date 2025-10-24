package com.backend.echo.media;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

public interface AvatarService {
    /**
     * Carrega o avatar do usuário como Resource. Retorna null se não existir.
     */
    Resource loadAvatarAsResource(String userId);

    /**
     * Salva/atualiza avatar para o userId. Retorna a URL relativa/filename salvo (ex: avatar filename).
     */
    String saveAvatar(MultipartFile file, String userId) throws Exception;

    /**
     * Remove avatar do usuário (opcional).
     */
    void deleteAvatar(String userId) throws Exception;
}