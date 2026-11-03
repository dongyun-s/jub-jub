package io.github.dongyuns.jubjub.domain.owner.order.controller;

import io.github.dongyuns.jubjub.common.response.ApiResponse;
import io.github.dongyuns.jubjub.domain.core.ordertracking.entity.OrderTrackingStatus;
import io.github.dongyuns.jubjub.domain.owner.order.dto.OwnerOrderDetailResponse;
import io.github.dongyuns.jubjub.domain.owner.order.dto.OwnerOrderListResponse;
import io.github.dongyuns.jubjub.domain.owner.order.dto.OwnerOrderRejectRequest;
import io.github.dongyuns.jubjub.domain.owner.order.dto.OwnerOrderStatusResponse;
import io.github.dongyuns.jubjub.domain.owner.order.service.OwnerOrderService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/owner/orders")
@RequiredArgsConstructor
public class OwnerOrderController {

    private final OwnerOrderService ownerOrderService;

    @GetMapping
    public ApiResponse<List<OwnerOrderListResponse>> getOrders(
            Authentication authentication,
            @RequestParam(required = false) OrderTrackingStatus status
    ) {
        return ApiResponse.success(ownerOrderService.getOrders(authentication.getName(), status));
    }

    @GetMapping("/{orderId}")
    public ApiResponse<OwnerOrderDetailResponse> getOrder(
            Authentication authentication,
            @PathVariable Long orderId
    ) {
        return ApiResponse.success(ownerOrderService.getOrder(authentication.getName(), orderId));
    }

    @PatchMapping("/{orderId}/accept")
    public ApiResponse<OwnerOrderStatusResponse> accept(Authentication authentication, @PathVariable Long orderId) {
        return ApiResponse.success(ownerOrderService.accept(authentication.getName(), orderId));
    }

    @PatchMapping("/{orderId}/reject")
    public ApiResponse<OwnerOrderStatusResponse> reject(
            Authentication authentication,
            @PathVariable Long orderId,
            @Valid @RequestBody OwnerOrderRejectRequest request
    ) {
        return ApiResponse.success(ownerOrderService.reject(authentication.getName(), orderId, request.reason()));
    }

    @PatchMapping("/{orderId}/ready")
    public ApiResponse<OwnerOrderStatusResponse> markReady(Authentication authentication, @PathVariable Long orderId) {
        return ApiResponse.success(ownerOrderService.markReady(authentication.getName(), orderId));
    }

    @PatchMapping("/{orderId}/complete")
    public ApiResponse<OwnerOrderStatusResponse> complete(Authentication authentication, @PathVariable Long orderId) {
        return ApiResponse.success(ownerOrderService.complete(authentication.getName(), orderId));
    }
}
