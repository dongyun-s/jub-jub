package io.github.dongyuns.jubjub.domain.owner.store.controller;

import io.github.dongyuns.jubjub.common.exception.BusinessException;
import io.github.dongyuns.jubjub.common.exception.GlobalExceptionHandler;
import io.github.dongyuns.jubjub.domain.core.store.entity.Store;
import io.github.dongyuns.jubjub.domain.owner.store.dto.OwnerStoreResponse;
import io.github.dongyuns.jubjub.domain.owner.store.dto.UpdateStoreCookingTimeRequest;
import io.github.dongyuns.jubjub.domain.owner.store.service.OwnerStoreService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class OwnerStoreCookingTimeControllerTest {

    @Mock
    private OwnerStoreService ownerStoreService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new OwnerStoreController(ownerStoreService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @ParameterizedTest
    @ValueSource(ints = {1, 30, 121})
    void updatesCookingTimeUsingAuthenticatedEmailAndAcceptsAnyPositiveMinutes(int minutes) throws Exception {
        String email = "owner@test.com";
        String imageUrl = "https://images.example.com/store/pizza.jpg";
        Store store = Store.builder()
                .ownerProfileId(1L)
                .name("피자집")
                .cookingTimeMinutes(minutes)
                .build();
        ReflectionTestUtils.setField(store, "id", 7L);
        store.updateInfo("09:00–18:00", "픽업은 매장 앞에서 가능합니다.");
        UpdateStoreCookingTimeRequest request = new UpdateStoreCookingTimeRequest(minutes);
        when(ownerStoreService.updateCookingTime(email, request))
                .thenReturn(OwnerStoreResponse.from(store, imageUrl));

        mockMvc.perform(patch("/api/v1/owner/store/cooking-time")
                        .principal(new UsernamePasswordAuthenticationToken(email, null))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"cookingTimeMinutes\":" + minutes + "}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.storeId").value(7))
                .andExpect(jsonPath("$.data.cookingTimeMinutes").value(minutes))
                .andExpect(jsonPath("$.data.operatingHours").value("09:00–18:00"))
                .andExpect(jsonPath("$.data.notice").value("픽업은 매장 앞에서 가능합니다."))
                .andExpect(jsonPath("$.data.imageUrl").value(imageUrl));

        verify(ownerStoreService).updateCookingTime(email, request);
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "{}",
            "{\"cookingTimeMinutes\":null}",
            "{\"cookingTimeMinutes\":0}",
            "{\"cookingTimeMinutes\":-1}"
    })
    void rejectsMissingNullOrNonPositiveCookingTime(String content) throws Exception {
        mockMvc.perform(patch("/api/v1/owner/store/cooking-time")
                        .principal(new UsernamePasswordAuthenticationToken("owner@test.com", null))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(content))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));

        verifyNoInteractions(ownerStoreService);
    }

    @Test
    void returnsForbiddenWhenAuthenticatedAccountCannotModifyAnOwnerStore() throws Exception {
        String email = "customer@test.com";
        UpdateStoreCookingTimeRequest request = new UpdateStoreCookingTimeRequest(30);
        when(ownerStoreService.updateCookingTime(email, request)).thenThrow(new BusinessException(
                "OWNER_FORBIDDEN", "사장님 계정만 접근할 수 있습니다.", HttpStatus.FORBIDDEN
        ));

        mockMvc.perform(patch("/api/v1/owner/store/cooking-time")
                        .principal(new UsernamePasswordAuthenticationToken(email, null))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"cookingTimeMinutes\":30}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("OWNER_FORBIDDEN"));

        verify(ownerStoreService).updateCookingTime(email, request);
    }
}
