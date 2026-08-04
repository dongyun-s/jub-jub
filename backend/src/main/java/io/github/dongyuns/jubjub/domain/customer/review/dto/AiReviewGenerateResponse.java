package io.github.dongyuns.jubjub.domain.customer.review.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AiReviewGenerateResponse {
    private String generatedReview;
}
