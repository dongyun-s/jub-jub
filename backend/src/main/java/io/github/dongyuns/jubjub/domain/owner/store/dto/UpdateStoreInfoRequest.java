package io.github.dongyuns.jubjub.domain.owner.store.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateStoreInfoRequest(
        @NotNull(message = "운영시간은 필수입니다. 삭제하려면 빈 문자열을 보내주세요.")
        @Size(max = 2000, message = "운영시간은 2000자 이하여야 합니다.")
        String operatingHours,
        @NotNull(message = "안내사항은 필수입니다. 삭제하려면 빈 문자열을 보내주세요.")
        @Size(max = 5000, message = "안내사항은 5000자 이하여야 합니다.")
        String notice
) {}
