package io.github.dongyuns.jubjub.domain.core.ordertracking.service;

import io.github.dongyuns.jubjub.common.exception.BusinessException;
import io.github.dongyuns.jubjub.domain.core.account.entity.Account;
import io.github.dongyuns.jubjub.domain.core.account.repository.AccountRepository;
import io.github.dongyuns.jubjub.domain.customer.ordertracking.dto.OrderTrackingNotificationItemResponse;
import io.github.dongyuns.jubjub.domain.customer.ordertracking.dto.OrderTrackingNotificationListResponse;
import io.github.dongyuns.jubjub.domain.core.ordertracking.entity.OrderTracking;
import io.github.dongyuns.jubjub.domain.core.ordertracking.entity.OrderTrackingNotification;
import io.github.dongyuns.jubjub.domain.core.ordertracking.entity.OrderTrackingStatus;
import io.github.dongyuns.jubjub.domain.core.ordertracking.repository.OrderTrackingNotificationRepository;
import io.github.dongyuns.jubjub.domain.core.member.entity.MemberProfile;
import io.github.dongyuns.jubjub.domain.core.member.repository.MemberProfileRepository;
import io.github.dongyuns.jubjub.domain.core.order.entity.Order;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class OrderTrackingNotificationService {

    private final OrderTrackingNotificationRepository orderTrackingNotificationRepository;
    private final AccountRepository accountRepository;
    private final MemberProfileRepository memberProfileRepository;

    @Transactional
    public void createIfNeeded(Order order, OrderTracking tracking) {
        String title = titleOf(tracking.getStatus());
        if (orderTrackingNotificationRepository.findTopByOrderIdAndTitleOrderByCreatedAtDesc(order.getId(), title).isPresent()) {
            return;
        }

        orderTrackingNotificationRepository.save(
                OrderTrackingNotification.of(
                        order.getMemberProfileId(),
                        order.getId(),
                        title,
                        messageOf(order, tracking)
                )
        );
    }

    @Transactional(readOnly = true)
    public OrderTrackingNotificationListResponse getMyNotifications(String accountEmail) {
        MemberProfile memberProfile = findMemberProfile(accountEmail);
        List<OrderTrackingNotificationItemResponse> notifications = orderTrackingNotificationRepository
                .findAllByMemberProfileIdOrderByCreatedAtDesc(memberProfile.getId()).stream()
                .map(OrderTrackingNotificationItemResponse::from)
                .toList();

        long unreadCount = orderTrackingNotificationRepository.countByMemberProfileIdAndReadFalse(memberProfile.getId());
        return new OrderTrackingNotificationListResponse(unreadCount, notifications);
    }

    @Transactional
    public void markAllAsRead(String accountEmail) {
        MemberProfile memberProfile = findMemberProfile(accountEmail);
        List<OrderTrackingNotification> notifications = orderTrackingNotificationRepository
                .findAllByMemberProfileIdOrderByCreatedAtDesc(memberProfile.getId());

        notifications.forEach(OrderTrackingNotification::markAsRead);
    }

    @Transactional
    public void markAsRead(String accountEmail, Long notificationId) {
        MemberProfile memberProfile = findMemberProfile(accountEmail);
        OrderTrackingNotification notification = orderTrackingNotificationRepository
                .findByIdAndMemberProfileId(notificationId, memberProfile.getId())
                .orElseThrow(() -> new BusinessException(
                        "ORDER_TRACKING_NOTIFICATION_NOT_FOUND",
                        "알림을 찾을 수 없습니다.",
                        HttpStatus.NOT_FOUND
                ));

        notification.markAsRead();
    }

    @Transactional
    public boolean markAsReadIfExists(String accountEmail, Long notificationId) {
        MemberProfile memberProfile = findMemberProfile(accountEmail);
        return orderTrackingNotificationRepository.findByIdAndMemberProfileId(notificationId, memberProfile.getId())
                .map(notification -> {
                    notification.markAsRead();
                    return true;
                })
                .orElse(false);
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

    private String titleOf(OrderTrackingStatus status) {
        return switch (status) {
            case RECEIVED -> "주문이 접수되었어요";
            case COOKING -> "주문이 조리중이에요";
            case READY_FOR_PICKUP -> "픽업 준비 완료";
            case PICKED_UP -> "픽업이 완료되었어요";
        };
    }

    private String messageOf(Order order, OrderTracking tracking) {
        return switch (tracking.getStatus()) {
            case RECEIVED -> "주문이 정상적으로 접수되었습니다. 주문 현황에서 진행 상태를 확인해 주세요.";
            case COOKING -> order.getStore().getName() + "에서 주문을 조리하고 있습니다.";
            case READY_FOR_PICKUP -> "주문하신 메뉴가 픽업 준비되었습니다. 매장에 방문해 주세요.";
            case PICKED_UP -> "주문이 픽업 완료 처리되었습니다. 이용해주셔서 감사합니다.";
        };
    }
}
