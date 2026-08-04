package io.github.dongyuns.jubjub.domain.core.review.repository;

import io.github.dongyuns.jubjub.domain.core.review.entity.ReviewReply;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReviewReplyRepository extends JpaRepository<ReviewReply, Long> {

    Optional<ReviewReply> findByReviewReviewId(Long reviewId);

    List<ReviewReply> findByReviewReviewIdIn(Collection<Long> reviewIds);
}
