package io.github.dongyuns.jubjub.domain.owner.store.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.dongyuns.jubjub.common.exception.BusinessException;
import io.github.dongyuns.jubjub.common.exception.GlobalExceptionHandler;
import io.github.dongyuns.jubjub.domain.core.media.service.MediaCrudService;
import io.github.dongyuns.jubjub.domain.core.menu.repository.MenuRepository;
import io.github.dongyuns.jubjub.domain.core.store.entity.Store;
import io.github.dongyuns.jubjub.domain.core.store.repository.StoreRepository;
import io.github.dongyuns.jubjub.domain.core.store.service.StoreService;
import io.github.dongyuns.jubjub.domain.owner.store.service.OwnerStoreResolver;
import io.github.dongyuns.jubjub.domain.owner.store.service.OwnerStoreService;
import io.github.dongyuns.jubjub.domain.shared.external.tmap.AddressGeocoder;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class OwnerStoreDetailsControllerTest {
    @Mock OwnerStoreResolver resolver;
    @Mock AddressGeocoder geocoder;
    @Mock MediaCrudService media;
    @Mock StoreRepository stores;
    @Mock MenuRepository menus;
    private MockMvc mvc;
    private final ObjectMapper json = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.standaloneSetup(new OwnerStoreController(
                new OwnerStoreService(resolver, geocoder, media)))
                .setControllerAdvice(new GlobalExceptionHandler()).build();
    }

    @ParameterizedTest
    @ValueSource(ints = {0, 12000})
    void savesSettingsAndReturnsThemToOwnerAndCustomer(int amount) throws Exception {
        Store store = Store.builder().ownerProfileId(1L).name("매장")
                .cookingTimeMinutes(25).operatingHours("09:00~21:00").notice("픽업 안내").build();
        ReflectionTestUtils.setField(store, "id", 7L);
        when(resolver.getCurrentOwnerStore("owner@test.com")).thenReturn(store);
        when(media.getStoreImage(7L)).thenReturn("https://example.com/store.jpg");
        String origin = "쌀: 국내산\n소고기: 호주산";

        mvc.perform(patch("/api/v1/owner/store/origin")
                        .principal(new UsernamePasswordAuthenticationToken("owner@test.com", null))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("originInfo", "  " + origin + "  "))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.originInfo").value(origin));
        mvc.perform(patch("/api/v1/owner/store/min-order")
                        .principal(new UsernamePasswordAuthenticationToken("owner@test.com", null))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("minOrderAmount", amount))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.minOrderAmount").value(amount))
                .andExpect(jsonPath("$.data.originInfo").value(origin))
                .andExpect(jsonPath("$.data.imageUrl").value("https://example.com/store.jpg"));
        mvc.perform(get("/api/v1/owner/store")
                        .principal(new UsernamePasswordAuthenticationToken("owner@test.com", null)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.originInfo").value(origin))
                .andExpect(jsonPath("$.data.minOrderAmount").value(amount));

        when(stores.findById(7L)).thenReturn(Optional.of(store));
        when(menus.findByStoreIdAndIsDeletedFalse(7L)).thenReturn(List.of());
        var detail = new StoreService(stores, menus, media).getStoreDetail(7L);
        assertThat(detail.originInfo()).isEqualTo(origin);
        assertThat(detail.minOrderAmount()).isEqualTo(amount);
        assertThat(detail.cookingTimeMinutes()).isEqualTo(25);
        assertThat(detail.operatingHours()).isEqualTo("09:00~21:00");
        assertThat(detail.notice()).isEqualTo("픽업 안내");
        verifyNoInteractions(geocoder);
    }

    @Test
    void clearsOriginWithBlankTextWithoutChangingMinimum() throws Exception {
        Store store = Store.builder().name("매장").originInfo("쌀: 국내산").minOrderAmount(10000).build();
        ReflectionTestUtils.setField(store, "id", 7L);
        when(resolver.getCurrentOwnerStore("owner@test.com")).thenReturn(store);
        mvc.perform(patch("/api/v1/owner/store/origin")
                        .principal(new UsernamePasswordAuthenticationToken("owner@test.com", null))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"originInfo\":\"   \"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.originInfo").doesNotExist())
                .andExpect(jsonPath("$.data.minOrderAmount").value(10000));
        assertThat(store.getOriginInfo()).isNull();
    }

    static Stream<Arguments> invalidRequests() {
        return Stream.of(
                Arguments.of("origin", "{}"),
                Arguments.of("origin", "{\"originInfo\":null}"),
                Arguments.of("origin", "{\"originInfo\":\"" + "가".repeat(5001) + "\"}"),
                Arguments.of("min-order", "{}"),
                Arguments.of("min-order", "{\"minOrderAmount\":null}"),
                Arguments.of("min-order", "{\"minOrderAmount\":-1}")
        );
    }

    @ParameterizedTest
    @MethodSource("invalidRequests")
    void rejectsInvalidValuesBeforeAccessingStore(String path, String body) throws Exception {
        mvc.perform(patch("/api/v1/owner/store/" + path)
                        .principal(new UsernamePasswordAuthenticationToken("owner@test.com", null))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
        verifyNoInteractions(resolver, media, geocoder);
    }

    @ParameterizedTest
    @ValueSource(strings = {"origin", "min-order"})
    void rejectsNonOwnerBeforeChangingStore(String path) throws Exception {
        when(resolver.getCurrentOwnerStore("customer@test.com")).thenThrow(new BusinessException(
                "OWNER_FORBIDDEN", "사장님 계정만 접근할 수 있습니다.", HttpStatus.FORBIDDEN));
        String body = path.equals("origin") ? "{\"originInfo\":\"국내산\"}" : "{\"minOrderAmount\":10000}";
        mvc.perform(patch("/api/v1/owner/store/" + path)
                        .principal(new UsernamePasswordAuthenticationToken("customer@test.com", null))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("OWNER_FORBIDDEN"));
        verifyNoInteractions(media, geocoder);
    }
}
