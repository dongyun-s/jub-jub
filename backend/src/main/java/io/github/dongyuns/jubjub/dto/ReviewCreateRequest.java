package io.github.dongyuns.jubjub.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ReviewCreateRequest {

    @NotNull
    private Long orderId;

    @NotNull
    private Long customerProfileId;

    @NotNull
    private Long storeId;

    private Integer tasteRating;
    private Integer timeRating;
    private String content;
    private Boolean aiGeneratedHelped;
    private List<String> imagePaths;
}