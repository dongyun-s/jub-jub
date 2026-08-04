package io.github.dongyuns.jubjub.domain.owner.store.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateStoreStatusRequest(
        @NotNull OwnerStoreStatus status
) {
}
