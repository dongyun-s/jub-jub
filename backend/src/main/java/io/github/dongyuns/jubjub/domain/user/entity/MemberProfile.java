package io.github.dongyuns.jubjub.domain.user.entity;

import io.github.dongyuns.jubjub.domain.auth.entity.Account;
import io.github.dongyuns.jubjub.domain.reward.enums.RewardTier; // 등급 Enum 임포트
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "member_profile")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MemberProfile {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 계정(Account)과 1:1 관계 설정
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", unique = true, nullable = false)
    private Account account;

    @Column(nullable = false)
    private String name;

    @Column(unique = true, nullable = false)
    private String phone;

    private String nickname;

    // ==========================================
    // [리워드 지갑 영역] - 초기값 설정
    // ==========================================
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RewardTier tier = RewardTier.BRONZE;  // 기본 등급은 브론즈

    private int pointBalance = 0;         // 포인트 잔액
    private int cumulativeXp = 0;       // 누적 경험치 (픽업 주문 시마다 증가)
    private int totalWalkingDistance = 0; // 누적 도보 거리
    private int orderCount = 0;           // 누적 주문 횟수
    private boolean pushAgree = true;     // 푸시 알림 동의 여부

    @Builder
    public MemberProfile(Account account, String name, String phone, String nickname, int pointBalance) {
        this.account = account;
        this.name = name;
        this.phone = phone;
        this.nickname = nickname;
        this.pointBalance = pointBalance;
    }

    // ==========================================
    // [비즈니스 로직] - 객체 상태의 안전한 변경
    // ==========================================

    /**
     * 픽업 주문 완료 시 호출되는 메서드
     * 경험치와 도보 거리를 누적하고, 횟수를 1 증가시킨 뒤 자동으로 등급을 갱신합니다.
     */
    public void addRewardOnPickup(int earnedXp, int walkedDistanceMeters) {
        this.cumulativeXp += earnedXp;
        this.totalWalkingDistance += walkedDistanceMeters;
        this.orderCount += 1; // 픽업 주문 횟수 증가

        updateTier(); // 상태가 변했으므로 등급 승급 심사 진행
    }

    /**
     * 쿠폰 사용 등으로 포인트 잔액을 조절할 때 사용합니다.
     */
    public void addPoint(int points) {
        this.pointBalance += points;
    }

    public void deductPoint(int points) {
        if (this.pointBalance < points) {
            throw new IllegalStateException("포인트 잔액이 부족합니다.");
        }
        this.pointBalance -= points;
    }

    /**
     * 내부 메서드: 현재 누적 주문 횟수를 기반으로 달성 가능한 최고 등급을 계산하여 갱신합니다.
     */
    private void updateTier() {
        // RewardTier Enum에 만들어둔 계산 로직을 활용합니다.
        RewardTier calculatedTier = RewardTier.calculateTier(this.orderCount);

        // 만약 계산된 등급이 현재 등급과 다르다면 (승급했다면) 갱신합니다.
        if (this.tier != calculatedTier) {
            this.tier = calculatedTier;
        }
    }
}
