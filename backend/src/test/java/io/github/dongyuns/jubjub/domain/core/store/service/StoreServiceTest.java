package io.github.dongyuns.jubjub.domain.core.store.service;

import io.github.dongyuns.jubjub.domain.core.media.service.MediaCrudService;
import io.github.dongyuns.jubjub.domain.core.menu.entity.Menu;
import io.github.dongyuns.jubjub.domain.core.menu.entity.MenuCategory;
import io.github.dongyuns.jubjub.domain.core.menu.repository.MenuRepository;
import io.github.dongyuns.jubjub.domain.core.store.entity.Store;
import io.github.dongyuns.jubjub.domain.core.store.repository.StoreRepository;
import io.github.dongyuns.jubjub.domain.customer.menu.dto.MenuResponse;
import io.github.dongyuns.jubjub.domain.customer.store.dto.StoreDetailResponse;
import io.github.dongyuns.jubjub.domain.customer.store.dto.StoreListResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.tuple;
import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class StoreServiceTest {

    @Mock
    private StoreRepository storeRepository;

    @Mock
    private MenuRepository menuRepository;

    @Mock
    private MediaCrudService mediaCrudService;

    @InjectMocks
    private StoreService storeService;

    @Test
    void includesEachStoresOwnImageInIdSortedListAndRetainsStoreWithoutImage() {
        Store firstStore = createStore(1L, "첫 번째 매장", 1);
        Store secondStore = createStore(2L, "이미지 없는 매장", 6);
        Store thirdStore = createStore(3L, "세 번째 매장", 5);
        String firstImage = "https://images.example.com/store/first.jpg";
        String thirdImage = "https://images.example.com/store/third.jpg";
        when(storeRepository.findAll()).thenReturn(List.of(thirdStore, firstStore, secondStore));
        when(mediaCrudService.getStoreImages(List.of(1L, 2L, 3L)))
                .thenReturn(Map.of(3L, thirdImage, 1L, firstImage));

        List<StoreListResponse> response = storeService.getAllStores();

        assertThat(response)
                .extracting(StoreListResponse::storeId, StoreListResponse::name, StoreListResponse::imageUrl)
                .containsExactly(
                        tuple(1L, "첫 번째 매장", firstImage),
                        tuple(2L, "이미지 없는 매장", null),
                        tuple(3L, "세 번째 매장", thirdImage)
                );
        verify(mediaCrudService, times(1)).getStoreImages(List.of(1L, 2L, 3L));
        verify(mediaCrudService, never()).getStoreImage(anyLong());
    }

    @Test
    void preservesCategoryFilterAndOrderWhenIncludingRepresentativeImages() {
        Store firstCafe = createStore(2L, "첫 번째 카페", 6);
        Store secondCafe = createStore(4L, "두 번째 카페", 6);
        String cafeImage = "https://images.example.com/store/cafe.jpg";
        when(storeRepository.findByCategoryIdOrderByIdAsc(6)).thenReturn(List.of(secondCafe, firstCafe));
        when(mediaCrudService.getStoreImages(List.of(2L, 4L))).thenReturn(Map.of(2L, cafeImage));

        List<StoreListResponse> response = storeService.getStoresByCategory(6, null);

        assertThat(response)
                .extracting(StoreListResponse::storeId, StoreListResponse::categoryId,
                        StoreListResponse::categoryName, StoreListResponse::imageUrl)
                .containsExactly(
                        tuple(2L, 6, "카페", cafeImage),
                        tuple(4L, 6, "카페", null)
                );
        verify(storeRepository, never()).findAll();
        verify(mediaCrudService, times(1)).getStoreImages(List.of(2L, 4L));
        verify(mediaCrudService, never()).getStoreImage(anyLong());
    }

    @Test
    void returnsSameRepresentativeImageInListAndDetailForSameStore() {
        Store store = createStore();
        String imageUrl = "https://images.example.com/store/pizza.jpg";
        when(storeRepository.findAll()).thenReturn(List.of(store));
        when(storeRepository.findById(1L)).thenReturn(Optional.of(store));
        when(menuRepository.findByStoreIdAndIsDeletedFalse(1L)).thenReturn(List.of());
        when(mediaCrudService.getStoreImages(List.of(1L))).thenReturn(Map.of(1L, imageUrl));
        when(mediaCrudService.getStoreImage(1L)).thenReturn(imageUrl);

        List<StoreListResponse> listResponse = storeService.getAllStores();
        StoreDetailResponse detailResponse = storeService.getStoreDetail(1L);

        assertThat(listResponse).singleElement().satisfies(storeResponse -> {
            assertThat(storeResponse.storeId()).isEqualTo(detailResponse.storeId());
            assertThat(storeResponse.imageUrl()).isEqualTo(imageUrl).isEqualTo(detailResponse.imageUrl());
        });
        verify(mediaCrudService, times(1)).getStoreImages(List.of(1L));
        verify(mediaCrudService, times(1)).getStoreImage(1L);
    }

    @Test
    void returnsUpdatedCookingTimeAndInfoInCustomerResponsesWithoutChangingImages() {
        Store store = createStore();
        Store otherStore = createStore(2L, "다른 매장", 6);
        store.updateCookingTimeMinutes(25);
        otherStore.updateCookingTimeMinutes(20);
        String operatingHours = "월–금: 11:00 ~ 21:00\n토요일: 11:00 ~ 20:00";
        String notice = "포장 주문만 가능합니다.\n알레르기가 있다면 주문 전에 알려주세요.";
        store.updateInfo("  " + operatingHours + "  ", "\n" + notice + "\n");
        Menu menu = createMenu(store, 101L, "피자", 18000);
        String storeImage = "https://images.example.com/store/pizza.jpg";
        String menuImage = "https://images.example.com/menu/pizza.jpg";
        when(storeRepository.findAll()).thenReturn(List.of(otherStore, store));
        when(storeRepository.findById(1L)).thenReturn(Optional.of(store));
        when(menuRepository.findByStoreIdAndIsDeletedFalse(1L)).thenReturn(List.of(menu));
        when(mediaCrudService.getStoreImages(List.of(1L, 2L))).thenReturn(Map.of(1L, storeImage));
        when(mediaCrudService.getStoreImage(1L)).thenReturn(storeImage);
        when(mediaCrudService.getMenuImage(101L)).thenReturn(menuImage);

        List<StoreListResponse> listResponse = storeService.getAllStores();
        StoreDetailResponse detailResponse = storeService.getStoreDetail(1L);

        assertThat(listResponse)
                .extracting(StoreListResponse::storeId, StoreListResponse::cookingTimeMinutes,
                        StoreListResponse::imageUrl)
                .containsExactly(tuple(1L, 25, storeImage), tuple(2L, 20, null));
        assertThat(detailResponse.cookingTimeMinutes()).isEqualTo(25);
        assertThat(detailResponse.operatingHours()).isEqualTo(operatingHours);
        assertThat(detailResponse.notice()).isEqualTo(notice);
        assertThat(detailResponse.imageUrl()).isEqualTo(storeImage);
        assertThat(detailResponse.menus()).singleElement().satisfies(menuResponse -> {
            assertThat(menuResponse.menuId()).isEqualTo(101L);
            assertThat(menuResponse.imageUrl()).isEqualTo(menuImage);
        });
    }

    @Test
    void includesEachMenusOwnImageInStoreDetail() {
        Store store = createStore();
        Menu pizza = createMenu(store, 101L, "피자", 18000);
        Menu pasta = createMenu(store, 102L, "파스타", 12000);
        String pizzaImage = "https://images.example.com/menu/pizza.jpg";
        String pastaImage = "https://images.example.com/menu/pasta.jpg";
        String storeImage = "https://images.example.com/store/pizza.jpg";
        when(storeRepository.findById(1L)).thenReturn(Optional.of(store));
        when(menuRepository.findByStoreIdAndIsDeletedFalse(1L)).thenReturn(List.of(pizza, pasta));
        when(mediaCrudService.getMenuImage(101L)).thenReturn(pizzaImage);
        when(mediaCrudService.getMenuImage(102L)).thenReturn(pastaImage);
        when(mediaCrudService.getStoreImage(1L)).thenReturn(storeImage);

        StoreDetailResponse response = storeService.getStoreDetail(1L);

        assertThat(response.storeId()).isEqualTo(1L);
        assertThat(response.name()).isEqualTo("피자집");
        assertThat(response.imageUrl()).isEqualTo(storeImage);
        assertThat(response.menus())
                .extracting(MenuResponse::menuId, MenuResponse::name, MenuResponse::price,
                        MenuResponse::description, MenuResponse::isSoldOut,
                        MenuResponse::rewardXp, MenuResponse::imageUrl)
                .containsExactly(
                        tuple(101L, "피자", 18000, "피자 설명", false, 10, pizzaImage),
                        tuple(102L, "파스타", 12000, "파스타 설명", false, 10, pastaImage)
                );
        assertThat(response.menus()).allSatisfy(menu -> assertThat(menu.options()).isEmpty());
    }

    @Test
    void retainsMenuWithoutImageAndReturnsNullImageUrl() {
        Store store = createStore();
        Menu menu = createMenu(store, 103L, "음료", 2000);
        when(storeRepository.findById(1L)).thenReturn(Optional.of(store));
        when(menuRepository.findByStoreIdAndIsDeletedFalse(1L)).thenReturn(List.of(menu));
        when(mediaCrudService.getMenuImage(103L)).thenReturn(null);
        when(mediaCrudService.getStoreImage(1L)).thenReturn(null);

        StoreDetailResponse response = storeService.getStoreDetail(1L);

        assertThat(response.imageUrl()).isNull();
        assertThat(response.cookingTimeMinutes()).isEqualTo(15);
        assertThat(response.operatingHours()).isNull();
        assertThat(response.notice()).isNull();
        assertThat(response.menus()).singleElement().satisfies(menuResponse -> {
            assertThat(menuResponse.menuId()).isEqualTo(103L);
            assertThat(menuResponse.name()).isEqualTo("음료");
            assertThat(menuResponse.price()).isEqualTo(2000);
            assertThat(menuResponse.imageUrl()).isNull();
        });
    }

    @Test
    void keepsMenuImageWhenStoreHasNoRepresentativeImage() {
        Store store = createStore();
        Menu menu = createMenu(store, 104L, "피자", 18000);
        String menuImage = "https://images.example.com/menu/pizza.jpg";
        when(storeRepository.findById(1L)).thenReturn(Optional.of(store));
        when(menuRepository.findByStoreIdAndIsDeletedFalse(1L)).thenReturn(List.of(menu));
        when(mediaCrudService.getMenuImage(104L)).thenReturn(menuImage);
        when(mediaCrudService.getStoreImage(1L)).thenReturn(null);

        StoreDetailResponse response = storeService.getStoreDetail(1L);

        assertThat(response.imageUrl()).isNull();
        assertThat(response.menus()).singleElement().satisfies(menuResponse -> {
            assertThat(menuResponse.menuId()).isEqualTo(104L);
            assertThat(menuResponse.imageUrl()).isEqualTo(menuImage);
        });
    }

    private Store createStore() {
        return createStore(1L, "피자집", 5);
    }

    private Store createStore(Long id, String name, Integer categoryId) {
        Store store = Store.builder()
                .ownerProfileId(10L)
                .name(name)
                .categoryId(categoryId)
                .address("서울 영등포구 당산로42길 16")
                .build();
        ReflectionTestUtils.setField(store, "id", id);
        return store;
    }

    private Menu createMenu(Store store, Long id, String name, int price) {
        Menu menu = Menu.builder()
                .store(store)
                .name(name)
                .price(price)
                .description(name + " 설명")
                .category(MenuCategory.MAIN)
                .rewardXp(10)
                .build();
        ReflectionTestUtils.setField(menu, "id", id);
        return menu;
    }
}
