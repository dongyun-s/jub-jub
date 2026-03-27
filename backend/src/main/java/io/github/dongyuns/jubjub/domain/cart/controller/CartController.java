package io.github.dongyuns.jubjub.domain.cart.controller;

import io.github.dongyuns.jubjub.domain.cart.dto.CartAddRequest;
import io.github.dongyuns.jubjub.domain.cart.dto.CartListResponse;
import io.github.dongyuns.jubjub.domain.cart.service.CartService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
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
    public ResponseEntity<String> addCartItem(@RequestBody CartAddRequest request) {

        // 🚨 [백엔드 꿀팁] 유저 ID 하드코딩 (테스트용)
        // 실제 운영에서는 @AuthenticationPrincipal 등을 써서 JWT 토큰에서 로그인한 유저 ID를 빼와야 합니다!
        // 하지만 지금은 프론트와 '장바구니 담기' 통신 자체가 잘 되는지 테스트하기 위해
        // DB에 있는 '1번 회원(1L)'이 담는다고 가정하고 고정해 두겠습니다. (나중에 수정할 부분!)
        Long currentMemberProfileId = 1L;

        // 서비스(뇌)에게 일 시키기!
        cartService.addCartItem(currentMemberProfileId, request);

        // 프론트엔드에게 성공했다고 200 OK와 함께 메시지 보내주기
        return ResponseEntity.ok("장바구니에 메뉴가 성공적으로 담겼습니다! 🛒");
    }

    /**
     * 장바구니 조회 API
     * [GET] /api/v1/carts
     */
    @GetMapping
    @Operation(summary = "내 장바구니 조회", description = "장바구니에 담긴 메뉴 목록과 계산된 총 결제 금액을 조회합니다.")
    public ResponseEntity<CartListResponse> getMyCart() {

        // 🚨 아까 담기(POST) 할 때처럼, 유저 ID는 일단 1번으로 고정! (나중에 로그인 연동 시 수정)
        Long currentMemberProfileId = 1L;

        CartListResponse response = cartService.getMyCart(currentMemberProfileId);

        return ResponseEntity.ok(response);
    }

    /**
     * 장바구니 아이템 개별 삭제
     * [DELETE] /api/v1/carts/{cartId}
     */
    @DeleteMapping("/{cartId}")
    @Operation(summary = "장바구니 메뉴 개별 삭제", description = "장바구 de 아이템 하나를 삭제합니다.")
    public ResponseEntity<String> removeCartItem(@PathVariable Long cartId) {
        cartService.removeCartItem(cartId);
        return ResponseEntity.ok("장바구니에서 메뉴가 삭제되었습니다.");
    }

    /**
     * 장바구니 전체 비우기
     * [DELETE] /api/v1/carts
     */
    @DeleteMapping
    @Operation(summary = "장바구니 전체 비우기", description = "내 장바구니를 싹 비웁니다.")
    public ResponseEntity<String> clearCart() {
        Long currentMemberProfileId = 1L; // 임시 ID
        cartService.clearCart(currentMemberProfileId);
        return ResponseEntity.ok("장바구니가 비워졌습니다.");
    }
}