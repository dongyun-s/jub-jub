package io.github.dongyuns.jubjub.domain.owner.store.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.dongyuns.jubjub.common.exception.BusinessException;
import io.github.dongyuns.jubjub.common.exception.GlobalExceptionHandler;
import io.github.dongyuns.jubjub.domain.core.store.entity.Store;
import io.github.dongyuns.jubjub.domain.owner.store.dto.OwnerStoreResponse;
import io.github.dongyuns.jubjub.domain.owner.store.dto.UpdateStoreInfoRequest;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class OwnerStoreInfoControllerTest {

    @Mock
    private OwnerStoreService ownerStoreService;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new OwnerStoreController(ownerStoreService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void updatesInfoUsingAuthenticatedEmailAndExposesInfoOnOwnerRead() throws Exception {
        String email = "owner@test.com";
        String operatingHours = "평일 09:00–18:00\n주말 10:00–16:00";
        String notice = "매장 앞에서 픽업해주세요.\r\n포장 수저는 요청해주세요.";
        String imageUrl = "https://images.example.com/store/pizza.jpg";
        Store store = createStore();
        store.updateInfo(operatingHours, notice);
        OwnerStoreResponse response = OwnerStoreResponse.from(store, imageUrl);
        UpdateStoreInfoRequest request = new UpdateStoreInfoRequest(operatingHours, notice);
        when(ownerStoreService.updateInfo(email, request)).thenReturn(response);
        when(ownerStoreService.getMyStore(email)).thenReturn(response);

        mockMvc.perform(patch("/api/v1/owner/store/info")
                        .principal(new UsernamePasswordAuthenticationToken(email, null))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.storeId").value(7))
                .andExpect(jsonPath("$.data.operatingHours").value(operatingHours))
                .andExpect(jsonPath("$.data.notice").value(notice))
                .andExpect(jsonPath("$.data.cookingTimeMinutes").value(40))
                .andExpect(jsonPath("$.data.imageUrl").value(imageUrl));

        mockMvc.perform(get("/api/v1/owner/store")
                        .principal(new UsernamePasswordAuthenticationToken(email, null)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.operatingHours").value(operatingHours))
                .andExpect(jsonPath("$.data.notice").value(notice))
                .andExpect(jsonPath("$.data.imageUrl").value(imageUrl));

        verify(ownerStoreService).updateInfo(email, request);
        verify(ownerStoreService).getMyStore(email);
    }

    @ParameterizedTest
    @ValueSource(strings = {"", " \t\n "})
    void acceptsEmptyOrWhitespaceFieldsToClearInfo(String emptyValue) throws Exception {
        String email = "owner@test.com";
        Store store = createStore();
        UpdateStoreInfoRequest request = new UpdateStoreInfoRequest(emptyValue, emptyValue);
        when(ownerStoreService.updateInfo(email, request)).thenReturn(OwnerStoreResponse.from(store, null));

        mockMvc.perform(patch("/api/v1/owner/store/info")
                        .principal(new UsernamePasswordAuthenticationToken(email, null))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.operatingHours").doesNotExist())
                .andExpect(jsonPath("$.data.notice").doesNotExist());

        verify(ownerStoreService).updateInfo(email, request);
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "{}",
            "{\"notice\":\"안내사항\"}",
            "{\"operatingHours\":\"09:00–18:00\"}",
            "{\"operatingHours\":null,\"notice\":\"안내사항\"}",
            "{\"operatingHours\":\"09:00–18:00\",\"notice\":null}"
    })
    void rejectsMissingOrNullInfoFields(String content) throws Exception {
        mockMvc.perform(patch("/api/v1/owner/store/info")
                        .principal(new UsernamePasswordAuthenticationToken("owner@test.com", null))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(content))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));

        verifyNoInteractions(ownerStoreService);
    }

    @Test
    void acceptsInfoAtBothLengthLimits() throws Exception {
        String email = "owner@test.com";
        String operatingHours = "시".repeat(2000);
        String notice = "안".repeat(5000);
        UpdateStoreInfoRequest request = new UpdateStoreInfoRequest(operatingHours, notice);
        Store store = createStore();
        store.updateInfo(operatingHours, notice);
        when(ownerStoreService.updateInfo(email, request)).thenReturn(OwnerStoreResponse.from(store, null));

        mockMvc.perform(patch("/api/v1/owner/store/info")
                        .principal(new UsernamePasswordAuthenticationToken(email, null))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.operatingHours").value(operatingHours))
                .andExpect(jsonPath("$.data.notice").value(notice));

        verify(ownerStoreService).updateInfo(email, request);
    }

    @ParameterizedTest
    @ValueSource(strings = {"operatingHours", "notice"})
    void rejectsInfoExceedingEitherLengthLimit(String oversizedField) throws Exception {
        String operatingHours = oversizedField.equals("operatingHours") ? "시".repeat(2001) : "09:00–18:00";
        String notice = oversizedField.equals("notice") ? "안".repeat(5001) : "매장 앞에서 픽업해주세요.";
        UpdateStoreInfoRequest request = new UpdateStoreInfoRequest(operatingHours, notice);

        mockMvc.perform(patch("/api/v1/owner/store/info")
                        .principal(new UsernamePasswordAuthenticationToken("owner@test.com", null))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));

        verifyNoInteractions(ownerStoreService);
    }

    @Test
    void returnsForbiddenWhenAuthenticatedAccountCannotModifyAnOwnerStore() throws Exception {
        String email = "customer@test.com";
        UpdateStoreInfoRequest request = new UpdateStoreInfoRequest("09:00–18:00", "픽업 안내");
        when(ownerStoreService.updateInfo(email, request)).thenThrow(new BusinessException(
                "OWNER_FORBIDDEN", "사장님 계정만 접근할 수 있습니다.", HttpStatus.FORBIDDEN
        ));

        mockMvc.perform(patch("/api/v1/owner/store/info")
                        .principal(new UsernamePasswordAuthenticationToken(email, null))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("OWNER_FORBIDDEN"));

        verify(ownerStoreService).updateInfo(email, request);
    }

    private Store createStore() {
        Store store = Store.builder()
                .ownerProfileId(1L)
                .name("피자집")
                .cookingTimeMinutes(40)
                .build();
        ReflectionTestUtils.setField(store, "id", 7L);
        return store;
    }
}
