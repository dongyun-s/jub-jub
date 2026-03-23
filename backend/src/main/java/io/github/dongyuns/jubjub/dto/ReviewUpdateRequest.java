package io.github.dongyuns.jubjub.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ReviewUpdateRequest {

    private Long customerProfileId;
    private Integer tasteRating;
    private Integer timeRating;
    private String content;
    private Boolean aiGeneratedHelped;
    private List<String> imagePaths;
}