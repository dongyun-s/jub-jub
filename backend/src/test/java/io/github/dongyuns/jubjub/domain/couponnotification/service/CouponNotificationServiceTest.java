package io.github.dongyuns.jubjub.domain.couponnotification.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import io.github.dongyuns.jubjub.domain.auth.repository.AccountRepository;
import io.github.dongyuns.jubjub.domain.couponnotification.entity.CouponNotification;
import io.github.dongyuns.jubjub.domain.couponnotification.repository.CouponNotificationRepository;
import io.github.dongyuns.jubjub.domain.reward.entity.CouponPolicy;
import io.github.dongyuns.jubjub.domain.reward.entity.MemberCoupon;
import io.github.dongyuns.jubjub.domain.user.repository.MemberProfileRepository;
import java.time.LocalDateTime;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CouponNotificationServiceTest {

    @Mock
    private CouponNotificationRepository couponNotificationRepository;

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private MemberProfileRepository memberProfileRepository;

    @InjectMocks
    private CouponNotificationService couponNotificationService;

    @Test
    @DisplayName("쿠폰 발급 시 쿠폰 알림을 생성한다.")
    void createIssuedNotification_savesNotification() {
        MemberCoupon memberCoupon = MemberCoupon.builder()
                .memberProfileId(1L)
                .couponPolicyId(2L)
                .expiredAt(LocalDateTime.now().plusDays(30))
                .build();
        forceSetId(memberCoupon, 10L);

        CouponPolicy couponPolicy = CouponPolicy.builder()
                .name("주문 적립 1,000원 할인 쿠폰")
                .conditionType("DISTANCE")
                .discountAmount(1000)
                .validDays(30)
                .build();
        forceSetId(couponPolicy, 2L);

        given(couponNotificationRepository.findTopByMemberCouponIdOrderByCreatedAtDesc(10L))
                .willReturn(Optional.empty());

        couponNotificationService.createIssuedNotification(memberCoupon, couponPolicy);

        ArgumentCaptor<CouponNotification> captor = ArgumentCaptor.forClass(CouponNotification.class);
        verify(couponNotificationRepository).save(captor.capture());

        CouponNotification saved = captor.getValue();
        assertThat(saved.getMemberProfileId()).isEqualTo(1L);
        assertThat(saved.getMemberCouponId()).isEqualTo(10L);
        assertThat(saved.getCouponPolicyId()).isEqualTo(2L);
        assertThat(saved.getTitle()).isEqualTo("주문 적립 1,000원 할인 쿠폰이(가) 도착했어요");
        assertThat(saved.getMessage()).contains("쿠폰함에서 확인해보세요.");
        assertThat(saved.getMessage()).contains("유효기간은 발급일로부터 30일입니다.");
    }

    @Test
    @DisplayName("같은 쿠폰에 대한 알림이 이미 있으면 중복 생성하지 않는다.")
    void createIssuedNotification_skipsDuplicateNotification() {
        MemberCoupon memberCoupon = MemberCoupon.builder()
                .memberProfileId(1L)
                .couponPolicyId(2L)
                .expiredAt(LocalDateTime.now().plusDays(30))
                .build();
        forceSetId(memberCoupon, 10L);

        CouponPolicy couponPolicy = CouponPolicy.builder()
                .name("에코 200원 할인 쿠폰")
                .conditionType("ECO")
                .discountAmount(200)
                .validDays(30)
                .build();
        forceSetId(couponPolicy, 2L);

        given(couponNotificationRepository.findTopByMemberCouponIdOrderByCreatedAtDesc(10L))
                .willReturn(Optional.of(CouponNotification.of(1L, 10L, 2L, "기존", "기존")));

        couponNotificationService.createIssuedNotification(memberCoupon, couponPolicy);

        verify(couponNotificationRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }

    private void forceSetId(Object target, Long id) {
        try {
            java.lang.reflect.Field field = target.getClass().getDeclaredField("id");
            field.setAccessible(true);
            field.set(target, id);
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException(e);
        }
    }
}
