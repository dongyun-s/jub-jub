package io.github.dongyuns.jubjub.domain.customer.order.controller;

import io.github.dongyuns.jubjub.domain.customer.order.dto.CreateOrderRequest;
import io.github.dongyuns.jubjub.domain.customer.order.dto.OrderHistoryResponse;
import io.github.dongyuns.jubjub.domain.customer.order.dto.OrderResponse;
import io.github.dongyuns.jubjub.domain.core.order.service.OrderService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @GetMapping("/me")
    public List<OrderHistoryResponse> getMyOrders(Authentication authentication) {
        return orderService.getMyOrders(authentication != null ? authentication.getName() : null);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrderResponse createOrder(Authentication authentication, @Valid @RequestBody CreateOrderRequest request) {
        // 결제 전 단계에서 주문만 먼저 만들어 내부 기준 금액을 확정한다.
        return orderService.createOrder(authentication != null ? authentication.getName() : null, request);
    }
}
