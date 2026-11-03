package io.github.dongyuns.jubjub.domain.customer.route.controller;

import io.github.dongyuns.jubjub.domain.customer.route.dto.RouteOptimizeRequest;
import io.github.dongyuns.jubjub.domain.customer.route.dto.RouteOptimizeResponse;
import io.github.dongyuns.jubjub.domain.customer.route.service.OptimizationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/optimization")
public class OptimizationController {

    private final OptimizationService optimizationService;

    @PostMapping("/route")
    public RouteOptimizeResponse optimizeRoute(@RequestBody @Valid RouteOptimizeRequest request) {
        return optimizationService.optimize(request);
    }
}
