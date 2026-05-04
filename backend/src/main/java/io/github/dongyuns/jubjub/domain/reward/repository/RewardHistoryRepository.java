package io.github.dongyuns.jubjub.domain.reward.repository;

import io.github.dongyuns.jubjub.domain.reward.entity.RewardHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RewardHistoryRepository extends JpaRepository<RewardHistory, Long> {
}