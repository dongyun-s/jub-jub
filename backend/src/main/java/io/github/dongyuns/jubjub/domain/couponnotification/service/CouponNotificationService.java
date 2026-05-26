package io.github.dongyuns.jubjub.domain.couponnotification.service;

import io.github.dongyuns.jubjub.common.exception.BusinessException;
import io.github.dongyuns.jubjub.domain.auth.entity.Account;
import io.github.dongyuns.jubjub.domain.auth.repository.AccountRepository;
import io.github.dongyuns.jubjub.domain.couponnotification.dto.CouponNotificationItemResponse;
import io.github.dongyuns.jubjub.domain.couponnotification.dto.CouponNotificationListResponse;
import io.github.dongyuns.jubjub.domain.couponnotification.entity.CouponNotification;
import io.github.dongyuns.jubjub.domain.couponnotification.repository.CouponNotificationRepository;
import io.github.dongyuns.jubjub.domain.reward.entity.CouponPolicy;
import io.github.dongyuns.jubjub.domain.reward.entity.MemberCoupon;
import io.github.dongyuns.jubjub.domain.user.repository.MemberProfileRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CouponNotificationService {

    private final CouponNotificationRepository couponNotificationRepository;
    private final AccountRepository accountRepository;
    private final MemberProfileRepository memberProfileRepository;

    @Transactional
    public void createIssuedNotification(MemberCoupon memberCoupon, CouponPolicy couponPolicy) {
        if (couponNotificationRepository.findTopByMemberCouponIdOrderByCreatedAtDesc(memberCoupon.getId()).isPresent()) {
            return;
        }

        couponNotificationRepository.save(
                CouponNotification.of(
                        memberCoupon.getMemberProfileId(),
                        memberCoupon.getId(),
                        couponPolicy.getId(),
                        titleOf(couponPolicy),
                        messageOf(couponPolicy)
                )
        );
    }

    @Transactional(readOnly = true)
    public CouponNotificationListResponse getMyNotifications(String accountEmail) {
        Long memberProfileId = findMemberProfileId(accountEmail);
        List<CouponNotificationItemResponse> notifications = couponNotificationRepository
                .findAllByMemberProfileIdOrderByCreatedAtDesc(memberProfileId).stream()
                .map(CouponNotificationItemResponse::from)
                .toList();

        long unreadCount = couponNotificationRepository.countByMemberProfileIdAndReadFalse(memberProfileId);
        return new CouponNotificationListResponse(unreadCount, notifications);
    }

    @Transactional
    public void markAllAsRead(String accountEmail) {
        Long memberProfileId = findMemberProfileId(accountEmail);
        List<CouponNotification> notifications = couponNotificationRepository
                .findAllByMemberProfileIdOrderByCreatedAtDesc(memberProfileId);

        notifications.forEach(CouponNotification::markAsRead);
    }

    @Transactional
    public void markAsRead(String accountEmail, Long notificationId) {
        Long memberProfileId = findMemberProfileId(accountEmail);
        CouponNotification notification = couponNotificationRepository
                .findByIdAndMemberProfileId(notificationId, memberProfileId)
                .orElseThrow(() -> new BusinessException(
                        "COUPON_NOTIFICATION_NOT_FOUND",
                        "쿠폰 알림을 찾을 수 없습니다.",
                        HttpStatus.NOT_FOUND
                ));

        notification.markAsRead();
    }

    @Transactional
    public boolean markAsReadIfExists(String accountEmail, Long notificationId) {
        Long memberProfileId = findMemberProfileId(accountEmail);
        return couponNotificationRepository.findByIdAndMemberProfileId(notificationId, memberProfileId)
                .map(notification -> {
                    notification.markAsRead();
                    return true;
                })
                .orElse(false);
    }

    private Long findMemberProfileId(String accountEmail) {
        if (accountEmail == null || accountEmail.isBlank()) {
            throw new BusinessException("UNAUTHORIZED", "로그인한 사용자만 알림을 조회할 수 있습니다.", HttpStatus.UNAUTHORIZED);
        }

        Account account = accountRepository.findByEmail(accountEmail)
                .orElseThrow(() -> new BusinessException("ACCOUNT_NOT_FOUND", "로그인 계정을 찾을 수 없습니다.", HttpStatus.NOT_FOUND));
        return memberProfileRepository.findIdByAccountEmail(account.getEmail())
                .orElseThrow(() -> new BusinessException("MEMBER_PROFILE_NOT_FOUND", "회원 프로필을 찾을 수 없습니다.", HttpStatus.NOT_FOUND));
    }

    private String titleOf(CouponPolicy couponPolicy) {
        return couponPolicy.getName() + "이(가) 도착했어요";
    }

    private String messageOf(CouponPolicy couponPolicy) {
        return "쿠폰함에서 확인해보세요. "
                + couponPolicy.getName()
                + " 쿠폰이 발급되었어요."
                + expirySuffix(couponPolicy);
    }

    private String expirySuffix(CouponPolicy couponPolicy) {
        if (couponPolicy.getValidDays() == null) {
            return "";
        }
        return " 유효기간은 발급일로부터 " + couponPolicy.getValidDays() + "일입니다.";
    }
}
