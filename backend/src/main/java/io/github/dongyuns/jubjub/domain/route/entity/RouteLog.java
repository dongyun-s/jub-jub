package io.github.dongyuns.jubjub.domain.route.entity;

import io.github.dongyuns.jubjub.domain.route.dto.TravelMode;
import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor
@Table(name = "route_logs")
public class RouteLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long storeId;

    @Column(nullable = false)
    private Double userLat;

    @Column(nullable = false)
    private Double userLng;

    @Column(nullable = false)
    private Double storeLat;

    @Column(nullable = false)
    private Double storeLng;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TravelMode travelMode;

    @Column(nullable = false)
    private Double distanceKm;

    @Column(nullable = false)
    private Integer travelTimeMinutes;

    @Column(nullable = false)
    private Integer foodPrepTimeMinutes;

    @Column(nullable = false)
    private Boolean leaveNow;

    @Column(nullable = false)
    private Integer recommendedDepartureDelayMinutes;

    @Column(nullable = false)
    private LocalDateTime recommendedDepartureTime;

    @Column(nullable = false)
    private LocalDateTime expectedArrivalTime;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Builder
    public RouteLog(
            Long storeId,
            Double userLat,
            Double userLng,
            Double storeLat,
            Double storeLng,
            TravelMode travelMode,
            Double distanceKm,
            Integer travelTimeMinutes,
            Integer foodPrepTimeMinutes,
            Boolean leaveNow,
            Integer recommendedDepartureDelayMinutes,
            LocalDateTime recommendedDepartureTime,
            LocalDateTime expectedArrivalTime,
            LocalDateTime createdAt
    ) {
        this.storeId = storeId;
        this.userLat = userLat;
        this.userLng = userLng;
        this.storeLat = storeLat;
        this.storeLng = storeLng;
        this.travelMode = travelMode;
        this.distanceKm = distanceKm;
        this.travelTimeMinutes = travelTimeMinutes;
        this.foodPrepTimeMinutes = foodPrepTimeMinutes;
        this.leaveNow = leaveNow;
        this.recommendedDepartureDelayMinutes = recommendedDepartureDelayMinutes;
        this.recommendedDepartureTime = recommendedDepartureTime;
        this.expectedArrivalTime = expectedArrivalTime;
        this.createdAt = createdAt;
    }
}
