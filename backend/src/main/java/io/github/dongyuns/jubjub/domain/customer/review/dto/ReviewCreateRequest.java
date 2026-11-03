package io.github.dongyuns.jubjub.domain.customer.review.dto;

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
    private Long memberProfileId;

    @NotNull
    private Long storeId;

    private Integer overallRating;
    private Integer packagingRating;
    private Integer tasteRating;
    private Integer timeRating;
    private String content;
    private Boolean aiGeneratedHelped;
    private List<String> imagePaths;
}
