package io.github.dongyuns.jubjub.domain.review.repository;

import io.github.dongyuns.jubjub.domain.review.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    // 특정 가게 리뷰 조회
    List<Review> findByStoreId(Long storeId);

    // 특정 가게 + 맛 평점 필터
    List<Review> findByStoreIdAndTasteRating(Long storeId, Integer tasteRating);

    // 내가 쓴 리뷰
    List<Review> findByMemberProfileId(Long memberProfileId);

    // 주문당 리뷰 1개 제한 체크
    Optional<Review> findByOrderId(Long orderId);

    @Query("""
            select r.storeId as storeId,
                   avg(r.overallRating) as averageRating,
                   count(r.reviewId) as reviewCount
            from Review r
            where r.storeId in :storeIds
            group by r.storeId
            """)
    List<StoreRatingSummary> findStoreRatingSummaries(@Param("storeIds") Collection<Long> storeIds);

    interface StoreRatingSummary {
        Long getStoreId();
        Double getAverageRating();
        Long getReviewCount();
    }
}
