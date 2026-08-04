package io.github.dongyuns.jubjub.domain.customer.review.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class ReviewResponse {

    private Long reviewId;
    private Long orderId;
    private Long memberProfileId;
    private Long storeId;
    private Integer overallRating;
    private Integer packagingRating;
    private Integer tasteRating;
    private Integer timeRating;
    private String content;
    private Boolean aiGeneratedHelped;
    private LocalDateTime createdAt;
    private List<String> imagePaths;
}
