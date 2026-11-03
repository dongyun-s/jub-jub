package io.github.dongyuns.jubjub.domain.customer.review.controller;

import io.github.dongyuns.jubjub.domain.customer.review.dto.AiReviewGenerateRequest;
import io.github.dongyuns.jubjub.domain.customer.review.dto.AiReviewGenerateResponse;
import io.github.dongyuns.jubjub.domain.customer.review.dto.ReviewCreateRequest;
import io.github.dongyuns.jubjub.domain.customer.review.dto.ReviewDeleteRequest;
import io.github.dongyuns.jubjub.domain.customer.review.dto.ReviewResponse;
import io.github.dongyuns.jubjub.domain.customer.review.dto.ReviewUpdateRequest;
import io.github.dongyuns.jubjub.domain.customer.review.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    public ReviewResponse createReview(@RequestBody @Valid ReviewCreateRequest request) {
        return reviewService.createReview(request);
    }

    @GetMapping("/{reviewId}")
    public ReviewResponse getReview(@PathVariable Long reviewId) {
        return reviewService.getReview(reviewId);
    }

    @GetMapping("/store/{storeId}")
    public List<ReviewResponse> getStoreReviews(@PathVariable Long storeId) {
        return reviewService.getStoreReviews(storeId);
    }

    @GetMapping("/store/{storeId}/taste-rating")
    public List<ReviewResponse> getStoreReviewsByTasteRating(
            @PathVariable Long storeId,
            @RequestParam Integer rating
    ) {
        return reviewService.getStoreReviewsByTasteRating(storeId, rating);
    }

    @GetMapping("/my/{memberProfileId}")
    public List<ReviewResponse> getMyReviews(@PathVariable Long memberProfileId) {
        return reviewService.getMyReviews(memberProfileId);
    }

    @PutMapping("/{reviewId}")
    public ReviewResponse updateReview(
            @PathVariable Long reviewId,
            @RequestBody ReviewUpdateRequest request
    ) {
        return reviewService.updateReview(reviewId, request);
    }

    @DeleteMapping("/{reviewId}")
    public String deleteReview(
            @PathVariable Long reviewId,
            @RequestBody ReviewDeleteRequest request
    ) {
        reviewService.deleteReview(reviewId, request);
        return "리뷰가 삭제되었습니다.";
    }

    @PostMapping("/ai-generate")
    public AiReviewGenerateResponse generateAiReview(@RequestBody AiReviewGenerateRequest request) {
        return reviewService.generateAiReview(request);
    }
}
