package io.github.dongyuns.jubjub.domain.reward.repository;

import io.github.dongyuns.jubjub.domain.reward.entity.MemberCoupon;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;

public interface MemberCouponRepository extends JpaRepository<MemberCoupon, Long> {
    // 나중에 마이페이지나 결제창에서 유저의 미사용 쿠폰 목록을 조회할 때 씁니다.
    List<MemberCoupon> findAllByMemberProfileIdAndIsUsedFalse(Long memberProfileId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select mc from MemberCoupon mc where mc.id in :ids")
    List<MemberCoupon> findAllByIdInForUpdate(@Param("ids") List<Long> ids);

    // 유효기간이 지났고, 아직 사용되지 않았으며, 만료 처리가 안 된 쿠폰들을 일괄 만료 처리(isExpired = true)합니다.
    @Modifying(clearAutomatically = true) // 벌크 연산 후 1차 캐시 클리어 필수
    @Query("UPDATE MemberCoupon mc SET mc.isExpired = true " +
            "WHERE mc.expiredAt < :now AND mc.isUsed = false AND mc.isExpired = false")
    int expireExpiredCoupons(@Param("now") LocalDateTime now);
}
