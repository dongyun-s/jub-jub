package io.github.dongyuns.jubjub.payment.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "order_item_options")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class OrderItemOption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_item_id", nullable = false)
    private OrderItem orderItem;

    private Long menuOptionId;

    @Column(nullable = false)
    private String optionName;

    @Column(nullable = false)
    private Integer additionalPrice;

    @Builder
    private OrderItemOption(Long menuOptionId, String optionName, Integer additionalPrice) {
        this.menuOptionId = menuOptionId;
        this.optionName = optionName;
        this.additionalPrice = additionalPrice;
    }

    void assignOrderItem(OrderItem orderItem) {
        this.orderItem = orderItem;
    }
}
