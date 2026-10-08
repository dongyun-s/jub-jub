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

    @Column(columnDefinition = "TEXT")
    private String operatingHours;

    @Column(columnDefinition = "TEXT")
    private String notice;

    // 💡 UI 프로토타입 구현을 위해 유지!
    private int minOrderAmount = 0; // 최소 주문 금액

    @Builder
    public Store(
            Long ownerProfileId,
            Integer categoryId,
            String name,
            String address,
            String phoneNumber,
            Double latitude,
            Double longitude,
            int cookingTimeMinutes,
            String status,
            String originInfo,
            int minOrderAmount,
            String operatingHours,
            String notice
    ) {
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
        this.operatingHours = normalizeInfo(operatingHours);
        this.notice = normalizeInfo(notice);
    }

    public void updateStatus(String status) {
        this.status = status;
    }

    public void updateCookingTimeMinutes(int cookingTimeMinutes) {
        if (cookingTimeMinutes < 1) {
            throw new IllegalArgumentException("조리 시간은 1분 이상이어야 합니다.");
        }
        this.cookingTimeMinutes = cookingTimeMinutes;
    }

    public void updateInfo(String operatingHours, String notice) {
        this.operatingHours = normalizeInfo(operatingHours);
        this.notice = normalizeInfo(notice);
    }

    public void updateOriginInfo(String originInfo) {
        this.originInfo = normalizeInfo(originInfo);
    }

    public void updateMinOrderAmount(int minOrderAmount) {
        if (minOrderAmount < 0) {
            throw new IllegalArgumentException("최소 주문 금액은 0원 이상이어야 합니다.");
        }
        this.minOrderAmount = minOrderAmount;
    }

    public void updateLocationAndCategory(String address, double latitude, double longitude, int categoryId) {
        this.address = address;
        this.latitude = latitude;
        this.longitude = longitude;
        this.categoryId = categoryId;
    }

    private static String normalizeInfo(String value) {
        return value == null || value.isBlank() ? null : value.strip();
    }
}
