package io.github.dongyuns.jubjub.domain.owner.store.service;

import io.github.dongyuns.jubjub.domain.core.store.entity.Store;
import io.github.dongyuns.jubjub.domain.owner.store.dto.OwnerStoreResponse;
import io.github.dongyuns.jubjub.domain.owner.store.dto.UpdateStoreLocationRequest;
import io.github.dongyuns.jubjub.domain.shared.external.tmap.AddressGeocoder;
import io.github.dongyuns.jubjub.domain.shared.external.tmap.GeocodingResult;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OwnerStoreServiceTest {

    @Mock
    private OwnerStoreResolver ownerStoreResolver;

    @Mock
    private AddressGeocoder addressGeocoder;

    @InjectMocks
    private OwnerStoreService ownerStoreService;

    @Test
    void updatesAddressCoordinatesAndCategoryTogether() {
        Store store = Store.builder()
                .ownerProfileId(1L)
                .name("피자집")
                .address("기존 주소")
                .build();
        String address = "서울 영등포구 당산로42길 16";
        when(ownerStoreResolver.getCurrentOwnerStore("owner@test.com")).thenReturn(store);
        when(addressGeocoder.geocode(address)).thenReturn(new GeocodingResult(37.5347, 126.9028));

        OwnerStoreResponse response = ownerStoreService.updateLocationAndCategory(
                "owner@test.com",
                new UpdateStoreLocationRequest(address, 5)
        );

        assertThat(response.address()).isEqualTo(address);
        assertThat(response.categoryId()).isEqualTo(5);
        assertThat(response.categoryName()).isEqualTo("피자");
        assertThat(response.latitude()).isEqualTo(37.5347);
        assertThat(response.longitude()).isEqualTo(126.9028);
    }
}
