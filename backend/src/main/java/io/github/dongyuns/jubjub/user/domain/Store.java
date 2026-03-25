package io.github.dongyuns.jubjub.user.domain;

import io.github.dongyuns.jubjub.payment.domain.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "stores")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Store extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long ownerProfileId;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(length = 100)
    private String category;

    @Column(length = 255)
    private String address;

    private Float lat;

    private Float lng;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private StoreStatus status;

    @Builder
    private Store(
            Long ownerProfileId,
            String name,
            String category,
            String address,
            Float lat,
            Float lng,
            StoreStatus status
    ) {
        this.ownerProfileId = ownerProfileId;
        this.name = name;
        this.category = category;
        this.address = address;
        this.lat = lat;
        this.lng = lng;
        this.status = status;
    }
}
