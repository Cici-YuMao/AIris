package com.airis.message.controller;

import com.airis.message.common.PageResult;
import com.airis.message.dto.ChatDetailDTO;
import com.airis.message.dto.ConversationDTO;
import com.airis.message.dto.MessageDTO;
import com.airis.message.request.ChatDetailRequest;
import com.airis.message.request.ConversationListRequest;
import com.airis.message.request.HistoricalMessagesRequest;
import com.airis.message.request.MarkReadRequest;
import com.airis.message.request.SearchMessagesRequest;
import com.airis.message.request.SendMessageRequest;
import com.airis.message.security.SkipAuthentication;
import com.airis.message.service.MessageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

/**
 * Message Controller
 * 
 * @author AIRIS Team
 * @since 1.0.0
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/messages")
@RequiredArgsConstructor
@Validated
@Tag(name = "Message management", description = "Message API")
@SecurityRequirement(name = "Bearer Authentication")
// @CrossOrigin(originPatterns = "*", maxAge = 3600)
public class MessageController {

    private final MessageService messageService;

    @GetMapping("/test")
    @SkipAuthentication
    @Operation(summary = "Test for availability", description = "Test for availability", security = {})
    public ResponseEntity<String> test() {
        return ResponseEntity.ok("Hello, World!");
    }

    @PostMapping("/auth_validate")
    @Operation(summary = "Test jwt auth", description = "Test jwt auth")
    public ResponseEntity<String> testValidate() {
        return ResponseEntity.ok("Hello, World!");
    }

    /**
     * Send message
     * 
     * @param request Send message request
     * @return Message information
     */
    @PostMapping("/send")
    @Operation(summary = "Send message", description = "Send message.")
    public ResponseEntity<MessageDTO> sendMessage(@Valid @RequestBody SendMessageRequest request) {
        log.info("Received send message request: chatId={}, senderId={}", request.getChatId(), request.getSenderId());

        MessageDTO messageDTO = messageService.saveMessage(request);
        return ResponseEntity.ok(messageDTO);
    }

    /**
     * Get historical messages
     * 
     * @param request Historical messages query request
     * @return Historical messages page result
     */
    @PostMapping("/history")
    @Operation(summary = "Get chat history", description = "Get chat history")
    public ResponseEntity<PageResult<MessageDTO>> getHistoricalMessages(
            @Valid @RequestBody HistoricalMessagesRequest request) {
        log.info("Get historical messages: chatId={}, userId={}", request.getChatId(), request.getUserId());

        PageResult<MessageDTO> result = messageService.getHistoricalMessages(request);
        return ResponseEntity.ok(result);
    }

    /**
     * Mark messages as read
     * 
     * @param request Mark read request
     * @return Operation result
     */
    @PostMapping("/mark-read")
    @Operation(summary = "Mark messages as read", description = "Mark specified messages as read status")
    public ResponseEntity<Void> markMessagesAsRead(@Valid @RequestBody MarkReadRequest request) {
        log.info("Mark messages as read: chatId={}, userId={}", request.getChatId(), request.getUserId());

        messageService.markMessagesAsRead(request);
        return ResponseEntity.ok().build();
    }

    /**
     * Get conversation list
     * 
     * @param request Conversation list query request
     * @return Conversation list page result
     */
    @PostMapping("/conversations")
    @Operation(summary = "Get conversation list", description = "Get user's chat conversation list with pagination")
    public ResponseEntity<PageResult<ConversationDTO>> getConversations(
            @Valid @RequestBody ConversationListRequest request) {
        log.info("Get conversation list: userId={}", request.getUserId());

        PageResult<ConversationDTO> result = messageService.getConversations(request);
        return ResponseEntity.ok(result);
    }

    /**
     * Search messages
     * 
     * @param request Search messages request
     * @return Search result page
     */
    @PostMapping("/search")
    @Operation(summary = "Search messages", description = "Search chat messages by keyword")
    public ResponseEntity<PageResult<MessageDTO>> searchMessages(
            @Valid @RequestBody SearchMessagesRequest request) {
        log.info("Search messages: userId={}, keyword={}", request.getUserId(), request.getKeyword());

        PageResult<MessageDTO> result = messageService.searchMessages(request);
        return ResponseEntity.ok(result);
    }

    /**
     * Get historical messages via GET method (simplified interface)
     * 
     * @param chatId Chat ID
     * @param userId User ID
     * @param page   Page number
     * @param size   Page size
     * @return Historical messages page result
     */
    @GetMapping("/history/{chatId}")
    @Operation(summary = "Get historical messages via GET", description = "Get chat historical messages through GET request")
    public ResponseEntity<PageResult<MessageDTO>> getHistoricalMessagesGet(
            @Parameter(description = "Chat ID") @PathVariable String chatId,
            @Parameter(description = "User ID") @RequestParam String userId,
            @Parameter(description = "Page number", example = "1") @RequestParam(defaultValue = "1") Integer page,
            @Parameter(description = "Page size", example = "20") @RequestParam(defaultValue = "20") Integer size,
            @Parameter(description = "Query before timestamp") @RequestParam(required = false) Long beforeTimestamp) {

        HistoricalMessagesRequest request = HistoricalMessagesRequest.builder()
                .chatId(chatId)
                .userId(userId)
                .page(page)
                .size(size)
                .beforeTimestamp(beforeTimestamp)
                .build();

        PageResult<MessageDTO> result = messageService.getHistoricalMessages(request);
        return ResponseEntity.ok(result);
    }

    /**
     * Get conversation list via GET method (simplified interface)
     * 
     * @param userId User ID
     * @param page   Page number
     * @param size   Page size
     * @return Conversation list page result
     */
    @GetMapping("/conversations/{userId}")
    @Operation(summary = "Get conversation list via GET", description = "Get user's chat conversation list through GET request")
    public ResponseEntity<PageResult<ConversationDTO>> getConversationsGet(
            @Parameter(description = "User ID") @PathVariable String userId,
            @Parameter(description = "Page number", example = "1") @RequestParam(defaultValue = "1") Integer page,
            @Parameter(description = "Page size", example = "20") @RequestParam(defaultValue = "20") Integer size,
            @Parameter(description = "Query before timestamp") @RequestParam(required = false) Long beforeTimestamp) {

        ConversationListRequest request = ConversationListRequest.builder()
                .userId(userId)
                .page(page)
                .size(size)
                .beforeTimestamp(beforeTimestamp)
                .build();

        PageResult<ConversationDTO> result = messageService.getConversations(request);
        return ResponseEntity.ok(result);
    }

    /**
     * Get chat details
     * 
     * @param request Chat detail request
     * @return Chat details
     */
    @PostMapping("/chat-detail")
    @Operation(summary = "Get chat details", description = "Get chat details including chat duration and message count statistics based on two user IDs")
    public ResponseEntity<ChatDetailDTO> getChatDetail(@Valid @RequestBody ChatDetailRequest request) {
        log.info("Get chat details: userAId={}, userBId={}", request.getUserAId(), request.getUserBId());

        ChatDetailDTO result = messageService.getChatDetail(request);
        return ResponseEntity.ok(result);
    }

    /**
     * Get chat details via GET method (simplified interface)
     * 
     * @param userAId User A's ID
     * @param userBId User B's ID
     * @return Chat details
     */
    @GetMapping("/chat-detail")
    @SkipAuthentication
    @Operation(summary = "Get chat details via GET", description = "Get chat details between two users through GET request")
    public ResponseEntity<ChatDetailDTO> getChatDetailGet(
            @Parameter(description = "User A's ID") @RequestParam String userAId,
            @Parameter(description = "User B's ID") @RequestParam String userBId) {

        ChatDetailRequest request = ChatDetailRequest.builder()
                .userAId(userAId)
                .userBId(userBId)
                .build();

        ChatDetailDTO result = messageService.getChatDetail(request);
        return ResponseEntity.ok(result);
    }
}