package io.github.dongyuns.jubjub.domain.owner.auth.dto;

public record OwnerLoginRequest(

        String email,

        String password

) {
}