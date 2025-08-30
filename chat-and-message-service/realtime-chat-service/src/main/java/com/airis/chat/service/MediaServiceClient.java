package com.airis.chat.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.util.Map;

/**
 * Media Service Client
 * Handles file uploads to external media service API
 *
 * @author AIRIS Team
 * @since 1.0.0
 */
@Slf4j
@Service
public class MediaServiceClient {

    private final WebClient webClient;

    @Value("${airis.chat.media-service.base-url}")
    private String mediaServiceBaseUrl;

    /**
     * Constructor to initialize WebClient with media service base URL
     */
    public MediaServiceClient(@Value("${airis.chat.media-service.base-url}") String mediaServiceBaseUrl) {
        this.mediaServiceBaseUrl = mediaServiceBaseUrl;
        this.webClient = WebClient.builder()
                .baseUrl(mediaServiceBaseUrl)
                .build();
    }

    /**
     * Upload chat file to media service
     *
     * @param file       The file to upload
     * @param senderId   The sender's ID
     * @param receiverId The receiver's ID
     * @return The URL of the uploaded file
     * @throws IOException if file processing fails
     */
    public String uploadChatFile(MultipartFile file, String senderId, String receiverId) throws IOException {
        try {
            log.info("Uploading file to media service: fileName={}, senderId={}, receiverId={}",
                    file.getOriginalFilename(), senderId, receiverId);

            // Create multipart body
            MultipartBodyBuilder builder = new MultipartBodyBuilder();

            // Add file part
            ByteArrayResource fileResource = new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename();
                }
            };
            builder.part("file", fileResource, MediaType.valueOf(file.getContentType()));

            // Add sender and receiver IDs
            builder.part("senderId", senderId);
            builder.part("receiverId", receiverId);

            // Make the API call
            Mono<Map> response = webClient
                    .post()
                    .uri("/media/upload-chatFile")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(BodyInserters.fromMultipartData(builder.build()))
                    .retrieve()
                    .bodyToMono(Map.class);

            // Block and get the response
            Map<String, Object> result = response.block();

            if (result != null && result.containsKey("data")) {
                String uploadedUrl = (String) result.get("data");
                log.info("File uploaded successfully: fileName={}, url={}",
                        file.getOriginalFilename(), uploadedUrl);
                return uploadedUrl;
            } else {
                throw new RuntimeException("Invalid response from media service: " + result);
            }

        } catch (Exception e) {
            log.error("Failed to upload file to media service: fileName={}, error={}",
                    file.getOriginalFilename(), e.getMessage(), e);
            throw new IOException("Failed to upload file to media service: " + e.getMessage(), e);
        }
    }

    /**
     * Check if the media service is available
     *
     * @return true if the service is available, false otherwise
     */
    public boolean isMediaServiceAvailable() {
        try {
            Mono<String> response = webClient
                    .get()
                    .uri("/health")
                    .retrieve()
                    .bodyToMono(String.class);

            response.block();
            return true;
        } catch (Exception e) {
            log.warn("Media service is not available: {}", e.getMessage());
            return false;
        }
    }
}