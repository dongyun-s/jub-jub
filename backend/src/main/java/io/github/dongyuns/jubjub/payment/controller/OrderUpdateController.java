package io.github.dongyuns.jubjub.payment.controller;

// import io.swagger.v3.oas.annotations.Hidden;
import io.github.dongyuns.jubjub.payment.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// @Hidden // 프론트엔드 팀이 보는 Swagger 문서에서 이 테스트 API를 숨깁니다.
@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderUpdateController {

    private final OrderService orderService;

    /**
     * 점주용: 픽업 완료 처리 API
     * POST /api/v1/orders/{orderId}/complete
     */
    @PostMapping("/{orderId}/complete")
    public ResponseEntity<String> completePickup(@PathVariable Long orderId) {
        orderService.completePickup(orderId);
        return ResponseEntity.ok("픽업 완료 처리되었습니다. 리워드가 자동으로 적립됩니다.");
    }
}