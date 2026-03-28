package io.github.dongyuns.jubjub.payment.service;

import io.github.dongyuns.jubjub.common.exception.BusinessException;
import io.github.dongyuns.jubjub.domain.cart.entity.Cart;
import io.github.dongyuns.jubjub.domain.cart.entity.CartOption;
import io.github.dongyuns.jubjub.domain.cart.repository.CartRepository;
import io.github.dongyuns.jubjub.domain.auth.entity.Account;
import io.github.dongyuns.jubjub.domain.auth.repository.AccountRepository;
import io.github.dongyuns.jubjub.domain.store.entity.Store;
import io.github.dongyuns.jubjub.domain.store.repository.StoreRepository;
import io.github.dongyuns.jubjub.domain.user.entity.MemberProfile;
import io.github.dongyuns.jubjub.domain.user.repository.MemberProfileRepository;
import io.github.dongyuns.jubjub.payment.domain.Order;
import io.github.dongyuns.jubjub.payment.dto.CreateOrderRequest;
import io.github.dongyuns.jubjub.payment.dto.OrderResponse;
import io.github.dongyuns.jubjub.payment.repository.OrderRepository;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
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
        validateCartAmount(memberProfile, store, request.totalAmount());

        // 주문 생성 시 고객 식별은 JWT 기준으로 서버가 결정하고, 클라이언트는 매장/금액만 보낸다.
        String orderNo = "ORD-" + request.storeId() + "-" + LocalDateTime.now().toString().replace(":", "").replace(".", "");
        Order order = Order.ready(memberProfile, store, orderNo, request.totalAmount());
        return OrderResponse.from(orderRepository.save(order));
    }

    private void validateCartAmount(MemberProfile memberProfile, Store store, Integer requestedAmount) {
        if (requestedAmount == null || requestedAmount <= 0) {
            throw new BusinessException("INVALID_ORDER_AMOUNT", "주문 금액은 1원 이상이어야 합니다.", HttpStatus.BAD_REQUEST);
        }

        java.util.List<Cart> carts = cartRepository.findAllByMemberProfileId(memberProfile.getId());
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
    }

    private int calculateCartItemTotalPrice(Cart cart) {
        int optionTotalPrice = cart.getCartOptions().stream()
                .map(CartOption::getMenuOption)
                .mapToInt(menuOption -> menuOption.getAdditionalPrice())
                .sum();

        return (cart.getMenu().getPrice() + optionTotalPrice) * cart.getQuantity();
    }
}
