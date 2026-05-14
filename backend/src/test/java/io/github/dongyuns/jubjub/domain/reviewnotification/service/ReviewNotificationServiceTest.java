package io.github.dongyuns.jubjub.domain.reviewnotification.service;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import io.github.dongyuns.jubjub.domain.auth.repository.AccountRepository;
import io.github.dongyuns.jubjub.domain.ordertracking.entity.OrderTracking;
import io.github.dongyuns.jubjub.domain.ordertracking.entity.OrderTrackingStatus;
import io.github.dongyuns.jubjub.domain.ordertracking.repository.OrderTrackingRepository;
import io.github.dongyuns.jubjub.domain.review.entity.Review;
import io.github.dongyuns.jubjub.domain.review.repository.ReviewRepository;
import io.github.dongyuns.jubjub.domain.reviewnotification.repository.ReviewNotificationRepository;
import io.github.dongyuns.jubjub.domain.store.entity.Store;
import io.github.dongyuns.jubjub.domain.user.entity.MemberProfile;
import io.github.dongyuns.jubjub.domain.user.repository.MemberProfileRepository;
import io.github.dongyuns.jubjub.payment.domain.Order;
import io.github.dongyuns.jubjub.payment.domain.OrderStatus;
import io.github.dongyuns.jubjub.payment.repository.OrderRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ReviewNotificationServiceTest {

    @Mock
    private ReviewNotificationRepository reviewNotificationRepository;

    @Mock
    private OrderTrackingRepository orderTrackingRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private MemberProfileRepository memberProfileRepository;

    @InjectMocks
    private ReviewNotificationService reviewNotificationService;

    @Test
    @DisplayName("픽업 완료 후 리뷰가 없으면 리뷰 알림을 생성한다.")
    void synchronizeReviewNotifications_createsNotification() {
        OrderTracking tracking = OrderTracking.builder()
                .orderId(1L)
                .status(OrderTrackingStatus.PICKED_UP)
                .progressStartedAt(LocalDateTime.now().minusMinutes(40))
                .cookingStartedAt(LocalDateTime.now().minusMinutes(39))
                .estimatedPickupTime(LocalDateTime.now().minusMinutes(10))
                .autoCompletedAt(LocalDateTime.now().minusMinutes(1))
                .build();

        Order order = Order.builder()
                .memberProfile(MemberProfile.builder().name("테스터").phone("01012341234").build())
                .store(Store.builder().ownerProfileId(1L).name("줍줍 분식").build())
                .orderNo("O-1")
                .status(OrderStatus.PAID)
                .finalAmount(10000)
                .requestedAt(LocalDateTime.now())
                .build();

        given(orderTrackingRepository.findAllByStatusOrderByIdAsc(OrderTrackingStatus.PICKED_UP))
                .willReturn(List.of(tracking));
        given(reviewRepository.findByOrderId(1L)).willReturn(Optional.empty());
        given(reviewNotificationRepository.findTopByOrderIdOrderByCreatedAtDesc(1L)).willReturn(Optional.empty());
        given(orderRepository.findById(1L)).willReturn(Optional.of(order));

        reviewNotificationService.synchronizeReviewNotifications();

        verify(reviewNotificationRepository).save(any());
    }

    @Test
    @DisplayName("이미 리뷰가 작성된 주문에는 리뷰 알림을 생성하지 않는다.")
    void synchronizeReviewNotifications_skipsReviewedOrder() {
        OrderTracking tracking = OrderTracking.builder()
                .orderId(1L)
                .status(OrderTrackingStatus.PICKED_UP)
                .progressStartedAt(LocalDateTime.now().minusMinutes(40))
                .cookingStartedAt(LocalDateTime.now().minusMinutes(39))
                .estimatedPickupTime(LocalDateTime.now().minusMinutes(10))
                .autoCompletedAt(LocalDateTime.now().minusMinutes(1))
                .build();

        given(orderTrackingRepository.findAllByStatusOrderByIdAsc(OrderTrackingStatus.PICKED_UP))
                .willReturn(List.of(tracking));
        given(reviewRepository.findByOrderId(1L)).willReturn(Optional.of(Review.builder().build()));

        reviewNotificationService.synchronizeReviewNotifications();

        verify(reviewNotificationRepository, never()).save(any());
        verify(orderRepository, never()).findById(any());
    }
}
