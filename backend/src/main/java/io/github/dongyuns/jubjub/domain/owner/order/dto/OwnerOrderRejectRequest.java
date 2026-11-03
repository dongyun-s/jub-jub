package io.github.dongyuns.jubjub.domain.owner.order.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record OwnerOrderRejectRequest(
        @NotBlank @Size(max = 200) String reason
) {
}
