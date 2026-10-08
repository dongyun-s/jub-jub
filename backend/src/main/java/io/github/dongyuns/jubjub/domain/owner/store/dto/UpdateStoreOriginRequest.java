package io.github.dongyuns.jubjub.domain.owner.store.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateStoreOriginRequest(
        @NotNull(message = "원산지는 필수입니다. 삭제하려면 빈 문자열을 보내주세요.")
        @Size(max = 5000, message = "원산지는 5000자 이하여야 합니다.")
        String originInfo
) {}
