package io.github.dongyuns.jubjub.domain.owner.review.repository;

import io.github.dongyuns.jubjub.domain.core.order.entity.Order;
import io.github.dongyuns.jubjub.domain.core.review.entity.Review;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class OwnerReviewQueryRepository {

    private final EntityManager entityManager;

    public List<Review> findReviews(Long storeId, ReviewFilter filter, String keyword) {
        StringBuilder jpql = new StringBuilder("select r from Review r where r.storeId = :storeId");

        if (filter == ReviewFilter.UNANSWERED) {
            jpql.append(" and not exists (select rr.id from ReviewReply rr where rr.review = r)");
        } else if (filter == ReviewFilter.PHOTO) {
            jpql.append(" and exists (select m.mediaId from Media m")
                    .append(" where m.ownerType = 'REVIEW' and m.ownerId = r.reviewId)");
        }

        boolean hasKeyword = keyword != null && !keyword.isBlank();
        if (hasKeyword) {
            jpql.append(" and (lower(coalesce(r.content, '')) like :keyword")
                    .append(" or exists (select oi.id from OrderItem oi")
                    .append(" where oi.order.id = r.orderId and lower(oi.menuName) like :keyword))");
        }

        jpql.append(" order by r.createdAt desc, r.reviewId desc");
        TypedQuery<Review> query = entityManager.createQuery(jpql.toString(), Review.class)
                .setParameter("storeId", storeId);

        if (hasKeyword) {
            query.setParameter("keyword", "%" + keyword.trim().toLowerCase(Locale.ROOT) + "%");
        }

        return query.getResultList();
    }

    public Optional<Order> findOrder(Long orderId) {
        return Optional.ofNullable(entityManager.find(Order.class, orderId));
    }

    public Optional<Review> findReview(Long storeId, Long reviewId) {
        return entityManager.createQuery(
                        "select r from Review r where r.storeId = :storeId and r.reviewId = :reviewId",
                        Review.class
                )
                .setParameter("storeId", storeId)
                .setParameter("reviewId", reviewId)
                .getResultStream()
                .findFirst();
    }

    public enum ReviewFilter {
        ALL,
        UNANSWERED,
        PHOTO
    }
}
