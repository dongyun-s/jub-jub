package io.github.dongyuns.jubjub.domain.cart.service;

import io.github.dongyuns.jubjub.domain.cart.dto.CartAddRequest;
import io.github.dongyuns.jubjub.domain.cart.entity.Cart;
import io.github.dongyuns.jubjub.domain.cart.entity.CartOption;
import io.github.dongyuns.jubjub.domain.cart.repository.CartRepository;
import io.github.dongyuns.jubjub.domain.user.entity.MemberProfile; // 패키지 맞는지 확인!
import io.github.dongyuns.jubjub.domain.user.repository.MemberProfileRepository; // 패키지 맞는지 확인!
import io.github.dongyuns.jubjub.domain.store.entity.Menu;
import io.github.dongyuns.jubjub.domain.store.entity.MenuOption;
import io.github.dongyuns.jubjub.domain.store.entity.Store;
import io.github.dongyuns.jubjub.domain.store.repository.MenuOptionRepository;
import io.github.dongyuns.jubjub.domain.store.repository.MenuRepository;
import io.github.dongyuns.jubjub.domain.store.repository.StoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    public void addCartItem(Long memberProfileId, CartAddRequest request) {

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
        MemberProfile memberProfile = memberProfileRepository.findById(memberProfileId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
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
}