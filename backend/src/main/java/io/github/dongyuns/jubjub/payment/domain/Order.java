package io.github.dongyuns.jubjub.payment.domain;

import io.github.dongyuns.jubjub.domain.store.entity.Store;
import io.github.dongyuns.jubjub.domain.user.entity.MemberProfile;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "orders")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Order extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "member_profile_id", nullable = false)
    private MemberProfile memberProfile;

    @ManyToOne(optional = false)
    @JoinColumn(name = "store_id", nullable = false)
    private Store store;

    @Column(nullable = false, unique = true, length = 100)
    private String orderNo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private OrderStatus status;

    @Column(nullable = false)
    private Integer finalAmount;

    @Column(nullable = false)
    private LocalDateTime requestedAt;

    private LocalDateTime paidAt;

    @Version
    @Column(nullable = false)
    private Long version;

    @Builder
    private Order(MemberProfile memberProfile, Store store, String orderNo, OrderStatus status, Integer finalAmount, LocalDateTime requestedAt) {
        this.memberProfile = memberProfile;
        this.store = store;
        this.orderNo = orderNo;
        this.status = status;
        this.finalAmount = finalAmount;
        this.requestedAt = requestedAt;
    }

    public static Order ready(MemberProfile memberProfile, Store store, String orderNo, Integer finalAmount) {
        // 주문 생성 시점에는 결제 전 상태와 최종 결제 금액을 같이 고정한다.
        return Order.builder()
                .memberProfile(memberProfile)
                .store(store)
                .orderNo(orderNo)
                .status(OrderStatus.READY)
                .finalAmount(finalAmount)
                .requestedAt(LocalDateTime.now())
                .build();
    }

    public void markPaid(LocalDateTime paidAt) {
        // 주문은 결제가 실제 승인된 뒤에만 PAID로 바뀐다.
        this.status = OrderStatus.PAID;
        this.paidAt = paidAt;
    }

    /**
     * 픽업 완료 처리 메서드
     * 주문의 상태를 변경하고 완료 시간을 기록합니다.
     */
    public void completePickup() {
        // 1. 상태 변경 (OrderStatus Enum에 PICKUP_COMPLETED가 정의되어 있어야 합니다)
        // 팀원분이 만드신 Enum 명칭을 확인해 보세요! (예: PICKUP_DONE, COMPLETED 등)
        this.status = OrderStatus.PICKUP_COMPLETED;

        // 2. 완료 시간 기록 (필드가 있다면 추가)
        // this.completedAt = LocalDateTime.now();
    }

    public void markRefunded() {
        this.status = OrderStatus.REFUNDED;
    }

    public Long getMemberProfileId() {
        return memberProfile.getId();
    }

    public Long getStoreId() {
        return store.getId();
    }
}
