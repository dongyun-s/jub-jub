package io.github.dongyuns.jubjub.domain.owner.review.controller;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import io.github.dongyuns.jubjub.domain.owner.review.dto.OwnerReviewListResponse;
import io.github.dongyuns.jubjub.domain.owner.review.dto.ReviewReplyRequest;
import io.github.dongyuns.jubjub.domain.owner.review.dto.ReviewReplyResponse;
import io.github.dongyuns.jubjub.domain.owner.review.repository.OwnerReviewQueryRepository.ReviewFilter;
import io.github.dongyuns.jubjub.domain.owner.review.service.OwnerReviewService;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

@ExtendWith(MockitoExtension.class)
class OwnerReviewControllerTest {

    @Mock private OwnerReviewService ownerReviewService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new OwnerReviewController(ownerReviewService)).build();
    }

    @Test
    void returnsFilteredOwnerReviews() throws Exception {
        OwnerReviewListResponse response = new OwnerReviewListResponse(
                List.of(new OwnerReviewListResponse.ReviewItem(
                        10L,
                        1010L,
                        "고객",
                        5,
                        "맛있어요",
                        LocalDateTime.of(2026, 8, 5, 10, 0),
                        List.of("review/10.jpg"),
                        false,
                        null
                )),
                1
        );
        when(ownerReviewService.getReviews("owner@jubjub.com", ReviewFilter.PHOTO, "치즈"))
                .thenReturn(response);

        mockMvc.perform(get("/api/v1/owner/review")
                        .param("filter", "PHOTO")
                        .param("keyword", "치즈")
                        .principal(new UsernamePasswordAuthenticationToken("owner@jubjub.com", null)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.count").value(1))
                .andExpect(jsonPath("$.data.reviews[0].reviewId").value(10));

        verify(ownerReviewService).getReviews("owner@jubjub.com", ReviewFilter.PHOTO, "치즈");
    }

    @Test
    void createsReviewReply() throws Exception {
        LocalDateTime now = LocalDateTime.of(2026, 8, 5, 10, 30);
        when(ownerReviewService.createReply(
                org.mockito.ArgumentMatchers.eq("owner@jubjub.com"),
                org.mockito.ArgumentMatchers.eq(10L),
                org.mockito.ArgumentMatchers.any(ReviewReplyRequest.class)
        )).thenReturn(new ReviewReplyResponse(30L, 10L, "감사합니다.", now, now));

        mockMvc.perform(post("/api/v1/owner/review/10/reply")
                        .principal(new UsernamePasswordAuthenticationToken("owner@jubjub.com", null))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"감사합니다.\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.replyId").value(30))
                .andExpect(jsonPath("$.data.content").value("감사합니다."));
    }

    @Test
    void deletesReviewReply() throws Exception {
        mockMvc.perform(delete("/api/v1/owner/review/10/reply")
                        .principal(new UsernamePasswordAuthenticationToken("owner@jubjub.com", null)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(ownerReviewService).deleteReply("owner@jubjub.com", 10L);
    }
}
