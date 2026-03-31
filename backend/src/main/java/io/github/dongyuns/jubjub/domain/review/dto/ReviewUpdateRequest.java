package io.github.dongyuns.jubjub.domain.review.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ReviewUpdateRequest {

    private Long memberProfileId;
    private Integer overallRating;
    private Integer packagingRating;
    private Integer tasteRating;
    private Integer timeRating;
    private String content;
    private Boolean aiGeneratedHelped;
    private List<String> imagePaths;
}
