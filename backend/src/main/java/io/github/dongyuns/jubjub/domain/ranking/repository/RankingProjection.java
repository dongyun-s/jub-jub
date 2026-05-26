package io.github.dongyuns.jubjub.domain.ranking.repository;

import java.math.BigDecimal;

public interface RankingProjection {
    Long getRanking();

    Long getUserId();

    String getNickname();

    String getProfileImageUrl();

    Integer getTierCode();

    BigDecimal getTotalDistanceKm();

    Integer getPickupCount();
}
