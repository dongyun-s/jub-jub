package io.github.dongyuns.jubjub.domain.auth.dto;
import java.time.LocalDateTime;

public record VerificationSendResponse(Long logId, LocalDateTime expiresAt) {}