package io.github.dongyuns.jubjub.domain.review.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "reviews")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "review_id")
    private Long reviewId;

    @Column(name = "order_id", nullable = false, unique = true)
    private Long orderId;

    @Column(name = "member_profile_id", nullable = false)
    private Long memberProfileId;

    @Column(name = "store_id", nullable = false)
    private Long storeId;

    @Column(name = "taste_rating")
    private Integer tasteRating;

    @Column(name = "time_rating")
    private Integer timeRating;

    @Column(name = "packaging_rating")
    private Integer packagingRating;

    @Column(name = "overall_rating")
    private Integer overallRating;

    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    @Column(name = "ai_generated_helped")
    private Boolean aiGeneratedHelped;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
