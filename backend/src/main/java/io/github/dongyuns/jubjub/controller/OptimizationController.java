package io.github.dongyuns.jubjub.controller;

import io.github.dongyuns.jubjub.dto.RouteOptimizeRequest;
import io.github.dongyuns.jubjub.dto.RouteOptimizeResponse;
import io.github.dongyuns.jubjub.service.route.OptimizationService;
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