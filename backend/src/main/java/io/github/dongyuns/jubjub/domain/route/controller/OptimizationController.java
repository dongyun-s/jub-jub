package io.github.dongyuns.jubjub.domain.route.controller;

import io.github.dongyuns.jubjub.domain.route.dto.RouteOptimizeRequest;
import io.github.dongyuns.jubjub.domain.route.dto.RouteOptimizeResponse;
import io.github.dongyuns.jubjub.domain.route.service.OptimizationService;
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
