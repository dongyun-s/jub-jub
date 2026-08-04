package io.github.dongyuns.jubjub.domain.core.store.entity;

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

    @Column(nullable = false, unique = true)
    private Long ownerProfileId; // 매장주 프로필 ID (외래키 역할)
    private Integer categoryId; // 카테고리번호 (외래키 역할)

    @Column(nullable = false)
    private String name; // 매장명

    private String address; // 주소

    private String phoneNumber; // 매장 전화번호

    private Double latitude; // 위도
    private Double longitude; // 경도

    private int cookingTimeMinutes = 15; // 기본 조리시간 (분)

    private String status = "OPEN"; // 영업 상태 (OPEN, CLOSED 등)

    @Column(columnDefinition = "TEXT")
    private String originInfo; // 원산지 통합 정보

    // 💡 UI 프로토타입 구현을 위해 유지!
    private int minOrderAmount = 0; // 최소 주문 금액

    @Builder
    public Store(Long ownerProfileId, Integer categoryId, String name, String address, String phoneNumber, Double latitude, Double longitude, int cookingTimeMinutes, String status, String originInfo, int minOrderAmount) {
        this.ownerProfileId = ownerProfileId;
        this.categoryId = categoryId;
        this.name = name;
        this.address = address;
        this.phoneNumber = phoneNumber;
        this.latitude = latitude;
        this.longitude = longitude;
        this.cookingTimeMinutes = cookingTimeMinutes > 0 ? cookingTimeMinutes : 15;
        this.status = status == null || status.isBlank() ? "OPEN" : status;
        this.originInfo = originInfo;
        this.minOrderAmount = minOrderAmount;
    }

    public void updateStatus(String status) {
        this.status = status;
    }

    public void updateLocationAndCategory(String address, double latitude, double longitude, int categoryId) {
        this.address = address;
        this.latitude = latitude;
        this.longitude = longitude;
        this.categoryId = categoryId;
    }
}
