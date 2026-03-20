package io.github.dongyuns.jubjub.domain.auth.dto;

public record VerificationConfirmRequest(Long logId, String code) {}