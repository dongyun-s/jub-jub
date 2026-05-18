package io.github.dongyuns.jubjub.payment.domain;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "order_items")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    private Long menuId;

    @Column(nullable = false)
    private String menuName;

    @Column(nullable = false)
    private Integer menuPrice;

    @Column(nullable = false)
    private Integer quantity;

    @Column(length = 500)
    private String requestMemo;

    @Column(nullable = false)
    private Integer itemTotalAmount;

    @OneToMany(mappedBy = "orderItem", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<OrderItemOption> options = new ArrayList<>();

    @Builder
    private OrderItem(
            Long menuId,
            String menuName,
            Integer menuPrice,
            Integer quantity,
            String requestMemo,
            Integer itemTotalAmount
    ) {
        this.menuId = menuId;
        this.menuName = menuName;
        this.menuPrice = menuPrice;
        this.quantity = quantity;
        this.requestMemo = requestMemo;
        this.itemTotalAmount = itemTotalAmount;
    }

    void assignOrder(Order order) {
        this.order = order;
    }

    public void addOption(OrderItemOption option) {
        options.add(option);
        option.assignOrderItem(this);
    }
}
