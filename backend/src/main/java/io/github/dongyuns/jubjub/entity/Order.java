package io.github.dongyuns.jubjub.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_id")
    private Long orderId;

    @Column(name = "order_display_number", nullable = false, unique = true)
    private String orderDisplayNumber;

    @Column(name = "customer_profile_id", nullable = false)
    private Long customerProfileId;

    @Column(name = "store_id", nullable = false)
    private Long storeId;

    @Column(name = "order_status")
    private String orderStatus;

    @Column(name = "ordered_at")
    private LocalDateTime orderedAt;
}