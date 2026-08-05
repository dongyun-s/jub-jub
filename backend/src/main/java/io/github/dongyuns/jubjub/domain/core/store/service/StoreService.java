package io.github.dongyuns.jubjub.domain.core.store.service;

import io.github.dongyuns.jubjub.domain.customer.menu.dto.MenuResponse;
import io.github.dongyuns.jubjub.domain.customer.store.dto.StoreDetailResponse;
import io.github.dongyuns.jubjub.domain.customer.store.dto.StoreListResponse;
import io.github.dongyuns.jubjub.domain.core.menu.repository.MenuRepository;
import io.github.dongyuns.jubjub.domain.core.store.entity.Store;
import io.github.dongyuns.jubjub.domain.core.store.entity.StoreCategory;
import io.github.dongyuns.jubjub.domain.core.store.repository.StoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StoreService {

    private final StoreRepository storeRepository;
    private final MenuRepository menuRepository;

    /**
     * 모든 매장 조회
     */
    public List<StoreListResponse> getAllStores() {
        return getStoresByCategory(null, null);
    }

    /**
     * 카테고리별 매장 조회
     */
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

    /**
     * 매장 상세 조회 (삭제되지 않은 메뉴만 조회)
     */
    public StoreDetailResponse getStoreDetail(Long storeId) {

        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 매장입니다."));

        List<MenuResponse> menus = menuRepository
                .findByStoreIdAndIsDeletedFalse(storeId)
                .stream()
                .map(MenuResponse::from)
                .toList();

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