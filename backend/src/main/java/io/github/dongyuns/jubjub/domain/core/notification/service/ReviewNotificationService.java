package io.github.dongyuns.jubjub.domain.core.notification.service;

import io.github.dongyuns.jubjub.common.exception.BusinessException;
import io.github.dongyuns.jubjub.domain.core.account.entity.Account;
import io.github.dongyuns.jubjub.domain.core.account.repository.AccountRepository;
import io.github.dongyuns.jubjub.domain.core.ordertracking.entity.OrderTracking;
import io.github.dongyuns.jubjub.domain.core.ordertracking.entity.OrderTrackingStatus;
import io.github.dongyuns.jubjub.domain.core.ordertracking.repository.OrderTrackingRepository;
import io.github.dongyuns.jubjub.domain.core.review.repository.ReviewRepository;
import io.github.dongyuns.jubjub.domain.customer.notification.dto.ReviewNotificationItemResponse;
import io.github.dongyuns.jubjub.domain.customer.notification.dto.ReviewNotificationListResponse;
import io.github.dongyuns.jubjub.domain.core.notification.entity.ReviewNotification;
import io.github.dongyuns.jubjub.domain.core.notification.repository.ReviewNotificationRepository;
import io.github.dongyuns.jubjub.domain.core.member.entity.MemberProfile;
import io.github.dongyuns.jubjub.domain.core.member.repository.MemberProfileRepository;
import io.github.dongyuns.jubjub.domain.core.order.entity.Order;
import io.github.dongyuns.jubjub.domain.core.order.repository.OrderRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReviewNotificationService {

    private final ReviewNotificationRepository reviewNotificationRepository;
    private final OrderTrackingRepository orderTrackingRepository;
    private final OrderRepository orderRepository;
    private final ReviewRepository reviewRepository;
    private final AccountRepository accountRepository;
    private final MemberProfileRepository memberProfileRepository;

    @Transactional
    @Scheduled(fixedDelayString = "${review-notification.sync-delay-ms:60000}")
    public void synchronizeReviewNotifications() {
        List<OrderTracking> pickedUpTrackings = orderTrackingRepository
                .findAllByStatusOrderByIdAsc(OrderTrackingStatus.PICKED_UP);

        for (OrderTracking tracking : pickedUpTrackings) {
            if (reviewRepository.findByOrderId(tracking.getOrderId()).isPresent()) {
                continue;
            }

            if (reviewNotificationRepository.findTopByOrderIdOrderByCreatedAtDesc(tracking.getOrderId()).isPresent()) {
                continue;
            }

            Order order = orderRepository.findById(tracking.getOrderId())
                    .orElseThrow(() -> new BusinessException(
                            "ORDER_NOT_FOUND",
                            "리뷰 알림 생성 대상 주문을 찾을 수 없습니다.",
                            HttpStatus.NOT_FOUND
                    ));

            reviewNotificationRepository.save(
                    ReviewNotification.of(
                            order.getMemberProfileId(),
                            order.getId(),
                            order.getStoreId(),
                            titleOf(),
                            messageOf(order)
                    )
            );
        }
    }

    @Transactional(readOnly = true)
    public ReviewNotificationListResponse getMyNotifications(String accountEmail) {
        MemberProfile memberProfile = findMemberProfile(accountEmail);
        List<ReviewNotificationItemResponse> notifications = reviewNotificationRepository
                .findAllByMemberProfileIdOrderByCreatedAtDesc(memberProfile.getId()).stream()
                .map(ReviewNotificationItemResponse::from)
                .toList();

        long unreadCount = reviewNotificationRepository.countByMemberProfileIdAndReadFalse(memberProfile.getId());
        return new ReviewNotificationListResponse(unreadCount, notifications);
    }

    @Transactional
    public void markAllAsRead(String accountEmail) {
        MemberProfile memberProfile = findMemberProfile(accountEmail);
        List<ReviewNotification> notifications = reviewNotificationRepository
                .findAllByMemberProfileIdOrderByCreatedAtDesc(memberProfile.getId());

        notifications.forEach(ReviewNotification::markAsRead);
    }

    @Transactional
    public void markAsRead(String accountEmail, Long notificationId) {
        MemberProfile memberProfile = findMemberProfile(accountEmail);
        ReviewNotification notification = reviewNotificationRepository
                .findByIdAndMemberProfileId(notificationId, memberProfile.getId())
                .orElseThrow(() -> new BusinessException(
                        "REVIEW_NOTIFICATION_NOT_FOUND",
                        "리뷰 알림을 찾을 수 없습니다.",
                        HttpStatus.NOT_FOUND
                ));

        notification.markAsRead();
    }

    @Transactional
    public boolean markAsReadIfExists(String accountEmail, Long notificationId) {
        MemberProfile memberProfile = findMemberProfile(accountEmail);
        return reviewNotificationRepository.findByIdAndMemberProfileId(notificationId, memberProfile.getId())
                .map(notification -> {
                    notification.markAsRead();
                    return true;
                })
                .orElse(false);
    }

    @Transactional
    public void markAsReadByOrderId(Long orderId) {
        reviewNotificationRepository.findTopByOrderIdOrderByCreatedAtDesc(orderId)
                .ifPresent(ReviewNotification::markAsRead);
    }

    private MemberProfile findMemberProfile(String accountEmail) {
        if (accountEmail == null || accountEmail.isBlank()) {
            throw new BusinessException("UNAUTHORIZED", "로그인한 사용자만 알림을 조회할 수 있습니다.", HttpStatus.UNAUTHORIZED);
        }

        Account account = accountRepository.findByEmail(accountEmail)
                .orElseThrow(() -> new BusinessException("ACCOUNT_NOT_FOUND", "로그인 계정을 찾을 수 없습니다.", HttpStatus.NOT_FOUND));
        return memberProfileRepository.findByAccount(account)
                .orElseThrow(() -> new BusinessException("MEMBER_PROFILE_NOT_FOUND", "회원 프로필을 찾을 수 없습니다.", HttpStatus.NOT_FOUND));
    }

    private String titleOf() {
        return "리뷰를 작성해주세요";
    }

    private String messageOf(Order order) {
        return order.getStore().getName() + " 주문은 어떠셨나요? 매장 리뷰를 남겨주시면 다른 사용자에게 큰 도움이 됩니다.";
    }
}
