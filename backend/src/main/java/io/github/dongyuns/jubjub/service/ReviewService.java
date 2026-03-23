package io.github.dongyuns.jubjub.service;

import io.github.dongyuns.jubjub.dto.*;
import io.github.dongyuns.jubjub.entity.Media;
import io.github.dongyuns.jubjub.entity.Order;
import io.github.dongyuns.jubjub.entity.Review;
import io.github.dongyuns.jubjub.repository.MediaRepository;
import io.github.dongyuns.jubjub.repository.OrderRepository;
import io.github.dongyuns.jubjub.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final MediaRepository mediaRepository;
    private final OrderRepository orderRepository;
    private final WebClient openAiWebClient;

    @Value("${spring.openai.model}")
    private String openAiModel;

    @Transactional
    public ReviewResponse createReview(ReviewCreateRequest request) {
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 주문입니다."));

        if (reviewRepository.findByOrderId(request.getOrderId()).isPresent()) {
            throw new IllegalArgumentException("해당 주문에는 이미 리뷰가 작성되었습니다.");
        }

        validateReviewOwner(request.getCustomerProfileId(), order.getCustomerProfileId());
        validateStore(request.getStoreId(), order.getStoreId());

        Review review = Review.builder()
                .orderId(request.getOrderId())
                .customerProfileId(request.getCustomerProfileId())
                .storeId(request.getStoreId())
                .tasteRating(request.getTasteRating())
                .timeRating(request.getTimeRating())
                .content(request.getContent())
                .aiGeneratedHelped(Boolean.TRUE.equals(request.getAiGeneratedHelped()))
                .createdAt(LocalDateTime.now())
                .build();

        Review savedReview = reviewRepository.save(review);
        saveReviewImages(savedReview.getReviewId(), request.getImagePaths());

        return buildReviewResponse(savedReview);
    }

    @Transactional(readOnly = true)
    public ReviewResponse getReview(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("리뷰를 찾을 수 없습니다."));

        return buildReviewResponse(review);
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getStoreReviews(Long storeId) {
        return reviewRepository.findByStoreId(storeId).stream()
                .map(this::buildReviewResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getStoreReviewsByTasteRating(Long storeId, Integer tasteRating) {
        return reviewRepository.findByStoreIdAndTasteRating(storeId, tasteRating).stream()
                .map(this::buildReviewResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getMyReviews(Long customerProfileId) {
        return reviewRepository.findByCustomerProfileId(customerProfileId).stream()
                .map(this::buildReviewResponse)
                .toList();
    }

    @Transactional
    public ReviewResponse updateReview(Long reviewId, ReviewUpdateRequest request) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("리뷰를 찾을 수 없습니다."));

        validateReviewOwner(request.getCustomerProfileId(), review.getCustomerProfileId());

        review.setTasteRating(request.getTasteRating());
        review.setTimeRating(request.getTimeRating());
        review.setContent(request.getContent());
        review.setAiGeneratedHelped(Boolean.TRUE.equals(request.getAiGeneratedHelped()));

        mediaRepository.deleteByOwnerTypeAndOwnerId("REVIEW", review.getReviewId());
        saveReviewImages(review.getReviewId(), request.getImagePaths());

        return buildReviewResponse(review);
    }

    @Transactional
    public void deleteReview(Long reviewId, ReviewDeleteRequest request) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("리뷰를 찾을 수 없습니다."));

        validateReviewOwner(request.getCustomerProfileId(), review.getCustomerProfileId());

        mediaRepository.deleteByOwnerTypeAndOwnerId("REVIEW", review.getReviewId());
        reviewRepository.delete(review);
    }

    public AiReviewGenerateResponse generateAiReview(AiReviewGenerateRequest request) {
        String prompt = """
                너는 음식 포장 주문 리뷰를 자연스럽게 작성하는 도우미다.
                아래 평점을 보고 한국어 리뷰를 2~3문장으로 작성해라.
                과장 없이 실제 사용자 후기처럼 써라.
                각 항목의 만족도가 높으면 긍정적으로, 낮으면 아쉬운 점이 드러나게 작성해라.
                항목:
                - 포장 상태: %d점 / 5점
                - 맛 평가: %d점 / 5점
                - 정확한 시간: %d점 / 5점
                결과는 리뷰 문장만 반환해라.
                """.formatted(
                safeRating(request.getPackagingRating()),
                safeRating(request.getTasteRating()),
                safeRating(request.getTimeRating())
        );

        Map<String, Object> body = Map.of(
                "model", openAiModel,
                "input", prompt
        );

        Map<String, Object> response = openAiWebClient.post()
                .uri("/responses")
                .bodyValue(body)
                .retrieve()
                .onStatus(HttpStatusCode::isError, clientResponse ->
                        clientResponse.bodyToMono(String.class)
                                .map(errorBody -> new IllegalArgumentException("OpenAI 호출 실패: " + errorBody))
                )
                .bodyToMono(Map.class)
                .block();

        String generatedText = extractOutputText(response);

        if (generatedText == null || generatedText.isBlank()) {
            throw new IllegalStateException("AI 리뷰 생성 결과가 비어 있습니다.");
        }

        return new AiReviewGenerateResponse(generatedText.trim());
    }

    private int safeRating(Integer rating) {
        return rating == null ? 3 : rating;
    }

    private void validateReviewOwner(Long requestCustomerProfileId, Long actualCustomerProfileId) {
        if (requestCustomerProfileId == null || !requestCustomerProfileId.equals(actualCustomerProfileId)) {
            throw new IllegalArgumentException("본인이 작성한 리뷰만 수정 또는 삭제할 수 있습니다.");
        }
    }

    private void validateStore(Long requestStoreId, Long actualStoreId) {
        if (!requestStoreId.equals(actualStoreId)) {
            throw new IllegalArgumentException("주문한 매장 정보와 리뷰 매장 정보가 다릅니다.");
        }
    }

    private void saveReviewImages(Long reviewId, List<String> imagePaths) {
        if (imagePaths == null || imagePaths.isEmpty()) {
            return;
        }

        List<Media> mediaList = imagePaths.stream()
                .map(path -> Media.builder()
                        .ownerType("REVIEW")
                        .ownerId(reviewId)
                        .imagePath(path)
                        .build())
                .toList();

        mediaRepository.saveAll(mediaList);
    }

    private ReviewResponse buildReviewResponse(Review review) {
        List<String> imagePaths = mediaRepository.findByOwnerTypeAndOwnerId("REVIEW", review.getReviewId())
                .stream()
                .map(Media::getImagePath)
                .toList();

        return ReviewResponse.builder()
                .reviewId(review.getReviewId())
                .orderId(review.getOrderId())
                .customerProfileId(review.getCustomerProfileId())
                .storeId(review.getStoreId())
                .tasteRating(review.getTasteRating())
                .timeRating(review.getTimeRating())
                .content(review.getContent())
                .aiGeneratedHelped(review.getAiGeneratedHelped())
                .createdAt(review.getCreatedAt())
                .imagePaths(imagePaths)
                .build();
    }

    private String extractOutputText(Map<String, Object> response) {
        Object outputText = response.get("output_text");
        if (outputText instanceof String text && !text.isBlank()) {
            return text;
        }

        Object output = response.get("output");
        if (output instanceof List<?> outputList) {
            StringBuilder sb = new StringBuilder();

            for (Object item : outputList) {
                if (!(item instanceof Map<?, ?> itemMap)) {
                    continue;
                }

                Object content = itemMap.get("content");
                if (!(content instanceof List<?> contentList)) {
                    continue;
                }

                for (Object contentItem : contentList) {
                    if (!(contentItem instanceof Map<?, ?> contentMap)) {
                        continue;
                    }

                    Object text = contentMap.get("text");
                    if (text instanceof String textValue) {
                        sb.append(textValue);
                    }
                }
            }

            if (!sb.isEmpty()) {
                return sb.toString();
            }
        }

        return null;
    }
}