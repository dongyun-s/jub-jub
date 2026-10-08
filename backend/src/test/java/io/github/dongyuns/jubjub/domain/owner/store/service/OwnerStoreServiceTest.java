package io.github.dongyuns.jubjub.domain.owner.store.service;

import io.github.dongyuns.jubjub.common.exception.BusinessException;
import io.github.dongyuns.jubjub.domain.core.media.service.MediaCrudService;
import io.github.dongyuns.jubjub.domain.core.store.entity.Store;
import io.github.dongyuns.jubjub.domain.owner.store.dto.OwnerStoreResponse;
import io.github.dongyuns.jubjub.domain.owner.store.dto.OwnerStoreStatus;
import io.github.dongyuns.jubjub.domain.owner.store.dto.UpdateStoreImageRequest;
import io.github.dongyuns.jubjub.domain.owner.store.dto.UpdateStoreLocationRequest;
import io.github.dongyuns.jubjub.domain.owner.store.dto.UpdateStoreStatusRequest;
import io.github.dongyuns.jubjub.domain.shared.external.tmap.AddressGeocoder;
import io.github.dongyuns.jubjub.domain.shared.external.tmap.GeocodingResult;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OwnerStoreServiceTest {

    @Mock
    private OwnerStoreResolver ownerStoreResolver;

    @Mock
    private AddressGeocoder addressGeocoder;

    @Mock
    private MediaCrudService mediaCrudService;

    @InjectMocks
    private OwnerStoreService ownerStoreService;

    @Test
    void returnsCurrentOwnersStoreImage() {
        Store store = createStore(7L);
        String imageUrl = "https://images.example.com/store/pizza.jpg";
        when(ownerStoreResolver.getCurrentOwnerStore("owner@test.com")).thenReturn(store);
        when(mediaCrudService.getStoreImage(7L)).thenReturn(imageUrl);

        OwnerStoreResponse response = ownerStoreService.getMyStore("owner@test.com");

        assertThat(response.storeId()).isEqualTo(7L);
        assertThat(response.name()).isEqualTo("피자집");
        assertThat(response.imageUrl()).isEqualTo(imageUrl);
    }

    @Test
    void savesImageOnlyForAuthenticatedOwnersStoreAndReturnsNormalizedUrl() {
        Store store = createStore(7L);
        String imageUrl = "https://images.example.com/store/pizza.jpg";
        String requestedImageUrl = "  " + imageUrl + "  ";
        when(ownerStoreResolver.getCurrentOwnerStore("owner@test.com")).thenReturn(store);
        when(mediaCrudService.saveStoreImage(7L, requestedImageUrl)).thenReturn(imageUrl);

        OwnerStoreResponse response = ownerStoreService.updateImage(
                "owner@test.com", new UpdateStoreImageRequest(requestedImageUrl)
        );

        verify(mediaCrudService).saveStoreImage(7L, requestedImageUrl);
        assertThat(response.storeId()).isEqualTo(7L);
        assertThat(response.imageUrl()).isEqualTo(imageUrl);
    }

    @Test
    void doesNotAccessImagesWhenOwnerAccessIsDenied() {
        BusinessException denied = new BusinessException(
                "OWNER_FORBIDDEN", "사장님 계정만 접근할 수 있습니다.", HttpStatus.FORBIDDEN
        );
        when(ownerStoreResolver.getCurrentOwnerStore("customer@test.com")).thenThrow(denied);

        assertThatThrownBy(() -> ownerStoreService.updateImage(
                "customer@test.com",
                new UpdateStoreImageRequest("https://images.example.com/store/pizza.jpg")
        )).isSameAs(denied);

        verifyNoInteractions(mediaCrudService);
    }

    @Test
    void keepsStoreImageWhenUpdatingStatus() {
        Store store = createStore(7L);
        String imageUrl = "https://images.example.com/store/pizza.jpg";
        when(ownerStoreResolver.getCurrentOwnerStore("owner@test.com")).thenReturn(store);
        when(mediaCrudService.getStoreImage(7L)).thenReturn(imageUrl);

        OwnerStoreResponse response = ownerStoreService.updateStatus(
                "owner@test.com", new UpdateStoreStatusRequest(OwnerStoreStatus.PAUSED)
        );

        assertThat(response.status()).isEqualTo("PAUSED");
        assertThat(response.imageUrl()).isEqualTo(imageUrl);
    }

    @Test
    void updatesAddressCoordinatesAndCategoryTogether() {
        Store store = createStore(7L);
        String address = "서울 영등포구 당산로42길 16";
        String imageUrl = "https://images.example.com/store/pizza.jpg";
        when(ownerStoreResolver.getCurrentOwnerStore("owner@test.com")).thenReturn(store);
        when(addressGeocoder.geocode(address)).thenReturn(new GeocodingResult(37.5347, 126.9028));
        when(mediaCrudService.getStoreImage(7L)).thenReturn(imageUrl);

        OwnerStoreResponse response = ownerStoreService.updateLocationAndCategory(
                "owner@test.com",
                new UpdateStoreLocationRequest(address, 5)
        );

        assertThat(response.address()).isEqualTo(address);
        assertThat(response.categoryId()).isEqualTo(5);
        assertThat(response.categoryName()).isEqualTo("피자");
        assertThat(response.latitude()).isEqualTo(37.5347);
        assertThat(response.longitude()).isEqualTo(126.9028);
        assertThat(response.imageUrl()).isEqualTo(imageUrl);
    }

    private Store createStore(Long storeId) {
        Store store = Store.builder()
                .ownerProfileId(1L)
                .name("피자집")
                .address("기존 주소")
                .build();
        ReflectionTestUtils.setField(store, "id", storeId);
        return store;
    }
}
