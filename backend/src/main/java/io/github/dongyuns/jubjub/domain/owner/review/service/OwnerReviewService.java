package io.github.dongyuns.jubjub.domain.owner.review.service;

import io.github.dongyuns.jubjub.domain.core.account.entity.Account;
import io.github.dongyuns.jubjub.domain.core.account.entity.AccountRole;
import io.github.dongyuns.jubjub.domain.core.account.repository.AccountRepository;
import io.github.dongyuns.jubjub.domain.core.media.entity.Media;
import io.github.dongyuns.jubjub.domain.core.media.repository.MediaRepository;
import io.github.dongyuns.jubjub.domain.core.member.entity.MemberProfile;
import io.github.dongyuns.jubjub.domain.core.member.repository.MemberProfileRepository;
import io.github.dongyuns.jubjub.domain.core.order.entity.Order;
import io.github.dongyuns.jubjub.domain.core.review.entity.Review;
import io.github.dongyuns.jubjub.domain.core.review.entity.ReviewReply;
import io.github.dongyuns.jubjub.domain.core.review.repository.ReviewReplyRepository;
import io.github.dongyuns.jubjub.domain.core.store.entity.Store;
import io.github.dongyuns.jubjub.domain.core.store.repository.StoreRepository;
import io.github.dongyuns.jubjub.domain.owner.review.dto.OwnerReviewDetailResponse;
import io.github.dongyuns.jubjub.domain.owner.review.dto.OwnerReviewListResponse;
import io.github.dongyuns.jubjub.domain.owner.review.dto.OwnerReviewSummaryResponse;
import io.github.dongyuns.jubjub.domain.owner.review.dto.RatingDistributionResponse;
import io.github.dongyuns.jubjub.domain.owner.review.dto.ReviewInsightResponse;
import io.github.dongyuns.jubjub.domain.owner.review.dto.ReviewReplyRequest;
import io.github.dongyuns.jubjub.domain.owner.review.dto.ReviewReplyResponse;
import io.github.dongyuns.jubjub.domain.owner.review.repository.OwnerReviewQueryRepository;
import io.github.dongyuns.jubjub.domain.owner.review.repository.OwnerReviewQueryRepository.ReviewFilter;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class OwnerReviewService {

    private static final String REVIEW_MEDIA_OWNER_TYPE = "REVIEW";

    private final AccountRepository accountRepository;
    private final MemberProfileRepository memberProfileRepository;
    private final StoreRepository storeRepository;
    private final MediaRepository mediaRepository;
    private final ReviewReplyRepository reviewReplyRepository;
    private final OwnerReviewQueryRepository ownerReviewQueryRepository;
    private final ReviewInsightService reviewInsightService;

    @Transactional(readOnly = true)
    public OwnerReviewListResponse getReviews(String email, ReviewFilter filter, String keyword) {
        Store store = resolveOwnedStore(email);
        ReviewFilter effectiveFilter = filter == null ? ReviewFilter.ALL : filter;
        List<Review> reviews = ownerReviewQueryRepository.findReviews(store.getId(), effectiveFilter, keyword);
        ReviewMetadata metadata = loadMetadata(reviews);

        List<OwnerReviewListResponse.ReviewItem> items = reviews.stream()
                .map(review -> toListItem(review, metadata))
                .toList();
        return new OwnerReviewListResponse(items, items.size());
    }

    @Transactional(readOnly = true)
    public OwnerReviewSummaryResponse getSummary(String email) {
        Store store = resolveOwnedStore(email);
        List<Review> reviews = ownerReviewQueryRepository.findReviews(store.getId(), ReviewFilter.ALL, null);
        ReviewMetadata metadata = loadMetadata(reviews);

        double average = reviews.stream()
                .map(Review::getOverallRating)
                .filter(rating -> rating != null)
                .mapToInt(Integer::intValue)
                .average()
                .orElse(0.0);
        average = Math.round(average * 10.0) / 10.0;

        long unanswered = reviews.stream()
                .filter(review -> !metadata.repliesByReviewId().containsKey(review.getReviewId()))
                .count();
        long photoReviews = reviews.stream()
                .filter(review -> !metadata.imagesByReviewId()
                        .getOrDefault(review.getReviewId(), List.of()).isEmpty())
                .count();

        return new OwnerReviewSummaryResponse(
                average,
                reviews.size(),
                unanswered,
                photoReviews,
                ratingDistribution(reviews)
        );
    }

    @Transactional(readOnly = true)
    public OwnerReviewDetailResponse getReview(String email, Long reviewId) {
        Store store = resolveOwnedStore(email);
        Review review = getOwnedReview(store, reviewId);
        ReviewMetadata metadata = loadMetadata(List.of(review));
        Optional<Order> order = ownerReviewQueryRepository.findOrder(review.getOrderId());

        return new OwnerReviewDetailResponse(
                review.getReviewId(),
                review.getOrderId(),
                order.map(Order::getOrderNo).orElse(null),
                order.map(value -> value.getItems().stream().map(item -> item.getMenuName()).toList())
                        .orElseGet(List::of),
                metadata.reviewerNames().getOrDefault(review.getMemberProfileId(), "알 수 없는 고객"),
                review.getOverallRating(),
                review.getTasteRating(),
                review.getPackagingRating(),
                review.getTimeRating(),
                review.getContent(),
                review.getCreatedAt(),
                metadata.imagesByReviewId().getOrDefault(review.getReviewId(), List.of()),
                Optional.ofNullable(metadata.repliesByReviewId().get(review.getReviewId()))
                        .map(this::toReplyResponse)
                        .orElse(null)
        );
    }

    @Transactional
    public ReviewReplyResponse createReply(String email, Long reviewId, ReviewReplyRequest request) {
        Store store = resolveOwnedStore(email);
        Review review = getOwnedReview(store, reviewId);
        if (reviewReplyRepository.findByReviewReviewId(reviewId).isPresent()) {
            throw new IllegalArgumentException("이미 답글이 등록된 리뷰입니다.");
        }

        ReviewReply reply = reviewReplyRepository.saveAndFlush(
                ReviewReply.create(review, request.content().trim())
        );
        return toReplyResponse(reply);
    }

    @Transactional
    public ReviewReplyResponse updateReply(String email, Long reviewId, ReviewReplyRequest request) {
        Store store = resolveOwnedStore(email);
        getOwnedReview(store, reviewId);
        ReviewReply reply = reviewReplyRepository.findByReviewReviewId(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("수정할 답글이 없습니다."));
        reply.updateContent(request.content().trim());
        reviewReplyRepository.flush();
        return toReplyResponse(reply);
    }

    @Transactional
    public void deleteReply(String email, Long reviewId) {
        Store store = resolveOwnedStore(email);
        getOwnedReview(store, reviewId);
        ReviewReply reply = reviewReplyRepository.findByReviewReviewId(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("삭제할 답글이 없습니다."));
        reviewReplyRepository.delete(reply);
    }

    @Transactional(readOnly = true)
    public ReviewInsightResponse generateInsight(String email, Long reviewId) {
        Store store = resolveOwnedStore(email);
        Review review = getOwnedReview(store, reviewId);
        return reviewInsightService.generate(review);
    }

    private Store resolveOwnedStore(String email) {
        Account account = accountRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("계정을 찾을 수 없습니다."));
        if (account.getRole() != AccountRole.OWNER) {
            throw new IllegalArgumentException("사장님 계정만 접근할 수 있습니다.");
        }

        MemberProfile profile = memberProfileRepository.findByAccount(account)
                .orElseThrow(() -> new IllegalArgumentException("회원 프로필을 찾을 수 없습니다."));
        return storeRepository.findByOwnerProfileId(profile.getId())
                .orElseThrow(() -> new IllegalArgumentException("사장님과 연결된 매장을 찾을 수 없습니다."));
    }

    private Review getOwnedReview(Store store, Long reviewId) {
        return ownerReviewQueryRepository.findReview(store.getId(), reviewId)
                .orElseThrow(() -> new IllegalArgumentException("해당 매장의 리뷰를 찾을 수 없습니다."));
    }

    private ReviewMetadata loadMetadata(List<Review> reviews) {
        if (reviews.isEmpty()) {
            return ReviewMetadata.empty();
        }

        List<Long> reviewIds = reviews.stream().map(Review::getReviewId).toList();
        Set<Long> memberIds = reviews.stream().map(Review::getMemberProfileId).collect(Collectors.toSet());

        Map<Long, String> reviewerNames = memberProfileRepository.findAllById(memberIds).stream()
                .collect(Collectors.toMap(MemberProfile::getId, this::displayName));
        Map<Long, List<String>> imagesByReviewId = mediaRepository
                .findByOwnerTypeAndOwnerIdIn(REVIEW_MEDIA_OWNER_TYPE, reviewIds).stream()
                .collect(Collectors.groupingBy(
                        Media::getOwnerId,
                        Collectors.mapping(Media::getImagePath, Collectors.toList())
                ));
        Map<Long, ReviewReply> repliesByReviewId = reviewReplyRepository.findByReviewReviewIdIn(reviewIds).stream()
                .collect(Collectors.toMap(reply -> reply.getReview().getReviewId(), Function.identity()));

        return new ReviewMetadata(reviewerNames, imagesByReviewId, repliesByReviewId);
    }

    private OwnerReviewListResponse.ReviewItem toListItem(Review review, ReviewMetadata metadata) {
        ReviewReply reply = metadata.repliesByReviewId().get(review.getReviewId());
        return new OwnerReviewListResponse.ReviewItem(
                review.getReviewId(),
                review.getOrderId(),
                metadata.reviewerNames().getOrDefault(review.getMemberProfileId(), "알 수 없는 고객"),
                review.getOverallRating(),
                review.getContent(),
                review.getCreatedAt(),
                metadata.imagesByReviewId().getOrDefault(review.getReviewId(), List.of()),
                reply != null,
                reply == null ? null : reply.getContent()
        );
    }

    private RatingDistributionResponse ratingDistribution(Collection<Review> reviews) {
        long[] counts = new long[6];
        reviews.stream().map(Review::getOverallRating).filter(rating -> rating != null && rating >= 1 && rating <= 5)
                .forEach(rating -> counts[rating]++);
        return new RatingDistributionResponse(counts[1], counts[2], counts[3], counts[4], counts[5]);
    }

    private ReviewReplyResponse toReplyResponse(ReviewReply reply) {
        return new ReviewReplyResponse(
                reply.getId(),
                reply.getReview().getReviewId(),
                reply.getContent(),
                reply.getCreatedAt(),
                reply.getUpdatedAt()
        );
    }

    private String displayName(MemberProfile profile) {
        return profile.getNickname() == null || profile.getNickname().isBlank()
                ? profile.getName()
                : profile.getNickname();
    }

    private record ReviewMetadata(
            Map<Long, String> reviewerNames,
            Map<Long, List<String>> imagesByReviewId,
            Map<Long, ReviewReply> repliesByReviewId
    ) {
        static ReviewMetadata empty() {
            return new ReviewMetadata(Collections.emptyMap(), Collections.emptyMap(), Collections.emptyMap());
        }
    }
}
