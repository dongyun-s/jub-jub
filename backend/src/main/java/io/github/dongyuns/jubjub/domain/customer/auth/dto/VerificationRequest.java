package io.github.dongyuns.jubjub.domain.customer.auth.dto;

/**
 * 📦 Data Transfer Objects (DTO)
 * record를 사용하여 불변 객체로 정의했습니다.
 */

// [발송] 요청 데이터
public record VerificationRequest(String type, String target) {
}
