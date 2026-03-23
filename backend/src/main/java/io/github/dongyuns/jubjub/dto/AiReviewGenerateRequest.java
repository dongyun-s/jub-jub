package io.github.dongyuns.jubjub.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AiReviewGenerateRequest {
    private Integer packagingRating;
    private Integer tasteRating;
    private Integer timeRating;
}