package io.github.dongyuns.jubjub.domain.ordertracking.service;

import io.github.dongyuns.jubjub.common.exception.BusinessException;
import io.github.dongyuns.jubjub.domain.auth.entity.Account;
import io.github.dongyuns.jubjub.domain.auth.repository.AccountRepository;
import io.github.dongyuns.jubjub.domain.ordertracking.dto.OrderTrackingResponse;
import io.github.dongyuns.jubjub.domain.ordertracking.entity.OrderTracking;
import io.github.dongyuns.jubjub.domain.user.entity.MemberProfile;
import io.github.dongyuns.jubjub.domain.user.repository.MemberProfileRepository;
import io.github.dongyuns.jubjub.payment.domain.Order;
import io.github.dongyuns.jubjub.payment.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class OrderTrackingQueryService {

    private final AccountRepository accountRepository;
    private final MemberProfileRepository memberProfileRepository;
    private final OrderRepository orderRepository;
    private final OrderTrackingLifecycleService orderTrackingLifecycleService;

    @Transactional
    public OrderTrackingResponse getMyTracking(String accountEmail, Long orderId) {
        if (accountEmail == null || accountEmail.isBlank()) {
            throw new BusinessException("UNAUTHORIZED", "로그인한 사용자만 주문 현황을 조회할 수 있습니다.", HttpStatus.UNAUTHORIZED);
        }

        Account account = accountRepository.findByEmail(accountEmail)
                .orElseThrow(() -> new BusinessException("ACCOUNT_NOT_FOUND", "로그인 계정을 찾을 수 없습니다.", HttpStatus.NOT_FOUND));
        MemberProfile memberProfile = memberProfileRepository.findByAccount(account)
                .orElseThrow(() -> new BusinessException("MEMBER_PROFILE_NOT_FOUND", "회원 프로필을 찾을 수 없습니다.", HttpStatus.NOT_FOUND));
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException("ORDER_NOT_FOUND", "주문을 찾을 수 없습니다.", HttpStatus.NOT_FOUND));

        if (!order.getMemberProfileId().equals(memberProfile.getId())) {
            throw new BusinessException("ORDER_FORBIDDEN", "본인 주문만 조회할 수 있습니다.", HttpStatus.FORBIDDEN);
        }

        OrderTracking tracking = orderTrackingLifecycleService.ensureTracking(order);
        return OrderTrackingResponse.from(order, tracking);
    }
}
