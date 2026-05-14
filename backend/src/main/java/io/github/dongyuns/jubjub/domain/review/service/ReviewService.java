package io.github.dongyuns.jubjub.domain.review.service;

import io.github.dongyuns.jubjub.domain.review.dto.AiReviewGenerateRequest;
import io.github.dongyuns.jubjub.domain.review.dto.AiReviewGenerateResponse;
import io.github.dongyuns.jubjub.domain.review.dto.ReviewCreateRequest;
import io.github.dongyuns.jubjub.domain.review.dto.ReviewDeleteRequest;
import io.github.dongyuns.jubjub.domain.review.dto.ReviewResponse;
import io.github.dongyuns.jubjub.domain.review.dto.ReviewUpdateRequest;
import io.github.dongyuns.jubjub.domain.review.entity.Review;
import io.github.dongyuns.jubjub.domain.review.repository.ReviewRepository;
import io.github.dongyuns.jubjub.domain.reviewnotification.service.ReviewNotificationService;
import io.github.dongyuns.jubjub.entity.Media;
import io.github.dongyuns.jubjub.payment.domain.Order;
import io.github.dongyuns.jubjub.payment.repository.OrderRepository;
import io.github.dongyuns.jubjub.repository.MediaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private static final int MAX_REVIEW_IMAGE_COUNT = 5;

    private final ReviewRepository reviewRepository;
    private final MediaRepository mediaRepository;
    private final OrderRepository orderRepository;
    private final ReviewNotificationService reviewNotificationService;
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

        validateReviewOwner(request.getMemberProfileId(), order.getMemberProfileId());
        validateStore(request.getStoreId(), order.getStoreId());
        validateReviewImages(request.getImagePaths());

        Review review = Review.builder()
                .orderId(request.getOrderId())
                .memberProfileId(request.getMemberProfileId())
                .storeId(request.getStoreId())
                .overallRating(resolveOverallRating(
                        request.getAiGeneratedHelped(),
                        request.getOverallRating(),
                        request.getPackagingRating(),
                        request.getTasteRating(),
                        request.getTimeRating()
                ))
                .packagingRating(request.getPackagingRating())
                .tasteRating(request.getTasteRating())
                .timeRating(request.getTimeRating())
                .content(request.getContent())
                .aiGeneratedHelped(Boolean.TRUE.equals(request.getAiGeneratedHelped()))
                .createdAt(LocalDateTime.now())
                .build();

        Review savedReview = reviewRepository.save(review);
        saveReviewImages(savedReview.getReviewId(), request.getImagePaths());
        reviewNotificationService.markAsReadByOrderId(savedReview.getOrderId());

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
    public List<ReviewResponse> getMyReviews(Long memberProfileId) {
        return reviewRepository.findByMemberProfileId(memberProfileId).stream()
                .map(this::buildReviewResponse)
                .toList();
    }

    @Transactional
    public ReviewResponse updateReview(Long reviewId, ReviewUpdateRequest request) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("리뷰를 찾을 수 없습니다."));

        validateReviewOwner(request.getMemberProfileId(), review.getMemberProfileId());
        validateReviewImages(request.getImagePaths());

        review.setOverallRating(resolveOverallRating(
                request.getAiGeneratedHelped(),
                request.getOverallRating(),
                request.getPackagingRating(),
                request.getTasteRating(),
                request.getTimeRating()
        ));
        review.setPackagingRating(request.getPackagingRating());
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

        validateReviewOwner(request.getMemberProfileId(), review.getMemberProfileId());

        mediaRepository.deleteByOwnerTypeAndOwnerId("REVIEW", review.getReviewId());
        reviewRepository.delete(review);
    }

    public AiReviewGenerateResponse generateAiReview(AiReviewGenerateRequest request) {
        String prompt = buildAiReviewPrompt(request);

        Map<String, Object> body = Map.of(
                "model", openAiModel,
                "temperature", 0.9,
                "top_p", 0.95,
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

    private String buildAiReviewPrompt(AiReviewGenerateRequest request) {
        String draftReview = request.getContent();
        String variationGuide = pickReviewVariationGuide();

        if (draftReview != null && !draftReview.isBlank()) {
            return """
                    너는 음식 포장 주문 리뷰를 자연스럽게 다듬는 도우미다.
                    사용자가 직접 쓴 초안을 바탕으로 한국어 리뷰를 3~4문장으로 풍성하게 바꿔라.
                    초안에 없는 구체적인 메뉴명, 매장명, 사실, 경험은 새로 만들지 마라.
                    의미와 만족도는 유지하되 더 자연스럽고 실제 사용자 후기처럼 써라.
                    이번 생성의 문체 지침: %s
                    같은 초안이 다시 들어와도 이전과 다른 표현, 문장 순서, 어휘를 사용해라.
                    초안:
                    %s
                    결과는 리뷰 문장만 반환해라.
                    """.formatted(variationGuide, draftReview.trim());
        }

        return """
                너는 음식 포장 주문 리뷰를 자연스럽게 작성하는 도우미다.
                아래 평점을 보고 한국어 리뷰를 3~4문장으로 작성해라.
                과장 없이 실제 사용자 후기처럼 써라.
                각 항목의 만족도가 높으면 긍정적으로, 낮으면 아쉬운 점이 드러나게 작성해라.
                이번 생성의 문체 지침: %s
                같은 평점 조합이 다시 들어와도 이전과 다른 표현, 문장 순서, 어휘를 사용해라.
                구체적인 메뉴명, 매장명, 이벤트, 할인, 서비스 경험은 입력에 없으면 만들지 마라.
                항목:
                - 포장 상태: %d점 / 5점
                - 맛 평가: %d점 / 5점
                - 정확한 시간: %d점 / 5점
                결과는 리뷰 문장만 반환해라.
                """.formatted(
                variationGuide,
                safeRating(request.getPackagingRating()),
                safeRating(request.getTasteRating()),
                safeRating(request.getTimeRating())
        );
    }

    private String pickReviewVariationGuide() {
        List<String> guides = List.of(
                "담백하고 짧은 생활 후기처럼 작성한다.",
                "만족한 점을 먼저 말하고 마지막에 재주문 의향을 자연스럽게 덧붙인다.",
                "포장, 맛, 시간 중 가장 인상적인 항목 하나를 중심으로 작성한다.",
                "차분한 톤으로 장점과 아쉬운 점을 균형 있게 작성한다.",
                "친구에게 말하듯 자연스럽지만 과한 감탄사는 피한다.",
                "첫 문장과 마지막 문장의 구조가 반복되지 않게 작성한다.",
                "평점이 보통이면 무난했던 점과 개선되면 좋을 점을 함께 담는다."
        );

        return guides.get(ThreadLocalRandom.current().nextInt(guides.size()));
    }

    private int safeRating(Integer rating) {
        return isValidRating(rating) ? rating : 3;
    }

    private Integer resolveOverallRating(
            Boolean aiGeneratedHelped,
            Integer overallRating,
            Integer packagingRating,
            Integer tasteRating,
            Integer timeRating
    ) {
        if (Boolean.TRUE.equals(aiGeneratedHelped)) {
            if (isValidRating(overallRating)) {
                return overallRating;
            }

            if (isValidRating(packagingRating) && isValidRating(tasteRating) && isValidRating(timeRating)) {
                return Math.toIntExact(Math.round((packagingRating + tasteRating + timeRating) / 3.0));
            }

            throw new IllegalArgumentException("AI 리뷰 사용 시 1~5점 사이의 최종 별점 또는 포장/맛/시간 별점을 모두 입력해야 합니다.");
        }

        if (!isValidRating(overallRating)) {
            throw new IllegalArgumentException("일반 리뷰 작성 시 1~5점 사이의 최종 별점을 입력해야 합니다.");
        }

        return overallRating;
    }

    private boolean isValidRating(Integer rating) {
        return rating != null && rating >= 1 && rating <= 5;
    }

    private void validateReviewOwner(Long requestMemberProfileId, Long actualMemberProfileId) {
        if (requestMemberProfileId == null || !requestMemberProfileId.equals(actualMemberProfileId)) {
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

    private void validateReviewImages(List<String> imagePaths) {
        if (imagePaths == null) {
            return;
        }

        if (imagePaths.size() > MAX_REVIEW_IMAGE_COUNT) {
            throw new IllegalArgumentException("리뷰 사진은 최대 5장까지 등록할 수 있습니다.");
        }

        boolean hasBlankImagePath = imagePaths.stream().anyMatch(path -> !StringUtils.hasText(path));
        if (hasBlankImagePath) {
            throw new IllegalArgumentException("리뷰 사진 경로는 비어 있을 수 없습니다.");
        }
    }

    private ReviewResponse buildReviewResponse(Review review) {
        List<String> imagePaths = mediaRepository.findByOwnerTypeAndOwnerId("REVIEW", review.getReviewId())
                .stream()
                .map(Media::getImagePath)
                .toList();

        return ReviewResponse.builder()
                .reviewId(review.getReviewId())
                .orderId(review.getOrderId())
                .memberProfileId(review.getMemberProfileId())
                .storeId(review.getStoreId())
                .overallRating(review.getOverallRating())
                .packagingRating(review.getPackagingRating())
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
