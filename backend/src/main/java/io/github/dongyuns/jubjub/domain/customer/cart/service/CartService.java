package io.github.dongyuns.jubjub.domain.customer.cart.service;

import io.github.dongyuns.jubjub.common.exception.BusinessException;
import io.github.dongyuns.jubjub.domain.customer.cart.dto.CartAddRequest;
import io.github.dongyuns.jubjub.domain.customer.cart.dto.CartItemResponse;
import io.github.dongyuns.jubjub.domain.customer.cart.dto.CartListResponse;
import io.github.dongyuns.jubjub.domain.customer.cart.dto.CartOptionResponse;
import io.github.dongyuns.jubjub.domain.core.cart.entity.Cart;
import io.github.dongyuns.jubjub.domain.core.cart.entity.CartOption;
import io.github.dongyuns.jubjub.domain.core.cart.repository.CartRepository;
import io.github.dongyuns.jubjub.domain.core.member.entity.MemberProfile; // 패키지 맞는지 확인!
import io.github.dongyuns.jubjub.domain.core.member.repository.MemberProfileRepository; // 패키지 맞는지 확인!
import io.github.dongyuns.jubjub.domain.core.menu.entity.Menu;
import io.github.dongyuns.jubjub.domain.core.menu.entity.MenuOption;
import io.github.dongyuns.jubjub.domain.core.store.entity.Store;
import io.github.dongyuns.jubjub.domain.core.menu.repository.MenuOptionRepository;
import io.github.dongyuns.jubjub.domain.core.menu.repository.MenuRepository;
import io.github.dongyuns.jubjub.domain.core.store.repository.StoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional // 에러 나면 다 같이 취소되게 묶어주는 마법의 어노테이션!
public class CartService {

    // 우리가 만든 Cart 저장소
    private final CartRepository cartRepository;

    // 다른 동네(Domain)에서 빌려올 저장소들
    private final MemberProfileRepository memberProfileRepository;
    private final StoreRepository storeRepository;
    private final MenuRepository menuRepository;
    private final MenuOptionRepository menuOptionRepository;

    /**
     * 장바구니 담기 로직
     */
    public void addCartItem(String accountEmail, CartAddRequest request) {
        MemberProfile memberProfile = resolveMemberProfile(accountEmail);
        Long memberProfileId = memberProfile.getId();

        // 다른 매장 메뉴 담기 금지!
        List<Cart> existingCarts = cartRepository.findAllByMemberProfileId(memberProfileId);
        if (!existingCarts.isEmpty()) {
            Long existingStoreId = existingCarts.get(0).getStore().getId(); // 기존에 담긴 매장 번호

            if (!existingStoreId.equals(request.getStoreId())) {
                // 기존 매장과 지금 담으려는 매장이 다르면 에러 폭발! 💣
                throw new IllegalArgumentException("장바구니에는 같은 매장의 메뉴만 담을 수 있습니다. 다른 매장의 메뉴를 담으려면 기존 장바구니를 비워주세요!");
            }
        }

        // 1. DB에서 유저, 가게, 메뉴 정보 찾아오기
        Store store = storeRepository.findById(request.getStoreId())
                .orElseThrow(() -> new IllegalArgumentException("가게를 찾을 수 없습니다."));
        Menu menu = menuRepository.findById(request.getMenuId())
                .orElseThrow(() -> new IllegalArgumentException("메뉴를 찾을 수 없습니다."));

        // 2. 장바구니(Cart) 조립하기
        Cart cart = Cart.builder()
                .memberProfile(memberProfile)
                .store(store)
                .menu(menu)
                .quantity(request.getQuantity())
                .requestMemo(request.getRequestMemo())
                .build();

        // 3. 사용자가 선택한 옵션이 있다면? 장바구니 옵션(CartOption) 만들어서 묶어주기!
        if (request.getOptionIds() != null && !request.getOptionIds().isEmpty()) {
            List<MenuOption> options = menuOptionRepository.findAllById(request.getOptionIds());

            for (MenuOption option : options) {
                CartOption cartOption = CartOption.builder()
                        .menuOption(option)
                        .build();
                cartOption.assignCart(cart); // "너는 이 장바구니 소속이야!" 라고 도장 찍어줌
                cart.getCartOptions().add(cartOption);
            }
        }

        // 4. DB에 최종 저장! (Cart만 저장해도 CartOption까지 알아서 묶여서 저장됩니다)
        cartRepository.save(cart);
    }

