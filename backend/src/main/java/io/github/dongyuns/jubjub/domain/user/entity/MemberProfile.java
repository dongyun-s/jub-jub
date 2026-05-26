package io.github.dongyuns.jubjub.domain.user.entity;

import io.github.dongyuns.jubjub.domain.auth.entity.Account;
import io.github.dongyuns.jubjub.domain.reward.enums.RewardTier; // 등급 Enum 임포트
import io.github.dongyuns.jubjub.domain.reward.enums.RewardTierConverter;
import io.github.dongyuns.jubjub.global.common.BaseTimeEntity; //  공통 시간 엔티티 임포트
import java.time.LocalDateTime;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "member_profile",
        indexes = @Index(name = "idx_member_profile_ranking", columnList = "total_walking_distance DESC, order_count DESC, id ASC")
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
// 🌟 추가: BaseTimeEntity를 상속받아 생성/수정 시간 자동화
public class MemberProfile extends BaseTimeEntity {

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
    @Convert(converter = RewardTierConverter.class)
    @Column(nullable = false, columnDefinition = "INT DEFAULT 0")
    private RewardTier tier = RewardTier.BRONZE;  // 기본 등급은 브론즈

    private int pointBalance = 0;         // 포인트 잔액
    @Column(name = "total_walking_distance", nullable = false)
    private int totalWalkingDistance = 0; // 누적 도보 거리

    @Column(name = "order_count", nullable = false)
    private int orderCount = 0;            // 누적 주문(픽업) 횟수 - 원본 유지
    private int cumulativeXp = 0;         // 누적 경험치 (향후 출석체크 등 다른 보상 이벤트에서도 활용 가능하도록 추가)
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
     * 픽업 뿐만 아니라 다양한 보상 이벤트에서 재사용 가능하도록 개편
     * 도보 거리를 누적하고, 픽업(isPickup)인 경우에만 횟수를 1 증가시킨 뒤 등급을 갱신합니다.
     */
    public int addReward(int walkedDistanceMeters, boolean isPickup) {
        // 1. 기존 거리 저장 (10km 단위 계산용)
        int previousDistance = this.totalWalkingDistance;

        // 2. 거리 누적
        this.totalWalkingDistance += walkedDistanceMeters;

        // 3. 픽업으로 인한 보상일 때만 orderCount 증가 및 승급 심사
        if (isPickup) {
            this.orderCount += 1;
            updateTier();
        }

        // 4. 돌파한 10km 구간 개수 계산 (예: 9,000m -> 11,000m 이면 (1 - 0) = 1개 반환)
        int previousMilestone = previousDistance / 10000;
        int currentMilestone = this.totalWalkingDistance / 10000;

        return currentMilestone - previousMilestone;
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

    // 탈퇴 여부 및 탈퇴 요청 일시
    @Column(nullable = false)
    private boolean isDeleted = false;

    private LocalDateTime deletedAt;

    // Soft Delete 메서드
    public void softDelete() {
        this.isDeleted = true;
        this.deletedAt = LocalDateTime.now(); // 탈퇴를 요청한 현재 시간 기록
    }

    // 30일 후 개인정보 파기 (익명화) 메서드
    public void anonymize() {
        this.name = "탈퇴회원";
        this.phone = "00000000000"; // 전화번호 무효화
        this.nickname = "알수없음";
        this.pushAgree = false;
    }

    // 프로필 복구 (탈퇴 취소)
    public void restore() {
        this.isDeleted = false;
        this.deletedAt = null; // 탈퇴 요청 시간도 싹 지워줍니다!
    }
}
