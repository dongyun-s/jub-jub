package io.github.dongyuns.jubjub.domain.ranking.repository;

import io.github.dongyuns.jubjub.domain.user.entity.MemberProfile;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RankingRepository extends JpaRepository<MemberProfile, Long> {

    @Query(value = """
            SELECT
                ROW_NUMBER() OVER (
                    ORDER BY mp.total_walking_distance DESC, mp.order_count DESC, mp.id ASC
                ) AS ranking,
                mp.id AS userId,
                mp.nickname AS nickname,
                media.image_path AS profileImageUrl,
                mp.tier AS tierCode,
                ROUND(mp.total_walking_distance / 1000.0, 2) AS totalDistanceKm,
                mp.order_count AS pickupCount
            FROM member_profile mp
            LEFT JOIN media
                ON media.media_id = (
                    SELECT MIN(m.media_id)
                    FROM media m
                    WHERE m.owner_type = 'PROFILE'
                      AND m.owner_id = mp.id
                )
            ORDER BY mp.total_walking_distance DESC, mp.order_count DESC, mp.id ASC
            LIMIT :size OFFSET :offset
            """, nativeQuery = true)
    List<RankingProjection> findRankings(@Param("size") int size, @Param("offset") long offset);

    @Query(value = """
            SELECT
                mp.id AS userId,
                mp.nickname AS nickname,
                media.image_path AS profileImageUrl,
                mp.tier AS tierCode,
                ROUND(mp.total_walking_distance / 1000.0, 2) AS totalDistanceKm,
                mp.order_count AS pickupCount
            FROM member_profile mp
            LEFT JOIN media
                ON media.media_id = (
                    SELECT MIN(m.media_id)
                    FROM media m
                    WHERE m.owner_type = 'PROFILE'
                      AND m.owner_id = mp.id
                )
            WHERE mp.id = :userId
            LIMIT 1
            """, nativeQuery = true)
    RankingProjection findRankingProfile(@Param("userId") Long userId);

    @Query(value = """
            SELECT COUNT(*)
            FROM member_profile mp
            WHERE mp.total_walking_distance > :totalDistanceMeters
               OR (
                    mp.total_walking_distance = :totalDistanceMeters
                    AND mp.order_count > :pickupCount
               )
               OR (
                    mp.total_walking_distance = :totalDistanceMeters
                    AND mp.order_count = :pickupCount
                    AND mp.id < :userId
               )
            """, nativeQuery = true)
    long countUsersAhead(
            @Param("userId") Long userId,
            @Param("totalDistanceMeters") int totalDistanceMeters,
            @Param("pickupCount") int pickupCount
    );
}
