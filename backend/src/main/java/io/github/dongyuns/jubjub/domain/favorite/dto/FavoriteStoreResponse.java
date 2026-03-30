package io.github.dongyuns.jubjub.domain.favorite.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class FavoriteStoreResponse {
    private Long favoriteId;
    private Long storeId;
    private String storeName;
    private String categoryName;    // UI 표시용 카테고리명
    private String storeImageUrl;   // UI 표시용 썸네일
    private double rating;          // 평점
    private int reviewCount;        // 리뷰 수
    private int distance;           // 거리 (m)
    private List<String> tags;      // 태그 (ex. 분위기 좋음)
    private String storeStatus;     // 영업 상태 (OPEN, CLOSED)
}