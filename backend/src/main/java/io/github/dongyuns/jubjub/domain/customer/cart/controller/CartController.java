package io.github.dongyuns.jubjub.domain.customer.cart.controller;

import io.github.dongyuns.jubjub.domain.customer.cart.dto.CartAddRequest;
import io.github.dongyuns.jubjub.domain.customer.cart.dto.CartListResponse;
import io.github.dongyuns.jubjub.domain.customer.cart.service.CartService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/carts")
@RequiredArgsConstructor
@Tag(name = "Cart", description = "장바구니 관련 API")
public class CartController {

    private final CartService cartService;

    /**
     * 장바구니 담기 API
     * [POST] /api/v1/carts
     */
    @PostMapping
    @Operation(summary = "장바구니 담기", description = "선택한 매장의 메뉴와 옵션을 장바구니에 담습니다. (주의: 다른 매장의 메뉴는 함께 담을 수 없습니다)")
    public ResponseEntity<String> addCartItem(Authentication authentication, @RequestBody CartAddRequest request) {
        cartService.addCartItem(authentication.getName(), request);

        // 프론트엔드에게 성공했다고 200 OK와 함께 메시지 보내주기
        return ResponseEntity.ok("장바구니에 메뉴가 성공적으로 담겼습니다! 🛒");
    }

    /**
     * 장바구니 조회 API
     * [GET] /api/v1/carts
     */
    @GetMapping
    @Operation(summary = "내 장바구니 조회", description = "장바구니에 담긴 메뉴 목록과 계산된 총 결제 금액을 조회합니다.")
    public ResponseEntity<CartListResponse> getMyCart(Authentication authentication) {
        CartListResponse response = cartService.getMyCart(authentication.getName());

        return ResponseEntity.ok(response);
    }

    /**
     * 장바구니 아이템 개별 삭제
     * [DELETE] /api/v1/carts/{cartId}
     */
    @DeleteMapping("/{cartId}")
    @Operation(summary = "장바구니 메뉴 개별 삭제", description = "장바구 de 아이템 하나를 삭제합니다.")
    public ResponseEntity<String> removeCartItem(Authentication authentication, @PathVariable Long cartId) {
        cartService.removeCartItem(authentication.getName(), cartId);
        return ResponseEntity.ok("장바구니에서 메뉴가 삭제되었습니다.");
    }

    /**
     * 장바구니 전체 비우기
     * [DELETE] /api/v1/carts
     */
    @DeleteMapping
    @Operation(summary = "장바구니 전체 비우기", description = "내 장바구니를 싹 비웁니다.")
    public ResponseEntity<String> clearCart(Authentication authentication) {
        cartService.clearCart(authentication.getName());
        return ResponseEntity.ok("장바구니가 비워졌습니다.");
    }
}
