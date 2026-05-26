package io.github.dongyuns.jubjub.domain.reward.repository;

import io.github.dongyuns.jubjub.domain.reward.entity.RewardHistory;
import io.github.dongyuns.jubjub.domain.user.entity.MemberProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RewardHistoryRepository extends JpaRepository<RewardHistory, Long> {
    // 탈퇴 시 회원의 리워드 내역 싹 지우기
    void deleteAllByMemberProfile(MemberProfile memberProfile);
}