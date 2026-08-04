package io.github.dongyuns.jubjub.domain.owner.review.service;

import io.github.dongyuns.jubjub.domain.core.review.entity.Review;
import io.github.dongyuns.jubjub.domain.owner.review.dto.ReviewInsightResponse;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
@RequiredArgsConstructor
public class ReviewInsightService {

    private final WebClient openAiWebClient;

    @Value("${spring.openai.model:gpt-4.1-mini}")
    private String openAiModel;

    public ReviewInsightResponse generate(Review review) {
        if (review.getContent() == null || review.getContent().isBlank()) {
            return new ReviewInsightResponse(
                    review.getReviewId(),
                    "작성된 리뷰 내용이 없습니다.",
                    List.of(ratingHighlight(review.getOverallRating()))
            );
        }

        Map<String, Object> body = Map.of(
                "model", openAiModel,
                "temperature", 0.2,
                "input", buildPrompt(review)
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

        String output = extractOutputText(response);
        if (output == null || output.isBlank()) {
            throw new IllegalStateException("AI 리뷰 분석 결과가 비어 있습니다.");
        }

        return parse(review.getReviewId(), output);
    }

    private String buildPrompt(Review review) {
        return """
                다음 음식점 고객 리뷰를 사장님이 빠르게 이해할 수 있도록 분석해라.
                리뷰에 없는 사실을 만들지 마라.
                반드시 아래 형식의 한국어로만 답해라.
                요약: 한 문장
                하이라이트:
                - 핵심 내용 1
                - 핵심 내용 2

                전체 별점: %s/5
                맛 별점: %s/5
                포장 별점: %s/5
                시간 별점: %s/5
                리뷰: %s
                """.formatted(
                displayRating(review.getOverallRating()),
                displayRating(review.getTasteRating()),
                displayRating(review.getPackagingRating()),
                displayRating(review.getTimeRating()),
                review.getContent().trim()
        );
    }

    private ReviewInsightResponse parse(Long reviewId, String output) {
        String summary = null;
        List<String> highlights = new ArrayList<>();

        for (String rawLine : output.lines().toList()) {
            String line = rawLine.trim();
            if (line.startsWith("요약:")) {
                summary = line.substring("요약:".length()).trim();
            } else if (line.startsWith("-")) {
                String highlight = line.substring(1).trim();
                if (!highlight.isBlank()) {
                    highlights.add(highlight);
                }
            }
        }

        if (summary == null || summary.isBlank()) {
            summary = output.strip();
        }
        if (highlights.isEmpty()) {
            highlights = List.of("리뷰 원문을 확인해 구체적인 개선점을 검토해주세요.");
        }

        return new ReviewInsightResponse(reviewId, summary, List.copyOf(highlights));
    }

    private String extractOutputText(Map<String, Object> response) {
        if (response == null) {
            return null;
        }

        Object outputText = response.get("output_text");
        if (outputText instanceof String text && !text.isBlank()) {
            return text;
        }

        Object output = response.get("output");
        if (output instanceof List<?> outputList) {
            StringBuilder result = new StringBuilder();
            for (Object item : outputList) {
                if (!(item instanceof Map<?, ?> itemMap) || !(itemMap.get("content") instanceof List<?> content)) {
                    continue;
                }
                for (Object contentItem : content) {
                    if (contentItem instanceof Map<?, ?> contentMap && contentMap.get("text") instanceof String text) {
                        result.append(text);
                    }
                }
            }
            return result.isEmpty() ? null : result.toString();
        }
        return null;
    }

    private String displayRating(Integer rating) {
        return rating == null ? "없음" : rating.toString();
    }

    private String ratingHighlight(Integer rating) {
        if (rating == null) {
            return "별점 정보가 없습니다.";
        }
        return rating >= 4 ? "고객 만족도가 높은 리뷰입니다." : "개선 의견을 확인할 필요가 있습니다.";
    }
}
