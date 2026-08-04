package io.github.dongyuns.jubjub.domain.owner.review.controller;

import io.github.dongyuns.jubjub.common.response.ApiResponse;
import io.github.dongyuns.jubjub.domain.owner.review.dto.OwnerReviewDetailResponse;
import io.github.dongyuns.jubjub.domain.owner.review.dto.OwnerReviewListResponse;
import io.github.dongyuns.jubjub.domain.owner.review.dto.OwnerReviewSummaryResponse;
import io.github.dongyuns.jubjub.domain.owner.review.dto.ReviewInsightResponse;
import io.github.dongyuns.jubjub.domain.owner.review.dto.ReviewReplyRequest;
import io.github.dongyuns.jubjub.domain.owner.review.dto.ReviewReplyResponse;
import io.github.dongyuns.jubjub.domain.owner.review.repository.OwnerReviewQueryRepository.ReviewFilter;
import io.github.dongyuns.jubjub.domain.owner.review.service.OwnerReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/owner/review")
public class OwnerReviewController {

    private final OwnerReviewService ownerReviewService;

    @GetMapping
    public ApiResponse<OwnerReviewListResponse> getReviews(
            Authentication authentication,
            @RequestParam(defaultValue = "ALL") ReviewFilter filter,
            @RequestParam(required = false) String keyword
    ) {
        return ApiResponse.success(ownerReviewService.getReviews(authentication.getName(), filter, keyword));
    }

    @GetMapping("/summary")
    public ApiResponse<OwnerReviewSummaryResponse> getSummary(Authentication authentication) {
        return ApiResponse.success(ownerReviewService.getSummary(authentication.getName()));
    }

    @GetMapping("/{reviewId}")
    public ApiResponse<OwnerReviewDetailResponse> getReview(
            Authentication authentication,
            @PathVariable Long reviewId
    ) {
        return ApiResponse.success(ownerReviewService.getReview(authentication.getName(), reviewId));
    }

    @PostMapping("/{reviewId}/reply")
    public ApiResponse<ReviewReplyResponse> createReply(
            Authentication authentication,
            @PathVariable Long reviewId,
            @RequestBody @Valid ReviewReplyRequest request
    ) {
        return ApiResponse.success(ownerReviewService.createReply(authentication.getName(), reviewId, request));
    }

    @PutMapping("/{reviewId}/reply")
    public ApiResponse<ReviewReplyResponse> updateReply(
            Authentication authentication,
            @PathVariable Long reviewId,
            @RequestBody @Valid ReviewReplyRequest request
    ) {
        return ApiResponse.success(ownerReviewService.updateReply(authentication.getName(), reviewId, request));
    }

    @DeleteMapping("/{reviewId}/reply")
    public ApiResponse<Void> deleteReply(
            Authentication authentication,
            @PathVariable Long reviewId
    ) {
        ownerReviewService.deleteReply(authentication.getName(), reviewId);
        return ApiResponse.success(null);
    }

    @PostMapping("/{reviewId}/insight")
    public ApiResponse<ReviewInsightResponse> generateInsight(
            Authentication authentication,
            @PathVariable Long reviewId
    ) {
        return ApiResponse.success(ownerReviewService.generateInsight(authentication.getName(), reviewId));
    }
}