    /**
     * 장바구니 조회 로직 (백엔드 계산기 🧮)
     */
    @Transactional(readOnly = true) // 🌟 조회만 할 때는 readOnly=true 를 붙이면 성능이 훨씬 빨라집니다!
    public CartListResponse getMyCart(String accountEmail) {
        Long memberProfileId = resolveMemberProfile(accountEmail).getId();

        // 1. 내 장바구니 데이터 다 가져오기
        List<Cart> carts = cartRepository.findAllByMemberProfileId(memberProfileId);

        // 🚨 장바구니가 텅텅 비어있다면? 에러 내지 말고 '빈 상자'를 예쁘게 반환!
        if (carts.isEmpty()) {
            return CartListResponse.builder()
                    .cartItems(List.of()) // 빈 리스트
                    .totalCartPrice(0) // 결제 금액 0원
                    .build();
        }

        // 우리 장바구니는 무조건 '1개 매장'만 담기니까, 첫 번째 아이템에서 가게 정보를 뽑아옵니다.
        Store store = carts.get(0).getStore();
        int totalCartPrice = 0; // 💰 프론트엔드에게 넘겨줄 장바구니 전체 결제 금액

        List<CartItemResponse> cartItemResponses = new ArrayList<>();

        // 2. 장바구니에 담긴 메뉴들을 하나씩 꺼내서 계산하고 예쁘게 포장하기
        for (Cart cart : carts) {
            int menuPrice = cart.getMenu().getPrice(); // 메뉴 기본가
            int optionTotalPrice = 0; // 이 메뉴의 옵션들 가격 합계

            List<CartOptionResponse> optionResponses = new ArrayList<>();

            // 2-1. 이 메뉴에 달린 옵션들 포장 및 가격 계산
            for (CartOption cartOption : cart.getCartOptions()) {
                MenuOption menuOption = cartOption.getMenuOption();
                optionTotalPrice += menuOption.getAdditionalPrice(); // 옵션 가격 더하기

                optionResponses.add(CartOptionResponse.builder()
                        .optionId(menuOption.getId())
                        .optionName(menuOption.getName())
                        .additionalPrice(menuOption.getAdditionalPrice())
                        .build());
            }

            // 2-2. 💰 이 메뉴 1세트의 총 가격 = (메뉴 기본가 + 옵션 총합) * 수량
            int itemTotalPrice = (menuPrice + optionTotalPrice) * cart.getQuantity();
            totalCartPrice += itemTotalPrice; // 장바구니 전체 금액 금고에 누적!

            // 2-3. 메뉴 1개 단위(중간 상자) 포장 완료
            cartItemResponses.add(CartItemResponse.builder()
                    .cartId(cart.getId())
                    .menuId(cart.getMenu().getId())
                    .menuName(cart.getMenu().getName())
                    .menuPrice(menuPrice)
                    .quantity(cart.getQuantity())
                    .requestMemo(cart.getRequestMemo())
                    .options(optionResponses)
                    .itemTotalPrice(itemTotalPrice)
                    .build());
        }

        // 3. 제일 큰 상자에 가게 이름이랑 총액까지 싹 담아서 프론트엔드로 배송 출발! 📦
        return CartListResponse.builder()
                .storeId(store.getId())
                .storeName(store.getName())
                .cartItems(cartItemResponses)
                .totalCartPrice(totalCartPrice)
                .build();
    }
    
    /**
     * 장바구니 특정 아이템 삭제
     */
    public void removeCartItem(String accountEmail, Long cartId) {
        Long memberProfileId = resolveMemberProfile(accountEmail).getId();
        Cart cart = cartRepository.findByIdAndMemberProfileId(cartId, memberProfileId)
                .orElseThrow(() -> new BusinessException("CART_ITEM_NOT_FOUND", "해당 장바구니 항목을 찾을 수 없습니다.", HttpStatus.NOT_FOUND));
        cartRepository.delete(cart);
    }

    /**
     * 장바구니 전체 비우기
     */
    public void clearCart(String accountEmail) {
        Long memberProfileId = resolveMemberProfile(accountEmail).getId();
        // 내 장바구니 아이템들을 싹 찾아와서
        List<Cart> myCarts = cartRepository.findAllByMemberProfileId(memberProfileId);
        // 한 번에 삭제!
        cartRepository.deleteAll(myCarts);
    }

    private MemberProfile resolveMemberProfile(String accountEmail) {
        return memberProfileRepository.findByAccountEmail(accountEmail)
                .orElseThrow(() -> new BusinessException("MEMBER_PROFILE_NOT_FOUND", "회원 프로필을 찾을 수 없습니다.", HttpStatus.NOT_FOUND));
    }
}
