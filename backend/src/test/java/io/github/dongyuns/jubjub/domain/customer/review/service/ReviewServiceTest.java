package io.github.dongyuns.jubjub.domain.customer.review.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import io.github.dongyuns.jubjub.domain.core.media.repository.MediaRepository;
import io.github.dongyuns.jubjub.domain.core.notification.service.ReviewNotificationService;
import io.github.dongyuns.jubjub.domain.core.order.repository.OrderRepository;
import io.github.dongyuns.jubjub.domain.core.review.entity.Review;
import io.github.dongyuns.jubjub.domain.core.review.entity.ReviewReply;
import io.github.dongyuns.jubjub.domain.core.review.repository.ReviewReplyRepository;
import io.github.dongyuns.jubjub.domain.core.review.repository.ReviewRepository;
import io.github.dongyuns.jubjub.domain.customer.review.dto.ReviewDeleteRequest;
import io.github.dongyuns.jubjub.domain.customer.review.dto.ReviewResponse;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.reactive.function.client.WebClient;

@ExtendWith(MockitoExtension.class)
class ReviewServiceTest {

    @Mock private ReviewRepository reviewRepository;
    @Mock private ReviewReplyRepository reviewReplyRepository;
    @Mock private MediaRepository mediaRepository;
    @Mock private OrderRepository orderRepository;
    @Mock private ReviewNotificationService reviewNotificationService;
    @Mock private WebClient openAiWebClient;

    private ReviewService reviewService;

    @BeforeEach
    void setUp() {
        reviewService = new ReviewService(
                reviewRepository,
                reviewReplyRepository,
                mediaRepository,
                orderRepository,
                reviewNotificationService,
                openAiWebClient
        );
    }

    @Test
    void includesOwnerReplyInCustomerReviewList() {
        Review review = review(10L, 20L, 30L);
        ReviewReply reply = mock(ReviewReply.class);
        LocalDateTime createdAt = LocalDateTime.of(2026, 8, 5, 14, 0);
        when(reply.getId()).thenReturn(40L);
        when(reply.getReview()).thenReturn(review);
        when(reply.getContent()).thenReturn("소중한 리뷰 감사합니다.");
        when(reply.getCreatedAt()).thenReturn(createdAt);
        when(reply.getUpdatedAt()).thenReturn(createdAt);
        when(reviewRepository.findByStoreId(20L)).thenReturn(List.of(review));
        when(mediaRepository.findByOwnerTypeAndOwnerIdIn("REVIEW", List.of(10L))).thenReturn(List.of());
        when(reviewReplyRepository.findByReviewReviewIdIn(List.of(10L))).thenReturn(List.of(reply));

        List<ReviewResponse> responses = reviewService.getStoreReviews(20L);

        assertThat(responses).hasSize(1);
        assertThat(responses.getFirst().getOwnerReply()).isNotNull();
        assertThat(responses.getFirst().getOwnerReply().replyId()).isEqualTo(40L);
        assertThat(responses.getFirst().getOwnerReply().content()).isEqualTo("소중한 리뷰 감사합니다.");
    }

    @Test
    void deletesOwnerReplyBeforeCustomerReview() {
        Review review = review(10L, 20L, 30L);
        when(reviewRepository.findById(10L)).thenReturn(Optional.of(review));

        ReviewDeleteRequest request = new ReviewDeleteRequest();
        request.setMemberProfileId(30L);
        reviewService.deleteReview(10L, request);

        verify(reviewReplyRepository).deleteByReviewReviewId(10L);
        verify(mediaRepository).deleteByOwnerTypeAndOwnerId("REVIEW", 10L);
        verify(reviewRepository).delete(review);
    }

    private Review review(Long reviewId, Long storeId, Long memberProfileId) {
        return Review.builder()
                .reviewId(reviewId)
                .orderId(100L)
                .memberProfileId(memberProfileId)
                .storeId(storeId)
                .overallRating(5)
                .packagingRating(5)
                .tasteRating(5)
                .timeRating(5)
                .content("맛있어요.")
                .createdAt(LocalDateTime.of(2026, 8, 5, 13, 0))
                .build();
    }
}
