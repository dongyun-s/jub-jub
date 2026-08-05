package io.github.dongyuns.jubjub.domain.owner.store.service;

import io.github.dongyuns.jubjub.domain.core.store.entity.Store;
import io.github.dongyuns.jubjub.domain.core.store.entity.StoreCategory;
import io.github.dongyuns.jubjub.domain.owner.store.dto.OwnerStoreResponse;
import io.github.dongyuns.jubjub.domain.owner.store.dto.UpdateStoreLocationRequest;
import io.github.dongyuns.jubjub.domain.owner.store.dto.UpdateStoreStatusRequest;
import io.github.dongyuns.jubjub.domain.shared.external.tmap.AddressGeocoder;
import io.github.dongyuns.jubjub.domain.shared.external.tmap.GeocodingResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class OwnerStoreService {

    private final OwnerStoreResolver ownerStoreResolver;
    private final AddressGeocoder addressGeocoder;

    /**
     * 내 매장 조회 (Response)
     */
    @Transactional(readOnly = true)
    public OwnerStoreResponse getMyStore(String accountEmail) {
        return OwnerStoreResponse.from(ownerStoreResolver.getCurrentOwnerStore(accountEmail));
    }

    /**
     * 메뉴/주문/리뷰 등 내부 서비스에서 사용할 Store Entity 조회
     */
    @Transactional(readOnly = true)
    public Store getCurrentStore(String accountEmail) {
        return ownerStoreResolver.getCurrentOwnerStore(accountEmail);
    }

    /**
     * 영업 상태 변경
     */
    @Transactional
    public OwnerStoreResponse updateStatus(
            String accountEmail,
            UpdateStoreStatusRequest request
    ) {

        Store store = ownerStoreResolver.getCurrentOwnerStore(accountEmail);

        store.updateStatus(request.status().name());

        return OwnerStoreResponse.from(store);
    }

    /**
     * 주소 / 위치 / 카테고리 수정
     */
    @Transactional
    public OwnerStoreResponse updateLocationAndCategory(
            String accountEmail,
            UpdateStoreLocationRequest request
    ) {

        Store store = ownerStoreResolver.getCurrentOwnerStore(accountEmail);

        StoreCategory category = StoreCategory.fromId(request.categoryId());

        GeocodingResult coordinates =
                addressGeocoder.geocode(request.address());

        store.updateLocationAndCategory(
                request.address().trim(),
                coordinates.latitude(),
                coordinates.longitude(),
                category.getId()
        );

        return OwnerStoreResponse.from(store);
    }
}