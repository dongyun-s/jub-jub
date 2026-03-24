package io.github.dongyuns.jubjub.domain.store.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "store")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Store {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long ownerProfileId; // 사장님 프로필 ID (ERD 기준)

    @Column(nullable = false)
    private String name; // 매장명

    private String category; // 한식, 중식, 일식 등

    private String address; // 주소

    private Double latitude; // 위도
    private Double longitude; // 경도

    private int cookingTimeMinutes = 15; // 기본 조리시간 (분)

    private String status = "OPEN"; // 영업 상태 (OPEN, CLOSED 등)

    // 🌟 UI 프로토타입을 반영하여 추가한 필드!
    private int minOrderAmount = 0; // 최소 주문 금액

    @Builder
    public Store(Long ownerProfileId, String name, String category, String address, Double latitude, Double longitude, int cookingTimeMinutes, String status, int minOrderAmount) {
        this.ownerProfileId = ownerProfileId;
        this.name = name;
        this.category = category;
        this.address = address;
        this.latitude = latitude;
        this.longitude = longitude;
        this.cookingTimeMinutes = cookingTimeMinutes;
        this.status = status;
        this.minOrderAmount = minOrderAmount;
    }
}