package io.github.dongyuns.jubjub.domain.customer.auth.dto;

public record VerificationConfirmRequest(Long logId, String code) {}