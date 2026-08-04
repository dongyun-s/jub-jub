package io.github.dongyuns.jubjub.domain.core.order.service;

import io.github.dongyuns.jubjub.common.exception.BusinessException;
import io.github.dongyuns.jubjub.domain.core.cart.entity.Cart;
import io.github.dongyuns.jubjub.domain.core.cart.entity.CartOption;
import io.github.dongyuns.jubjub.domain.core.cart.repository.CartRepository;
import io.github.dongyuns.jubjub.domain.core.menu.entity.MenuOption;
import io.github.dongyuns.jubjub.domain.core.account.entity.Account;
import io.github.dongyuns.jubjub.domain.core.account.repository.AccountRepository;
import io.github.dongyuns.jubjub.domain.customer.coupon.dto.DiscountCalculateRequest;
import io.github.dongyuns.jubjub.domain.customer.coupon.dto.DiscountCalculateResponse;
import io.github.dongyuns.jubjub.domain.core.reward.event.PickupCompletedEvent;
import io.github.dongyuns.jubjub.domain.core.coupon.service.DiscountCalculatorService;
import io.github.dongyuns.jubjub.domain.core.store.entity.Store;
import io.github.dongyuns.jubjub.domain.core.store.repository.StoreRepository;
import io.github.dongyuns.jubjub.domain.core.member.entity.MemberProfile;
import io.github.dongyuns.jubjub.domain.core.member.repository.MemberProfileRepository;
import io.github.dongyuns.jubjub.domain.core.order.entity.Order;
import io.github.dongyuns.jubjub.domain.core.order.entity.OrderItem;
import io.github.dongyuns.jubjub.domain.core.order.entity.OrderItemOption;
import io.github.dongyuns.jubjub.domain.core.order.entity.OrderStatus;
import io.github.dongyuns.jubjub.domain.core.payment.entity.Payment;
import io.github.dongyuns.jubjub.domain.core.payment.service.PickupDistanceService;
import io.github.dongyuns.jubjub.domain.customer.order.dto.CreateOrderRequest;
import io.github.dongyuns.jubjub.domain.customer.order.dto.OrderHistoryResponse;
import io.github.dongyuns.jubjub.domain.customer.order.dto.OrderResponse;
import io.github.dongyuns.jubjub.domain.core.order.repository.OrderRepository;
import io.github.dongyuns.jubjub.domain.core.payment.repository.PaymentRepository;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final AccountRepository accountRepository;
    private final MemberProfileRepository memberProfileRepository;
    private final StoreRepository storeRepository;
    private final PaymentRepository paymentRepository;
    private final DiscountCalculatorService discountCalculatorService;
    private final PickupDistanceService pickupDistanceService;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public OrderResponse createOrder(String accountEmail, CreateOrderRequest request) {
        if (accountEmail == null || accountEmail.isBlank()) {
            throw new BusinessException("UNAUTHORIZED", "로그인한 사용자만 주문을 생성할 수 있습니다.", HttpStatus.UNAUTHORIZED);
        }

        Account account = accountRepository.findByEmail(accountEmail)
                .orElseThrow(() -> new BusinessException("ACCOUNT_NOT_FOUND", "로그인 계정을 찾을 수 없습니다.", HttpStatus.NOT_FOUND));
        MemberProfile memberProfile = memberProfileRepository.findByAccount(account)
                .orElseThrow(() -> new BusinessException("MEMBER_PROFILE_NOT_FOUND", "회원 프로필을 찾을 수 없습니다.", HttpStatus.NOT_FOUND));
        Store store = storeRepository.findById(request.storeId())
                .orElseThrow(() -> new BusinessException("STORE_NOT_FOUND", "매장을 찾을 수 없습니다.", HttpStatus.NOT_FOUND));
        List<Cart> carts = validateCartAmount(memberProfile, store, request.totalAmount());

        List<Long> memberCouponIds = normalizeCouponIds(request.memberCouponIds());
        DiscountCalculateResponse discountInfo = discountCalculatorService.calculateDiscount(
                accountEmail,
                new DiscountCalculateRequest(request.totalAmount(), memberCouponIds)
        );

        int ecoDiscountAmount = Boolean.TRUE.equals(request.useMultiUseContainer()) ? 200 : 0;
        int finalAmount = Math.max(0, discountInfo.getFinalPaymentAmount() - ecoDiscountAmount);

        // 주문 생성 시 고객 식별은 JWT 기준으로 서버가 결정하고, 클라이언트는 매장/금액만 보낸다.
        String orderNo = "ORD-" + request.storeId() + "-" + LocalDateTime.now().toString().replace(":", "").replace(".", "");
        Order order = Order.ready(
                memberProfile,
                store,
                orderNo,
                discountInfo.getOriginalAmount(),
                discountInfo.getTierDiscountAmount(),
                discountInfo.getCouponDiscountAmount(),
                ecoDiscountAmount,
                finalAmount,
                Boolean.TRUE.equals(request.useMultiUseContainer()),
                null,
                null,
                memberCouponIds
        );
        carts.forEach(cart -> order.addItem(toOrderItem(cart)));
        return OrderResponse.from(orderRepository.save(order));
    }

    // 픽업 완료 처리 및 리워드 이벤트 발행
    @Transactional
    public void completePickup(Long orderId) {
        // 1. 주문 조회
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException("ORDER_NOT_FOUND", "주문을 찾을 수 없습니다.", HttpStatus.NOT_FOUND));

        if (order.getStatus() != OrderStatus.PAID) {
            throw new BusinessException("ORDER_NOT_PAID", "결제 완료 주문만 픽업 완료 처리할 수 있습니다.", HttpStatus.CONFLICT);
        }

        int walkedDistanceMeters = pickupDistanceService.calculatePickupDistanceMeters(
                requireOrderLatitude(order),
                requireOrderLongitude(order),
                order.getStore()
        );

        // 2. 주문 상태를 픽업 완료로 변경 (Order 엔티티에 해당 메서드가 있다고 가정)
        order.completePickup();

        // 3. 리워드 적립 이벤트 발행
        eventPublisher.publishEvent(new PickupCompletedEvent(
                order.getMemberProfile().getAccount().getEmail(),
                100,
                walkedDistanceMeters,
                order.getId(),
                Boolean.TRUE.equals(order.getUseMultiUseContainer())
        ));
    }

    @Transactional(readOnly = true)
    public List<OrderHistoryResponse> getMyOrders(String accountEmail) {
        if (accountEmail == null || accountEmail.isBlank()) {
            throw new BusinessException("UNAUTHORIZED", "로그인한 사용자만 주문 내역을 조회할 수 있습니다.", HttpStatus.UNAUTHORIZED);
        }

        Account account = accountRepository.findByEmail(accountEmail)
                .orElseThrow(() -> new BusinessException("ACCOUNT_NOT_FOUND", "로그인 계정을 찾을 수 없습니다.", HttpStatus.NOT_FOUND));
        MemberProfile memberProfile = memberProfileRepository.findByAccount(account)
                .orElseThrow(() -> new BusinessException("MEMBER_PROFILE_NOT_FOUND", "회원 프로필을 찾을 수 없습니다.", HttpStatus.NOT_FOUND));

        return orderRepository.findAllByMemberProfile_IdOrderByCreatedAtDesc(memberProfile.getId()).stream()
                .map(order -> OrderHistoryResponse.from(order, findLatestPayment(order.getId())))
                .toList();
    }

    private List<Cart> validateCartAmount(MemberProfile memberProfile, Store store, Integer requestedAmount) {
        if (requestedAmount == null || requestedAmount <= 0) {
            throw new BusinessException("INVALID_ORDER_AMOUNT", "주문 금액은 1원 이상이어야 합니다.", HttpStatus.BAD_REQUEST);
        }

        List<Cart> carts = cartRepository.findAllByMemberProfileId(memberProfile.getId());
        if (carts.isEmpty()) {
            throw new BusinessException("CART_EMPTY", "장바구니가 비어 있습니다.", HttpStatus.CONFLICT);
        }

        Long cartStoreId = carts.get(0).getStore().getId();
        if (!cartStoreId.equals(store.getId())) {
            throw new BusinessException("CART_STORE_MISMATCH", "장바구니 매장과 주문 매장이 일치하지 않습니다.", HttpStatus.CONFLICT);
        }

        int totalCartPrice = carts.stream()
                .mapToInt(this::calculateCartItemTotalPrice)
                .sum();

        if (totalCartPrice != requestedAmount) {
            throw new BusinessException(
                    "ORDER_AMOUNT_MISMATCH",
                    "주문 금액이 장바구니 총액과 일치하지 않습니다.",
                    HttpStatus.CONFLICT
            );
        }

        return carts;
    }

    private int calculateCartItemTotalPrice(Cart cart) {
        int optionTotalPrice = cart.getCartOptions().stream()
                .map(CartOption::getMenuOption)
                .mapToInt(menuOption -> menuOption.getAdditionalPrice())
                .sum();

        return (cart.getMenu().getPrice() + optionTotalPrice) * cart.getQuantity();
    }

    private OrderItem toOrderItem(Cart cart) {
        int optionTotalPrice = cart.getCartOptions().stream()
                .map(CartOption::getMenuOption)
                .mapToInt(MenuOption::getAdditionalPrice)
                .sum();
        int itemTotalAmount = (cart.getMenu().getPrice() + optionTotalPrice) * cart.getQuantity();

        OrderItem item = OrderItem.builder()
                .menuId(cart.getMenu().getId())
                .menuName(cart.getMenu().getName())
                .menuPrice(cart.getMenu().getPrice())
                .quantity(cart.getQuantity())
                .requestMemo(cart.getRequestMemo())
                .itemTotalAmount(itemTotalAmount)
                .build();

        cart.getCartOptions().stream()
                .map(CartOption::getMenuOption)
                .map(menuOption -> OrderItemOption.builder()
                        .menuOptionId(menuOption.getId())
                        .optionName(menuOption.getName())
                        .additionalPrice(menuOption.getAdditionalPrice())
                        .build())
                .forEach(item::addOption);

        return item;
    }

    private List<Long> normalizeCouponIds(List<Long> couponIds) {
        if (couponIds == null || couponIds.isEmpty()) {
            return Collections.emptyList();
        }
        if (new HashSet<>(couponIds).size() != couponIds.size()) {
            throw new BusinessException("DUPLICATE_COUPON", "같은 쿠폰을 중복 사용할 수 없습니다.", HttpStatus.BAD_REQUEST);
        }
        return new ArrayList<>(couponIds);
    }

    private Payment findLatestPayment(Long orderId) {
        return paymentRepository.findTopByOrderIdOrderByIdDesc(orderId).orElse(null);
    }

    private double requireOrderLatitude(Order order) {
        if (order.getUserLatitude() == null) {
            throw new BusinessException("ORDER_COORDINATE_MISSING", "주문 시점 위치 정보가 없습니다.", HttpStatus.CONFLICT);
        }
        return order.getUserLatitude();
    }

    private double requireOrderLongitude(Order order) {
        if (order.getUserLongitude() == null) {
            throw new BusinessException("ORDER_COORDINATE_MISSING", "주문 시점 위치 정보가 없습니다.", HttpStatus.CONFLICT);
        }
        return order.getUserLongitude();
    }

}
