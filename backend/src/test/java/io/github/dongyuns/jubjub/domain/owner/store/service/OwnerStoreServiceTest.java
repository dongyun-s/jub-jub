package io.github.dongyuns.jubjub.domain.owner.store.service;

import io.github.dongyuns.jubjub.common.exception.BusinessException;
import io.github.dongyuns.jubjub.domain.core.media.service.MediaCrudService;
import io.github.dongyuns.jubjub.domain.core.store.entity.Store;
import io.github.dongyuns.jubjub.domain.owner.store.dto.OwnerStoreResponse;
import io.github.dongyuns.jubjub.domain.owner.store.dto.OwnerStoreStatus;
import io.github.dongyuns.jubjub.domain.owner.store.dto.UpdateStoreCookingTimeRequest;
import io.github.dongyuns.jubjub.domain.owner.store.dto.UpdateStoreImageRequest;
import io.github.dongyuns.jubjub.domain.owner.store.dto.UpdateStoreInfoRequest;
import io.github.dongyuns.jubjub.domain.owner.store.dto.UpdateStoreLocationRequest;
import io.github.dongyuns.jubjub.domain.owner.store.dto.UpdateStoreStatusRequest;
import io.github.dongyuns.jubjub.domain.shared.external.tmap.AddressGeocoder;
import io.github.dongyuns.jubjub.domain.shared.external.tmap.GeocodingResult;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.verifyNoMoreInteractions;
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

    @Test
    void updatesCookingTimeOnlyForAuthenticatedOwnersStoreAndReturnsItOnRead() {
        Store store = createConfiguredStore(7L);
        String imageUrl = "https://images.example.com/store/pizza.jpg";
        when(ownerStoreResolver.getCurrentOwnerStore("owner@test.com")).thenReturn(store);
        when(mediaCrudService.getStoreImage(7L)).thenReturn(imageUrl);

        OwnerStoreResponse response = ownerStoreService.updateCookingTime(
                "owner@test.com", new UpdateStoreCookingTimeRequest(40)
        );
        OwnerStoreResponse readResponse = ownerStoreService.getMyStore("owner@test.com");

        assertThat(store.getCookingTimeMinutes()).isEqualTo(40);
        assertThat(response.cookingTimeMinutes()).isEqualTo(40);
        assertThat(readResponse.cookingTimeMinutes()).isEqualTo(40);
        assertThat(response.operatingHours()).isEqualTo("기존 운영시간");
        assertThat(response.notice()).isEqualTo("기존 안내사항");
        assertThat(response.imageUrl()).isEqualTo(imageUrl);
        assertThat(readResponse.imageUrl()).isEqualTo(imageUrl);
        assertExistingDetailsUnchanged(store, response);
        verify(ownerStoreResolver, times(2)).getCurrentOwnerStore("owner@test.com");
        verifyNoInteractions(addressGeocoder);
    }

    @Test
    void doesNotChangeCookingTimeWhenOwnerAccessIsDenied() {
        Store store = createConfiguredStore(7L);
        String imageUrl = "https://images.example.com/store/pizza.jpg";
        BusinessException denied = new BusinessException(
                "OWNER_FORBIDDEN", "사장님 계정만 접근할 수 있습니다.", HttpStatus.FORBIDDEN
        );
        when(ownerStoreResolver.getCurrentOwnerStore("owner@test.com")).thenReturn(store);
        when(mediaCrudService.getStoreImage(7L)).thenReturn(imageUrl);
        when(ownerStoreResolver.getCurrentOwnerStore("customer@test.com")).thenThrow(denied);
        OwnerStoreResponse before = ownerStoreService.getMyStore("owner@test.com");

        assertThatThrownBy(() -> ownerStoreService.updateCookingTime(
                "customer@test.com", new UpdateStoreCookingTimeRequest(40)
        )).isSameAs(denied);

        OwnerStoreResponse after = ownerStoreService.getMyStore("owner@test.com");
        assertThat(after).isEqualTo(before);
        assertThat(store.getCookingTimeMinutes()).isEqualTo(15);
        assertThat(store.getOperatingHours()).isEqualTo("기존 운영시간");
        assertThat(store.getNotice()).isEqualTo("기존 안내사항");
        verify(ownerStoreResolver).getCurrentOwnerStore("customer@test.com");
        verify(mediaCrudService, times(2)).getStoreImage(7L);
        verifyNoMoreInteractions(mediaCrudService);
        verifyNoInteractions(addressGeocoder);
    }

    @Test
    void stripsInfoEdgesPreservesInternalLineBreaksAndReturnsInfoOnRead() {
        Store store = createConfiguredStore(7L);
        String imageUrl = "https://images.example.com/store/pizza.jpg";
        String operatingHours = "평일 09:00–18:00\n주말 10:00–16:00";
        String notice = "매장 앞에서 픽업해주세요.\r\n포장 수저는 요청해주세요.";
        when(ownerStoreResolver.getCurrentOwnerStore("owner@test.com")).thenReturn(store);
        when(mediaCrudService.getStoreImage(7L)).thenReturn(imageUrl);

        OwnerStoreResponse response = ownerStoreService.updateInfo(
                "owner@test.com",
                new UpdateStoreInfoRequest("\u2003" + operatingHours + "\u2003", "\t" + notice + "\n ")
        );
        OwnerStoreResponse readResponse = ownerStoreService.getMyStore("owner@test.com");

        assertThat(store.getOperatingHours()).isEqualTo(operatingHours);
        assertThat(store.getNotice()).isEqualTo(notice);
        assertThat(response.operatingHours()).isEqualTo(operatingHours);
        assertThat(response.notice()).isEqualTo(notice);
        assertThat(readResponse.operatingHours()).isEqualTo(operatingHours);
        assertThat(readResponse.notice()).isEqualTo(notice);
        assertThat(store.getCookingTimeMinutes()).isEqualTo(15);
        assertThat(response.cookingTimeMinutes()).isEqualTo(15);
        assertThat(response.imageUrl()).isEqualTo(imageUrl);
        assertThat(readResponse.imageUrl()).isEqualTo(imageUrl);
        assertExistingDetailsUnchanged(store, response);
        verify(ownerStoreResolver, times(2)).getCurrentOwnerStore("owner@test.com");
        verifyNoInteractions(addressGeocoder);
    }

    @ParameterizedTest
    @ValueSource(strings = {"", " \t\n ", "\u2003"})
    void clearsInfoWhenFieldsAreEmptyOrWhitespace(String emptyValue) {
        Store store = createConfiguredStore(7L);
        String imageUrl = "https://images.example.com/store/pizza.jpg";
        when(ownerStoreResolver.getCurrentOwnerStore("owner@test.com")).thenReturn(store);
        when(mediaCrudService.getStoreImage(7L)).thenReturn(imageUrl);

        OwnerStoreResponse response = ownerStoreService.updateInfo(
                "owner@test.com", new UpdateStoreInfoRequest(emptyValue, emptyValue)
        );
        OwnerStoreResponse readResponse = ownerStoreService.getMyStore("owner@test.com");

        assertThat(store.getOperatingHours()).isNull();
        assertThat(store.getNotice()).isNull();
        assertThat(response.operatingHours()).isNull();
        assertThat(response.notice()).isNull();
        assertThat(readResponse.operatingHours()).isNull();
        assertThat(readResponse.notice()).isNull();
        assertThat(response.cookingTimeMinutes()).isEqualTo(15);
        assertThat(response.imageUrl()).isEqualTo(imageUrl);
        assertExistingDetailsUnchanged(store, response);
        verifyNoInteractions(addressGeocoder);
    }

    @Test
    void doesNotChangeInfoWhenOwnerAccessIsDenied() {
        Store store = createConfiguredStore(7L);
        String imageUrl = "https://images.example.com/store/pizza.jpg";
        BusinessException denied = new BusinessException(
                "OWNER_FORBIDDEN", "사장님 계정만 접근할 수 있습니다.", HttpStatus.FORBIDDEN
        );
        when(ownerStoreResolver.getCurrentOwnerStore("owner@test.com")).thenReturn(store);
        when(mediaCrudService.getStoreImage(7L)).thenReturn(imageUrl);
        when(ownerStoreResolver.getCurrentOwnerStore("customer@test.com")).thenThrow(denied);
        OwnerStoreResponse before = ownerStoreService.getMyStore("owner@test.com");

        assertThatThrownBy(() -> ownerStoreService.updateInfo(
                "customer@test.com", new UpdateStoreInfoRequest("새 운영시간", "새 안내사항")
        )).isSameAs(denied);

        OwnerStoreResponse after = ownerStoreService.getMyStore("owner@test.com");
        assertThat(after).isEqualTo(before);
        assertThat(store.getOperatingHours()).isEqualTo("기존 운영시간");
        assertThat(store.getNotice()).isEqualTo("기존 안내사항");
        assertThat(store.getCookingTimeMinutes()).isEqualTo(15);
        verify(ownerStoreResolver).getCurrentOwnerStore("customer@test.com");
        verify(mediaCrudService, times(2)).getStoreImage(7L);
        verifyNoMoreInteractions(mediaCrudService);
        verifyNoInteractions(addressGeocoder);
    }

    private void assertExistingDetailsUnchanged(Store store, OwnerStoreResponse response) {
        assertThat(store.getOwnerProfileId()).isEqualTo(1L);
        assertThat(store.getName()).isEqualTo("피자집");
        assertThat(store.getAddress()).isEqualTo("기존 주소");
        assertThat(store.getPhoneNumber()).isEqualTo("02-1234-5678");
        assertThat(store.getCategoryId()).isEqualTo(5);
        assertThat(store.getLatitude()).isEqualTo(37.5);
        assertThat(store.getLongitude()).isEqualTo(126.9);
        assertThat(store.getStatus()).isEqualTo("PAUSED");
        assertThat(store.getOriginInfo()).isEqualTo("국내산 돼지고기");
        assertThat(store.getMinOrderAmount()).isEqualTo(12000);
        assertThat(response.storeId()).isEqualTo(7L);
        assertThat(response.name()).isEqualTo("피자집");
        assertThat(response.address()).isEqualTo("기존 주소");
        assertThat(response.phoneNumber()).isEqualTo("02-1234-5678");
        assertThat(response.categoryId()).isEqualTo(5);
        assertThat(response.latitude()).isEqualTo(37.5);
        assertThat(response.longitude()).isEqualTo(126.9);
        assertThat(response.status()).isEqualTo("PAUSED");
    }

    private Store createConfiguredStore(Long storeId) {
        Store store = Store.builder()
                .ownerProfileId(1L)
                .name("피자집")
                .address("기존 주소")
                .phoneNumber("02-1234-5678")
                .categoryId(5)
                .latitude(37.5)
                .longitude(126.9)
                .cookingTimeMinutes(15)
                .status("PAUSED")
                .originInfo("국내산 돼지고기")
                .minOrderAmount(12000)
                .build();
        ReflectionTestUtils.setField(store, "id", storeId);
        store.updateInfo("기존 운영시간", "기존 안내사항");
        return store;
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
