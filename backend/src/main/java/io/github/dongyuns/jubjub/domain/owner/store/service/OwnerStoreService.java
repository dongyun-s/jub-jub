package io.github.dongyuns.jubjub.domain.owner.store.service;

import io.github.dongyuns.jubjub.domain.core.media.service.MediaCrudService;
import io.github.dongyuns.jubjub.domain.core.store.entity.Store;
import io.github.dongyuns.jubjub.domain.core.store.entity.StoreCategory;
import io.github.dongyuns.jubjub.domain.owner.store.dto.OwnerStoreResponse;
import io.github.dongyuns.jubjub.domain.owner.store.dto.UpdateStoreImageRequest;
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
    private final MediaCrudService mediaCrudService;

    /**
     * 내 매장 조회 (Response)
     */
    @Transactional(readOnly = true)
    public OwnerStoreResponse getMyStore(String accountEmail) {
        Store store = ownerStoreResolver.getCurrentOwnerStore(accountEmail);
        return toResponse(store);
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

        return toResponse(store);
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

        return toResponse(store);
    }

    @Transactional
    public OwnerStoreResponse updateImage(
            String accountEmail,
            UpdateStoreImageRequest request
    ) {
        Store store = ownerStoreResolver.getCurrentOwnerStore(accountEmail);
        String imageUrl = mediaCrudService.saveStoreImage(store.getId(), request.imageUrl());
        return OwnerStoreResponse.from(store, imageUrl);
    }

    private OwnerStoreResponse toResponse(Store store) {
        return OwnerStoreResponse.from(store, mediaCrudService.getStoreImage(store.getId()));
    }
}
