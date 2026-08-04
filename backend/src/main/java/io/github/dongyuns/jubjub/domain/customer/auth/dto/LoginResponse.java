package io.github.dongyuns.jubjub.domain.customer.auth.dto;

import lombok.Builder;

/**
 * 로그인 성공 시 클라이언트에게 돌려줄 응답 데이터입니다.
 */
@Builder
public record LoginResponse(
        String accessToken,  // 1번 인수
        String refreshToken, // 2번 인수 (🌟 새로 추가된 부분!)
        String email,        // 3번 인수
        String nickname      // 4번 인수
) {}