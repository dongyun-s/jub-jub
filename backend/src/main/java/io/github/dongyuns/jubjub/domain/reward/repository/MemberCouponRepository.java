package io.github.dongyuns.jubjub.domain.reward.repository;

import io.github.dongyuns.jubjub.domain.reward.entity.MemberCoupon;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MemberCouponRepository extends JpaRepository<MemberCoupon, Long> {
    // 나중에 마이페이지나 결제창에서 유저의 미사용 쿠폰 목록을 조회할 때 씁니다.
    List<MemberCoupon> findAllByMemberProfileIdAndIsUsedFalse(Long memberProfileId);
}