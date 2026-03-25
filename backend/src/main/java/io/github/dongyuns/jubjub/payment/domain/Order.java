package io.github.dongyuns.jubjub.payment.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import io.github.dongyuns.jubjub.user.domain.CustomerProfile;
import io.github.dongyuns.jubjub.user.domain.Store;

@Getter
@Entity
@Table(name = "orders")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Order extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "customer_profile_id", nullable = false)
    private CustomerProfile customerProfile;

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

    @OneToOne(mappedBy = "order")
    private Payment payment;

    @Builder
    private Order(CustomerProfile customerProfile, Store store, String orderNo, OrderStatus status, Integer finalAmount, LocalDateTime requestedAt) {
        this.customerProfile = customerProfile;
        this.store = store;
        this.orderNo = orderNo;
        this.status = status;
        this.finalAmount = finalAmount;
        this.requestedAt = requestedAt;
    }

    public static Order ready(CustomerProfile customerProfile, Store store, String orderNo, Integer finalAmount) {
        return Order.builder()
                .customerProfile(customerProfile)
                .store(store)
                .orderNo(orderNo)
                .status(OrderStatus.READY)
                .finalAmount(finalAmount)
                .requestedAt(LocalDateTime.now())
                .build();
    }

    public void markPaid(LocalDateTime paidAt) {
        this.status = OrderStatus.PAID;
        this.paidAt = paidAt;
    }

    public void markFailed() {
        this.status = OrderStatus.FAILED;
    }

    public void markRefunded() {
        this.status = OrderStatus.REFUNDED;
    }

    public Long getCustomerProfileId() {
        return customerProfile.getId();
    }

    public Long getStoreId() {
        return store.getId();
    }
}
