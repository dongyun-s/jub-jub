package io.github.dongyuns.jubjub.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AiReviewGenerateResponse {
    private String generatedReview;
}