package io.github.dongyuns.jubjub.domain.core.store.service;

import io.github.dongyuns.jubjub.domain.customer.menu.dto.MenuResponse;
import io.github.dongyuns.jubjub.domain.customer.store.dto.StoreDetailResponse;
import io.github.dongyuns.jubjub.domain.customer.store.dto.StoreListResponse;
import io.github.dongyuns.jubjub.domain.core.store.entity.Store;
import io.github.dongyuns.jubjub.domain.core.store.entity.StoreCategory;
import io.github.dongyuns.jubjub.domain.core.menu.repository.MenuRepository;
import io.github.dongyuns.jubjub.domain.core.store.repository.StoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true) // 데이터 조회만 하니까 readOnly를 걸어주면 성능이 빨라집니다!
public class StoreService {

    private final StoreRepository storeRepository;
    private final MenuRepository menuRepository;

    // 1. 모든 매장 목록 조회 (홈 화면)
    public List<StoreListResponse> getAllStores() {
        return getStoresByCategory(null, null);
    }

    public List<StoreListResponse> getStoresByCategory(Integer categoryId, String category) {
        StoreCategory resolvedCategory = StoreCategory.resolve(categoryId, category);

        List<Store> stores = resolvedCategory == null
                ? storeRepository.findAll()
                : storeRepository.findByCategoryIdOrderByIdAsc(resolvedCategory.getId());

        return stores.stream()
                .sorted((left, right) -> Long.compare(left.getId(), right.getId()))
                .map(StoreListResponse::from)
                .toList();
    }

    // 2. 특정 매장 상세 조회 (메뉴 목록 포함)
    public StoreDetailResponse getStoreDetail(Long storeId) {
        // 매장 정보 꺼내기
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 매장입니다."));

        // 이 매장에 속한 메뉴들만 꺼내서 DTO로 변환
        List<MenuResponse> menus = menuRepository.findByStoreId(storeId).stream()
                .map(MenuResponse::from)
                .toList();

        // 매장 정보와 메뉴 리스트를 하나의 큰 DTO로 합쳐서 반환!
        return new StoreDetailResponse(
                store.getId(),
                store.getName(),
                store.getAddress(),
                store.getPhoneNumber(),
                store.getOriginInfo(),
                store.getCookingTimeMinutes(),
                store.getMinOrderAmount(),
                menus
        );
    }
}
